import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { parseNfeXml, type NfeData } from "@falcao-erp/shared-types";
import type { InvoiceXmlCheckDto, PayableDto, PayableWithInvoiceCheckDto } from "@falcao-erp/shared-types";
import { decodeUploadName } from "../../common/utils/file-name";
import { fromDateOnly, money } from "../../common/utils/date-only";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { uploadExtension } from "../storage/upload-policy";
import { PayablesRepository, type PayablePayload } from "./payables.repository";
import { PayablesService } from "./payables.service";

type UploadedInvoice = { originalname: string; buffer: Buffer };
export type InvoiceFileKind = "pdf" | "xml";

const formatCnpj = (digits: string) =>
  digits.length === 14 ? digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : digits;

/**
 * Arquivos da nota fiscal de uma conta a pagar (PDF do DANFE e/ou XML da NF-e).
 * O XML é lido para preencher número, emissão e chave, e conferido contra a conta.
 */
@Injectable()
export class InvoiceFilesService {
  constructor(
    private readonly repository: PayablesRepository,
    private readonly payables: PayablesService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  /** Lê o XML sem gravar nada — usado para criar uma conta a partir da nota. */
  async preview(companyId: string, file: UploadedInvoice): Promise<InvoiceXmlCheckDto> {
    const nfe = this.parseOrThrow(file);
    return this.check(companyId, nfe, null);
  }

  async upload(companyId: string, id: string, file: UploadedInvoice): Promise<PayableWithInvoiceCheckDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    if (existing.status === "CANCELADO") {
      throw new BadRequestException("Contas canceladas não recebem nota fiscal.");
    }

    const fileName = decodeUploadName(file.originalname);
    const kind = this.kindOf(fileName);
    const nfe = kind === "xml" ? this.parseOrThrow(file) : null;

    const stored = await this.storage.save(file.buffer, { folder: `payables/${id}`, fileName });
    const previous = kind === "pdf" ? existing.notaFiscalPdfPath : existing.notaFiscalXmlPath;

    const payable = await this.repository.update(companyId, id, {
      ...(kind === "pdf"
        ? { notaFiscalPdfPath: stored.path, notaFiscalPdfName: fileName }
        : { notaFiscalXmlPath: stored.path, notaFiscalXmlName: fileName }),
      ...(nfe
        ? {
            notaFiscal: nfe.numero,
            notaFiscalChave: nfe.chave,
            ...(nfe.emissao ? { notaFiscalEmissao: fromDateOnly(nfe.emissao) } : {}),
          }
        : {}),
    });
    if (previous) await this.storage.delete(previous);

    return {
      payable: await this.payables.getById(companyId, payable.id),
      xml: nfe ? await this.check(companyId, nfe, payable) : null,
    };
  }

  async remove(companyId: string, id: string, kind: InvoiceFileKind): Promise<PayableDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    const path = kind === "pdf" ? existing.notaFiscalPdfPath : existing.notaFiscalXmlPath;
    await this.repository.update(
      companyId,
      id,
      kind === "pdf"
        ? { notaFiscalPdfPath: null, notaFiscalPdfName: null }
        : { notaFiscalXmlPath: null, notaFiscalXmlName: null },
    );
    if (path) await this.storage.delete(path);
    return this.payables.getById(companyId, id);
  }

  private kindOf(fileName: string): InvoiceFileKind {
    const ext = uploadExtension(fileName);
    if (ext === ".pdf") return "pdf";
    if (ext === ".xml") return "xml";
    throw new BadRequestException("Envie o PDF (DANFE) ou o XML da nota fiscal.");
  }

  private parseOrThrow(file: UploadedInvoice): NfeData {
    if (uploadExtension(decodeUploadName(file.originalname)) !== ".xml") {
      throw new BadRequestException("Envie o arquivo XML da NF-e.");
    }
    const nfe = parseNfeXml(file.buffer.toString("utf8"));
    if (!nfe) {
      throw new BadRequestException("Este XML não é de uma NF-e (modelo 55).");
    }
    return nfe;
  }

  /** Confere a nota contra a conta e o cadastro; tudo que não bate vira aviso, sem bloquear. */
  private async check(companyId: string, nfe: NfeData, payable: PayablePayload | null): Promise<InvoiceXmlCheckDto> {
    const avisos: string[] = [];
    const supplier = nfe.emitente.cnpj ? await this.repository.findSupplierByCnpj(companyId, nfe.emitente.cnpj) : null;

    if (nfe.emitente.cnpj && !supplier) {
      avisos.push(`O emitente (${formatCnpj(nfe.emitente.cnpj)}) não está cadastrado como fornecedor.`);
    }
    if (payable && payable.supplierId && supplier && payable.supplierId !== supplier.id) {
      avisos.push(`A nota é de ${supplier.nomeFantasia}, mas a conta está em nome de ${payable.supplier?.nomeFantasia ?? "outro fornecedor"}.`);
    }
    if (payable && nfe.valor && money(payable.valor) !== nfe.valor) {
      avisos.push(`O valor da nota (R$ ${nfe.valor}) é diferente do valor da conta (R$ ${money(payable.valor)}).`);
    }
    const companyCnpj = await this.repository.companyCnpj(companyId);
    if (companyCnpj && nfe.destinatario.cnpj && nfe.destinatario.cnpj !== companyCnpj) {
      avisos.push(`A nota foi emitida para outro CNPJ (${formatCnpj(nfe.destinatario.cnpj)}).`);
    }
    if (!nfe.chave) {
      avisos.push("O XML não tem a chave de acesso de 44 dígitos.");
    } else {
      const duplicate = await this.repository.findByInvoiceKey(companyId, nfe.chave, payable?.id);
      if (duplicate) avisos.push(`Esta nota já está lançada em outra conta: "${duplicate.descricao}".`);
    }

    return {
      numero: nfe.numero,
      chave: nfe.chave,
      emissao: nfe.emissao,
      valor: nfe.valor,
      emitenteCnpj: nfe.emitente.cnpj,
      emitenteNome: nfe.emitente.nome,
      supplierId: supplier?.id ?? null,
      supplierName: supplier?.nomeFantasia ?? null,
      primeiroVencimento: nfe.duplicatas.map((d) => d.vencimento).find((v) => v !== null) ?? null,
      avisos,
    };
  }
}
