import type { ApprovalStep, PurchaseRequestStatus, Role } from "@falcao-erp/shared-types";

/**
 * Quem vê uma solicitação de compra — a mesma regra para todas as rotas com
 * `:id` (detalhe, histórico, edição, status, assinatura, comentários, anexos).
 *
 * - Compras, financeiro, almoxarifado, gerência, auditoria e administrador veem
 *   todas da empresa (é o trabalho deles; a lista já mostra todas para eles).
 * - O solicitante vê as próprias, as que já assinou e as que esperam a
 *   assinatura dele na etapa atual — o mesmo que a lista mostra para ele.
 *
 * Quem não pode ver recebe "não encontrada" (404), como se o id não existisse.
 */
export interface PurchaseRequestAccessUser {
  userId: string;
  role: Role | string;
}

export interface PurchaseRequestAccessFacts {
  requesterId: string;
  status: PurchaseRequestStatus;
  currentStep: ApprovalStep | null;
  /** Quem já assinou alguma etapa. */
  signerIds: readonly string[];
}

/** Perfis restritos às próprias solicitações (e às que assinam). */
export const OWN_REQUESTS_ONLY_ROLES: readonly string[] = ["REQUESTER"];

export function seesOnlyOwnRequests(user: PurchaseRequestAccessUser): boolean {
  return OWN_REQUESTS_ONLY_ROLES.includes(user.role);
}

/** `signableSteps`: etapas que o usuário assina (só é consultado para quem vê apenas as próprias). */
export function canViewPurchaseRequest(
  user: PurchaseRequestAccessUser,
  request: PurchaseRequestAccessFacts,
  signableSteps: readonly ApprovalStep[],
): boolean {
  if (!seesOnlyOwnRequests(user)) return true;
  if (request.requesterId === user.userId) return true;
  if (request.signerIds.includes(user.userId)) return true;
  return (
    request.status === "AGUARDANDO_APROVACAO" &&
    request.currentStep !== null &&
    signableSteps.includes(request.currentStep)
  );
}

/** Removem anexo enviado por outra pessoa; os demais, só o que enviaram ou o da própria solicitação. */
export const ATTACHMENT_MANAGE_ROLES: readonly string[] = ["ADMIN", "MANAGER", "BUYER"];

export function canRemovePurchaseRequestAttachment(
  user: PurchaseRequestAccessUser,
  request: { requesterId: string },
  attachment: { uploadedById: string },
): boolean {
  return (
    ATTACHMENT_MANAGE_ROLES.includes(user.role) ||
    attachment.uploadedById === user.userId ||
    request.requesterId === user.userId
  );
}
