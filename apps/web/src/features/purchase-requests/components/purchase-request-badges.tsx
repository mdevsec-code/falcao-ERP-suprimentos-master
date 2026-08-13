import { APPROVAL_ACTION_LABELS, PURCHASE_REQUEST_STATUS_LABELS, type ApprovalAction, type PurchaseRequestStatus } from "@falcao-erp/shared-types";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<PurchaseRequestStatus, BadgeProps["variant"]> = {
  AGUARDANDO_APROVACAO: "warning",
  EM_COMPRAS: "default",
  EM_COTACAO: "default",
  PEDIDO_REALIZADO: "default",
  AGUARDANDO_RECEBIMENTO: "warning",
  FINALIZADO: "success",
  REJEITADO: "destructive",
};

export function PurchaseRequestStatusBadge({ status }: { status: PurchaseRequestStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{PURCHASE_REQUEST_STATUS_LABELS[status]}</Badge>;
}

const ACTION_VARIANTS: Record<ApprovalAction, BadgeProps["variant"]> = {
  APPROVE: "success",
  REJECT: "destructive",
  REQUEST_CHANGES: "warning",
};

export function ApprovalActionBadge({ action }: { action: ApprovalAction }) {
  return <Badge variant={ACTION_VARIANTS[action]}>{APPROVAL_ACTION_LABELS[action]}</Badge>;
}

export function formatCurrencyBRL(value: string | number | null): string {
  if (value === null) return "—";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return "—";
  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
