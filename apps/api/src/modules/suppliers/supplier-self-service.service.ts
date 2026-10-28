import { ConflictException, ForbiddenException, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { Prisma, type Supplier } from "@prisma/client";
import { buildSupplierSearchText, cnpjDigits, formatCnpjMask } from "@falcao-erp/shared-types";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { WechatService } from "../mail/wechat.service";
import { PublicSupplierIdentityDto } from "./dto/public-supplier-identity.dto";

/** Resposta 422 que a tela pública usa para mostrar o formulário de cadastro. */
export const REGISTRATION_REQUIRED_MESSAGE = "CNPJ não cadastrado. Preencha os dados da empresa para continuar.";

/**
 * Fornecedor já aprovado tentando entrar por um link aberto: o CNPJ é público, então
 * entrar só com ele permitiria responder em nome de outra empresa. A mensagem não
 * confirma nem nega o cadastro além do necessário e vai nos dois idiomas da equipe.
 */
export const INVITE_ONLY_MESSAGE =
  "Por segurança, este CNPJ responde pelo convite individual. O setor de compras foi avisado e vai enviar o convite para o contato cadastrado. · 为安全起见，该税号需通过单独邀请回复。采购部门已收到通知，将向登记的联系人发送邀请。";

/**
 * Fornecedor que chega por um link público (cotação aberta ou catálogo) se
 * identifica pelo CNPJ. CNPJ conhecido → usa o cadastro existente. CNPJ novo →
 * cria o cadastro como *pendente* (inativo) até compras revisar.
 */
@Injectable()
export class SupplierSelfServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly wechat: WechatService,
  ) {}

  /**
   * `inviteOnly`: fornecedor já aprovado não entra (link aberto da cotação) — compras
   * é avisado para mandar o convite. Sem ela (catálogo), entra: o envio só vale
   * depois da revisão item a item de compras, e quem chama avisa compras (`alertBuyers`).
   */
  async resolveOrRegister(
    companyId: string,
    dto: PublicSupplierIdentityDto,
    options: { inviteOnly?: { context: string; path: string } } = {},
  ): Promise<{ supplier: Supplier; created: boolean }> {
    const existing = await this.findByCnpj(companyId, dto.cnpj);
    if (existing) {
      this.assertUsable(existing);
      if (options.inviteOnly && !existing.cadastroPendente) {
        await this.alertBuyers(companyId, existing, dto.nomeResponsavel, options.inviteOnly);
        throw new ConflictException(INVITE_ONLY_MESSAGE);
      }
      return { supplier: existing, created: false };
    }

    const cadastro = dto.cadastro;
    if (!cadastro) throw new UnprocessableEntityException(REGISTRATION_REQUIRED_MESSAGE);

    const fields = {
      cnpj: formatCnpjMask(dto.cnpj),
      razaoSocial: cadastro.razaoSocial.trim(),
      nomeFantasia: cadastro.nomeFantasia.trim(),
      categoria: cadastro.categoria ?? "OUTROS",
      cidade: cadastro.cidade.trim(),
      estado: cadastro.estado,
    };
    try {
      const supplier = await this.prisma.supplier.create({
        data: {
          companyId,
          ...fields,
          searchText: buildSupplierSearchText(fields),
          responsavel: dto.nomeResponsavel.trim(),
          isActive: false,
          cadastroPendente: true,
          contacts: {
            create: [
              { type: "EMAIL", label: "Cadastro pelo link", value: cadastro.email.trim() },
              { type: "PHONE", label: "Cadastro pelo link", value: cadastro.telefone.trim() },
            ],
          },
        },
      });
      return { supplier, created: true };
    } catch (error) {
      // Dois envios simultâneos com o mesmo CNPJ: o segundo usa o cadastro do primeiro.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await this.findByCnpj(companyId, dto.cnpj);
        if (raced) return { supplier: this.assertUsable(raced), created: false };
      }
      throw error;
    }
  }

  /**
   * Avisa compras (e-mail e WeChat) que o CNPJ de um fornecedor cadastrado foi usado
   * num link aberto. `invite`: pediu para entrar na cotação (foi barrado). `confirm`:
   * mandou catálogo — entrou para revisão, mas quem mandou pode não ser o fornecedor.
   */
  async alertBuyers(
    companyId: string,
    supplier: Supplier,
    informedBy: string,
    target: { context: string; path: string },
    kind: "invite" | "confirm" = "invite",
  ): Promise<void> {
    const recipients = await this.prisma.forCompany(companyId).user.findMany({
      where: { role: { in: ["BUYER", "ADMIN"] }, isActive: true },
      select: { email: true, wechatToken: true },
    });
    const url = this.mail.link(target.path);
    const title = kind === "invite" ? `Convite pedido: ${supplier.nomeFantasia}` : `Confirmar envio: ${supplier.nomeFantasia}`;
    this.mail.send({
      to: recipients.map((user) => user.email),
      subject: title,
      heading: kind === "invite" ? "Fornecedor cadastrado pediu para participar" : "Catálogo enviado com CNPJ de fornecedor cadastrado",
      paragraphs: [
        `Alguém informou o CNPJ de ${supplier.nomeFantasia} no link aberto (${target.context}).`,
        kind === "invite"
          ? "Por segurança, fornecedores já cadastrados respondem pelo convite individual. Se o pedido for legítimo, convide o fornecedor pelo contato cadastrado — não pelo contato informado agora."
          : "O link é aberto e o CNPJ é público: antes de aceitar os itens, confirme o envio com o contato cadastrado do fornecedor — não com o contato informado agora.",
      ],
      details: [
        ["Fornecedor", supplier.razaoSocial],
        ["CNPJ", supplier.cnpj],
        ["Nome informado", informedBy.trim()],
      ],
      action: { label: "Abrir", url },
    });
    this.wechat.send(
      recipients.map((user) => user.wechatToken),
      {
        title: kind === "invite" ? `${title} · 供应商请求邀请` : `${title} · 请向登记联系人确认目录`,
        lines: [`${supplier.razaoSocial} — CNPJ ${supplier.cnpj}`, `${target.context}`, `Informado por: ${informedBy.trim()}`],
        action: { label: "Abrir · 打开", url },
      },
    );
  }

  /** O CNPJ pode estar gravado com ou sem máscara. */
  private findByCnpj(companyId: string, cnpj: string) {
    return this.prisma.supplier.findFirst({
      where: { companyId, cnpj: { in: [cnpjDigits(cnpj), formatCnpjMask(cnpj)] } },
    });
  }

  /** Fornecedor desativado por compras não volta a participar pelo link. */
  private assertUsable(supplier: Supplier): Supplier {
    if (!supplier.isActive && !supplier.cadastroPendente) {
      throw new ForbiddenException("Este cadastro está inativo. Entre em contato com o setor de compras.");
    }
    return supplier;
  }
}
