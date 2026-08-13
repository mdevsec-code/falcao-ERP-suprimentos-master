import type { ApprovalAction, PurchaseRequestStatus, Role } from "./enums";

/**
 * Single source of truth for the Solicitações de Compras pipeline (see spec:
 * Solicitante → Gestor → Compras → Cotação → Pedido → Recebimento →
 * Finalizado), reused by the backend (authoritative enforcement) and the
 * frontend (deciding which action buttons to render).
 */
export const ALLOWED_TRANSITIONS: Record<PurchaseRequestStatus, PurchaseRequestStatus[]> = {
  AGUARDANDO_APROVACAO: ["EM_COMPRAS", "REJEITADO", "AGUARDANDO_APROVACAO"],
  EM_COMPRAS: ["EM_COTACAO", "REJEITADO"],
  EM_COTACAO: ["PEDIDO_REALIZADO", "REJEITADO"],
  PEDIDO_REALIZADO: ["AGUARDANDO_RECEBIMENTO", "REJEITADO"],
  AGUARDANDO_RECEBIMENTO: ["FINALIZADO", "REJEITADO"],
  FINALIZADO: [],
  REJEITADO: [],
};

/** Who may act on a request currently sitting at a given status. */
export const ROLES_BY_CURRENT_STATUS: Record<PurchaseRequestStatus, Role[]> = {
  AGUARDANDO_APROVACAO: ["MANAGER", "ADMIN"],
  EM_COMPRAS: ["BUYER", "ADMIN"],
  EM_COTACAO: ["BUYER", "ADMIN"],
  PEDIDO_REALIZADO: ["BUYER", "WAREHOUSE", "ADMIN"],
  AGUARDANDO_RECEBIMENTO: ["WAREHOUSE", "ADMIN"],
  FINALIZADO: [],
  REJEITADO: [],
};

export function resolveApprovalAction(
  from: PurchaseRequestStatus,
  to: PurchaseRequestStatus,
): ApprovalAction {
  if (to === "REJEITADO") return "REJECT";
  if (to === from) return "REQUEST_CHANGES";
  return "APPROVE";
}
