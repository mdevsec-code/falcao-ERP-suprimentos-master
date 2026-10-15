import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  APPROVAL_STEPS,
  APPROVAL_STEP_LABELS,
  nextApprovalStep,
  type ApprovalStep,
  type ApprovalStepConfigDto,
} from "@falcao-erp/shared-types";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { WechatService } from "../mail/wechat.service";
import { SignPurchaseRequestDto } from "./dto/approval.dto";
import { PurchaseRequestsRepository, type PurchaseRequestDetailPayload } from "./purchase-requests.repository";

/** Quem recebe os avisos: e-mail e, se a pessoa ligou no perfil, WeChat. */
const RECIPIENT_SELECT = { email: true, wechatToken: true } as const;

/** Etapas em chinês para os avisos no WeChat (a equipe lê nos dois idiomas). */
const STEP_LABELS_ZH: Record<ApprovalStep, string> = {
  TECNICO: "技术负责人",
  COMPRAS: "采购",
  CUSTOS: "成本",
  GERENTE_GERAL: "总经理",
};

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Assinaturas do plano de aquisição: técnico → compras → custos → gerente geral.
 * Cada etapa é assinada por um dos usuários configurados para ela (ou por um
 * administrador); a última aprovação manda o pedido para compras cotar.
 */
@Injectable()
export class PurchaseRequestApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PurchaseRequestsRepository,
    private readonly mail: MailService,
    private readonly wechat: WechatService,
  ) {}

  // ── Configuração: quem assina cada etapa ──────────────────────────────────

  async stepsConfig(companyId: string): Promise<ApprovalStepConfigDto[]> {
    const rows = await this.prisma.approvalStepApprover.findMany({
      where: { companyId, user: { isActive: true } },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { user: { name: "asc" } },
    });
    return APPROVAL_STEPS.map((step) => ({
      step,
      approvers: rows.filter((row) => row.step === step).map((row) => row.user),
    }));
  }

  async setStepApprovers(companyId: string, step: ApprovalStep, userIds: string[]): Promise<ApprovalStepConfigDto[]> {
    const found = await this.prisma.forCompany(companyId).user.count({ where: { id: { in: userIds }, isActive: true } });
    if (found !== userIds.length) throw new BadRequestException("Usuário não encontrado ou inativo.");
    await this.prisma.$transaction([
      this.prisma.approvalStepApprover.deleteMany({ where: { companyId, step } }),
      this.prisma.approvalStepApprover.createMany({ data: userIds.map((userId) => ({ companyId, step, userId })) }),
    ]);
    return this.stepsConfig(companyId);
  }

  /** Etapas que o usuário pode assinar: as configuradas para ele; o administrador, todas. */
  async signableSteps(user: AuthenticatedUser): Promise<ApprovalStep[]> {
    if (user.role === "ADMIN") return [...APPROVAL_STEPS];
    const rows = await this.prisma.approvalStepApprover.findMany({
      where: { companyId: user.companyId, userId: user.userId },
      select: { step: true },
    });
    return rows.map((row) => row.step);
  }

  // ── Assinatura ────────────────────────────────────────────────────────────

  async sign(
    user: AuthenticatedUser,
    id: string,
    dto: SignPurchaseRequestDto,
    meta: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const request = await this.repository.findByIdOrThrow(user.companyId, id);
    const step = request.currentStep;
    if (request.status !== "AGUARDANDO_APROVACAO" || !step) {
      throw new BadRequestException("Esta solicitação não está aguardando assinatura.");
    }
    if (!(await this.signableSteps(user)).includes(step)) {
      throw new ForbiddenException(`Você não está entre os aprovadores da etapa "${APPROVAL_STEP_LABELS[step]}".`);
    }
    const signer = await this.prisma.user.findUniqueOrThrow({ where: { id: user.userId }, select: { name: true } });
    const approved = dto.decision === "APROVADO";
    const next = approved ? nextApprovalStep(step) : null;
    const comment = dto.comment?.trim() || null;

    try {
      await this.prisma.$transaction(async (tx) => {
        // Condicionado à etapa: se outra pessoa assinou junto, só uma vale.
        const { count } = await tx.purchaseRequest.updateMany({
          where: { id, companyId: user.companyId, status: "AGUARDANDO_APROVACAO", currentStep: step },
          data: !approved
            ? { status: "REJEITADO", currentStep: null }
            : next
              ? { currentStep: next }
              : { status: "EM_COMPRAS", currentStep: null },
        });
        if (count === 0) throw new ConflictException("Esta etapa acabou de ser assinada por outra pessoa.");

        await tx.purchaseRequestSignature.create({
          data: {
            purchaseRequestId: id,
            step,
            decision: dto.decision,
            userId: user.userId,
            signerName: signer.name,
            signatureData: dto.signatureData,
            comment,
            ip: meta.ip?.slice(0, 64) ?? null,
            userAgent: meta.userAgent?.slice(0, 300) ?? null,
          },
        });
        // Linha do tempo: cada assinatura vira um registro de aprovação.
        await tx.purchaseRequestApproval.create({
          data: {
            purchaseRequestId: id,
            approverId: user.userId,
            action: approved ? "APPROVE" : "REJECT",
            fromStatus: "AGUARDANDO_APROVACAO",
            toStatus: !approved ? "REJEITADO" : next ? "AGUARDANDO_APROVACAO" : "EM_COMPRAS",
            comment: [`Assinatura — ${APPROVAL_STEP_LABELS[step]}.`, comment].filter(Boolean).join(" "),
          },
        });
        if (dto.saveSignature) {
          await tx.user.update({ where: { id: user.userId }, data: { signatureData: dto.signatureData } });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Esta etapa acabou de ser assinada por outra pessoa.");
      }
      throw error;
    }

    const updated = await this.repository.findByIdOrThrow(user.companyId, id);
    if (!approved) this.notifyRejected(updated, step, signer.name, comment);
    else if (next) void this.notifyStep(updated, next);
    else void this.notifyApproved(updated);
  }

  async mySignature(userId: string): Promise<{ signatureData: string | null }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { signatureData: true } });
    return { signatureData: user.signatureData };
  }

  async clearMySignature(userId: string): Promise<{ signatureData: null }> {
    await this.prisma.user.update({ where: { id: userId }, data: { signatureData: null } });
    return { signatureData: null };
  }

  // ── Avisos (e-mail + WeChat) ──────────────────────────────────────────────

  /** Pede a assinatura aos aprovadores da etapa (sem ninguém configurado: aos administradores). */
  async notifyStep(request: PurchaseRequestDetailPayload, step: ApprovalStep): Promise<void> {
    const approvers = await this.prisma.approvalStepApprover.findMany({
      where: { companyId: request.companyId, step, user: { isActive: true } },
      select: { user: { select: RECIPIENT_SELECT } },
    });
    const to = approvers.length > 0 ? approvers.map((row) => row.user) : await this.admins(request.companyId);
    const url = this.mail.link(`/solicitacoes/${request.id}`);
    this.mail.send({
      to: to.map((user) => user.email),
      subject: `Plano de aquisição nº ${request.numero} aguarda sua aprovação (${APPROVAL_STEP_LABELS[step]})`,
      heading: `Aprovação pendente — ${APPROVAL_STEP_LABELS[step]}`,
      paragraphs: [
        `O plano de aquisição nº ${request.numero} chegou à etapa "${APPROVAL_STEP_LABELS[step]}" e aguarda a sua assinatura.`,
        "Abra o pedido no sistema, confira os itens e assine para aprovar ou recusar.",
      ],
      details: this.details(request),
      action: { label: "Abrir e assinar", url },
    });
    this.wechat.send(
      to.map((user) => user.wechatToken),
      {
        title: `Nº ${request.numero} aguarda sua assinatura · 第${request.numero}号采购计划待您签字`,
        lines: [
          `Plano de aquisição nº ${request.numero} — ${request.title}`,
          `Etapa: ${APPROVAL_STEP_LABELS[step]} · 审批环节：${STEP_LABELS_ZH[step]}`,
          `Solicitante / 申请人: ${request.requester.name}`,
        ],
        action: { label: "Abrir e assinar · 打开并签字", url },
      },
    );
  }

  private async notifyApproved(request: PurchaseRequestDetailPayload): Promise<void> {
    const buyers = await this.prisma.approvalStepApprover.findMany({
      where: { companyId: request.companyId, step: "COMPRAS", user: { isActive: true } },
      select: { user: { select: RECIPIENT_SELECT } },
    });
    const to = [request.requester, ...buyers.map((row) => row.user)];
    const url = this.mail.link(`/solicitacoes/${request.id}`);
    this.mail.send({
      to: to.map((user) => user.email),
      subject: `Plano de aquisição nº ${request.numero} aprovado — seguir para cotação`,
      heading: "Plano de aquisição aprovado",
      paragraphs: [
        `O plano de aquisição nº ${request.numero} foi assinado por todas as etapas (técnico, compras, custos e gerente geral).`,
        "O setor de compras já pode fazer a cotação.",
      ],
      details: this.details(request),
      action: { label: "Abrir no sistema", url },
    });
    this.wechat.send(
      to.map((user) => user.wechatToken),
      {
        title: `Nº ${request.numero} aprovado · 第${request.numero}号采购计划已批准`,
        lines: [
          `Plano de aquisição nº ${request.numero} — ${request.title}`,
          "Assinado por todas as etapas. Compras já pode cotar.",
          "所有环节均已签字，采购部可以开始询价。",
        ],
        action: { label: "Abrir no sistema · 打开系统", url },
      },
    );
  }

  private notifyRejected(
    request: PurchaseRequestDetailPayload,
    step: ApprovalStep,
    signerName: string,
    comment: string | null,
  ): void {
    const url = this.mail.link(`/solicitacoes/${request.id}`);
    this.mail.send({
      to: [request.requester.email],
      subject: `Plano de aquisição nº ${request.numero} recusado (${APPROVAL_STEP_LABELS[step]})`,
      heading: "Plano de aquisição recusado",
      paragraphs: [
        `${signerName} recusou o plano de aquisição nº ${request.numero} na etapa "${APPROVAL_STEP_LABELS[step]}".`,
        ...(comment ? [`Motivo: ${comment}`] : []),
      ],
      details: this.details(request),
      action: { label: "Abrir no sistema", url },
    });
    this.wechat.send([request.requester.wechatToken], {
      title: `Nº ${request.numero} recusado · 第${request.numero}号采购计划被拒绝`,
      lines: [
        `Plano de aquisição nº ${request.numero} — ${request.title}`,
        `${signerName} recusou na etapa ${APPROVAL_STEP_LABELS[step]} · 在「${STEP_LABELS_ZH[step]}」环节被拒绝`,
        ...(comment ? [`Motivo / 原因: ${comment}`] : []),
      ],
      action: { label: "Abrir no sistema · 打开系统", url },
    });
  }

  private details(request: PurchaseRequestDetailPayload): Array<[string, string]> {
    const total = request.items.reduce(
      (sum, item) => sum + (item.estimatedPrice ? Number(item.estimatedPrice) * Number(item.quantity) : 0),
      0,
    );
    return [
      ["Solicitação", `nº ${request.numero} — ${request.title}`],
      ["Solicitante", request.requester.name],
      ["Projeto / obra", request.costCenter ?? "—"],
      ["Itens", String(request.items.length)],
      ...(total > 0 ? ([["Total estimado", brl(total)]] as Array<[string, string]>) : []),
    ];
  }

  private admins(companyId: string): Promise<Array<{ email: string; wechatToken: string | null }>> {
    return this.prisma.forCompany(companyId).user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: RECIPIENT_SELECT,
    });
  }
}
