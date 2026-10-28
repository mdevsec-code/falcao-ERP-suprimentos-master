import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import {
  buildSupplierSearchText,
  cnpjDigits,
  formatCnpjMask,
  SUPPLIER_CATEGORY_LABELS,
  type PublicSupplierSignupLinkDto,
  type PublicSupplierSignupResultDto,
} from "@falcao-erp/shared-types";
import { buildLinkToken, isValidLinkSignature, newLinkNonce, parseLinkToken } from "../../common/utils/signed-link";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { WechatService } from "../mail/wechat.service";
import { PublicSupplierSignupDto } from "./dto/public-supplier-signup.dto";

/**
 * Cadastro feito pelo próprio fornecedor, por um link da empresa (sem login).
 * O cadastro entra *pendente* e inativo; compras é avisado e aprova ou recusa
 * na ficha do fornecedor, como os cadastros que chegam pelos outros links.
 */
@Injectable()
export class SupplierSignupService {
  private readonly linkSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly wechat: WechatService,
    config: ConfigService,
  ) {
    this.linkSecret = config.getOrThrow<string>("JWT_SECRET");
  }

  // ── Link da empresa ───────────────────────────────────────────────────────

  async getLink(companyId: string): Promise<{ token: string | null }> {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    return { token: company.supplierSignupNonce ? this.token(companyId, company.supplierSignupNonce) : null };
  }

  /** Liga ou troca o link (o anterior deixa de funcionar). */
  async regenerateLink(companyId: string): Promise<{ token: string }> {
    const nonce = newLinkNonce();
    await this.prisma.company.update({ where: { id: companyId }, data: { supplierSignupNonce: nonce } });
    return { token: this.token(companyId, nonce) };
  }

  async disableLink(companyId: string): Promise<{ token: null }> {
    await this.prisma.company.update({ where: { id: companyId }, data: { supplierSignupNonce: null } });
    return { token: null };
  }

  // ── Página pública ────────────────────────────────────────────────────────

  async publicView(token: string): Promise<PublicSupplierSignupLinkDto> {
    const company = await this.companyByToken(token);
    return { empresa: company.name };
  }

  async publicSubmit(token: string, dto: PublicSupplierSignupDto): Promise<PublicSupplierSignupResultDto> {
    const company = await this.companyByToken(token);
    const clean = (text: string | undefined) => text?.trim() || null;
    const produtosServicos = clean(dto.produtosServicos);
    const produtosServicosZh = clean(dto.produtosServicosZh);
    if (!produtosServicos && !produtosServicosZh) {
      throw new BadRequestException("Descreva os produtos e serviços da empresa (em português ou em chinês).");
    }

    const existing = await this.prisma.supplier.findFirst({
      where: { companyId: company.id, cnpj: { in: [cnpjDigits(dto.cnpj), formatCnpjMask(dto.cnpj)] } },
      select: { id: true, nomeFantasia: true, razaoSocial: true, cnpj: true },
    });
    // CNPJ já cadastrado: a resposta é a mesma de um cadastro novo — senão qualquer
    // pessoa descobriria quem é fornecedor testando CNPJs. Nada é alterado; compras
    // recebe os dados enviados para conferir pelo contato que já tem.
    if (existing) {
      void this.notifyExistingSignup(company.id, existing, dto);
      return { fornecedor: dto.nomeFantasia.trim() };
    }

    const fields = {
      razaoSocial: dto.razaoSocial.trim(),
      nomeFantasia: dto.nomeFantasia.trim(),
      cnpj: formatCnpjMask(dto.cnpj),
      categoria: dto.categoria,
      cidade: dto.cidade.trim(),
      estado: dto.estado,
      atividades: clean(dto.atividades),
      atividadesZh: clean(dto.atividadesZh),
      produtosServicos,
      produtosServicosZh,
    };
    let supplierId: string;
    try {
      const supplier = await this.prisma.supplier.create({
        data: {
          ...fields,
          companyId: company.id,
          inscricaoEstadual: clean(dto.inscricaoEstadual),
          responsavel: dto.responsavel.trim(),
          isActive: false,
          cadastroPendente: true,
          searchText: buildSupplierSearchText(fields),
          contacts: {
            create: [
              { type: "EMAIL", label: "Cadastro pelo fornecedor", value: dto.email.trim() },
              { type: "PHONE", label: "Cadastro pelo fornecedor", value: dto.telefone.trim() },
            ],
          },
        },
      });
      supplierId = supplier.id;
    } catch (error) {
      // Dois envios juntos com o mesmo CNPJ: o segundo recebe a mesma resposta.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { fornecedor: dto.nomeFantasia.trim() };
      }
      throw error;
    }

    void this.notifyBuyers(company.id, supplierId, fields);
    return { fornecedor: fields.nomeFantasia };
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  /** Alguém mandou o autocadastro de um CNPJ que já é fornecedor: compras confere. */
  private async notifyExistingSignup(
    companyId: string,
    supplier: { id: string; nomeFantasia: string; razaoSocial: string; cnpj: string },
    dto: PublicSupplierSignupDto,
  ): Promise<void> {
    const recipients = await this.prisma.forCompany(companyId).user.findMany({
      where: { role: { in: ["BUYER", "ADMIN"] }, isActive: true },
      select: { email: true, wechatToken: true },
    });
    const url = this.mail.link(`/fornecedores/${supplier.id}`);
    this.mail.send({
      to: recipients.map((user) => user.email),
      subject: `Cadastro repetido: ${supplier.nomeFantasia}`,
      heading: "Autocadastro de um CNPJ que já é fornecedor",
      paragraphs: [
        `Alguém enviou o formulário de cadastro com o CNPJ de ${supplier.nomeFantasia}. O cadastro existente não foi alterado.`,
        "Se for o próprio fornecedor querendo atualizar os dados, confirme pelo contato que já está no cadastro antes de mudar qualquer coisa.",
      ],
      details: [
        ["CNPJ", supplier.cnpj],
        ["Nome informado", dto.nomeFantasia.trim()],
        ["Responsável informado", dto.responsavel.trim()],
        ["E-mail informado", dto.email.trim()],
        ["Telefone informado", dto.telefone.trim()],
      ],
      action: { label: "Abrir fornecedor", url },
    });
    this.wechat.send(
      recipients.map((user) => user.wechatToken),
      {
        title: `Cadastro repetido: ${supplier.nomeFantasia} · 重复注册`,
        lines: [`${supplier.razaoSocial} — CNPJ ${supplier.cnpj}`, "O cadastro existente não foi alterado · 现有资料未更改"],
        action: { label: "Abrir · 打开", url },
      },
    );
  }

  /** Compras (e administradores) recebem o aviso por e-mail e, se ligado, WeChat. */
  private async notifyBuyers(
    companyId: string,
    supplierId: string,
    supplier: { nomeFantasia: string; razaoSocial: string; cnpj: string; categoria: keyof typeof SUPPLIER_CATEGORY_LABELS; cidade: string; estado: string },
  ): Promise<void> {
    const recipients = await this.prisma.forCompany(companyId).user.findMany({
      where: { role: { in: ["BUYER", "ADMIN"] }, isActive: true },
      select: { email: true, wechatToken: true },
    });
    const url = this.mail.link(`/fornecedores/${supplierId}`);
    this.mail.send({
      to: recipients.map((user) => user.email),
      subject: `Novo cadastro de fornecedor: ${supplier.nomeFantasia}`,
      heading: "Novo cadastro de fornecedor",
      paragraphs: [
        `${supplier.nomeFantasia} se cadastrou pelo link de cadastro de fornecedores.`,
        "Confira os dados, as atividades e os produtos e aprove ou recuse o cadastro na ficha do fornecedor.",
      ],
      details: [
        ["Razão social", supplier.razaoSocial],
        ["CNPJ", supplier.cnpj],
        ["Categoria", SUPPLIER_CATEGORY_LABELS[supplier.categoria]],
        ["Cidade", `${supplier.cidade}/${supplier.estado}`],
      ],
      action: { label: "Revisar cadastro", url },
    });
    this.wechat.send(
      recipients.map((user) => user.wechatToken),
      {
        title: `Novo fornecedor: ${supplier.nomeFantasia} · 新供应商注册`,
        lines: [
          `${supplier.razaoSocial} — CNPJ ${supplier.cnpj}`,
          "Cadastro aguardando aprovação · 注册信息等待审核",
        ],
        action: { label: "Revisar cadastro · 审核注册", url },
      },
    );
  }

  private token(companyId: string, nonce: string): string {
    return buildLinkToken(this.linkSecret, "supplier-signup", companyId, nonce);
  }

  private async companyByToken(token: string) {
    const parsed = parseLinkToken(token);
    const notFound = new NotFoundException("Link de cadastro inválido ou desativado.");
    if (!parsed) throw notFound;
    const company = await this.prisma.company.findUnique({ where: { id: parsed.id } });
    if (
      !company?.isActive ||
      !company.supplierSignupNonce ||
      !isValidLinkSignature(this.linkSecret, "supplier-signup", company.id, company.supplierSignupNonce, parsed.signature)
    ) {
      throw notFound;
    }
    return company;
  }
}
