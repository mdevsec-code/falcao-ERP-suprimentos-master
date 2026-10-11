import type { ApprovalAction, PurchaseRequestStatus } from '@falcao-erp/shared-types';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { ButtonVariant } from '@/components/ui/Button';

export const STATUS_BADGE_VARIANT: Record<PurchaseRequestStatus, BadgeVariant> = {
  AGUARDANDO_APROVACAO: 'warning',
  EM_COMPRAS: 'info',
  EM_COTACAO: 'info',
  PEDIDO_REALIZADO: 'brand',
  AGUARDANDO_RECEBIMENTO: 'accent',
  FINALIZADO: 'success',
  REJEITADO: 'danger',
};

export const ACTION_BADGE_VARIANT: Record<ApprovalAction, BadgeVariant> = {
  APPROVE: 'success',
  REJECT: 'danger',
  REQUEST_CHANGES: 'warning',
};

export interface TransitionOption {
  target: PurchaseRequestStatus;
  /** Chave em `purchaseRequests:transitions.*`. */
  labelKey: string;
  variant: ButtonVariant;
  requiresComment: boolean;
}

const cancel = (labelKey = 'cancel'): TransitionOption => ({
  target: 'REJEITADO',
  labelKey,
  variant: 'danger',
  requiresComment: true,
});

/**
 * Ações oferecidas em cada etapa. A API valida a transição de verdade
 * (`ALLOWED_TRANSITIONS` + papel do usuário); aqui só montamos os botões.
 */
export const TRANSITION_OPTIONS: Record<PurchaseRequestStatus, TransitionOption[]> = {
  AGUARDANDO_APROVACAO: [
    { target: 'EM_COMPRAS', labelKey: 'approve', variant: 'primary', requiresComment: false },
    {
      target: 'AGUARDANDO_APROVACAO',
      labelKey: 'requestChanges',
      variant: 'outline',
      requiresComment: true,
    },
    cancel('reject'),
  ],
  EM_COMPRAS: [
    { target: 'EM_COTACAO', labelKey: 'startQuote', variant: 'primary', requiresComment: false },
    cancel(),
  ],
  EM_COTACAO: [
    {
      target: 'PEDIDO_REALIZADO',
      labelKey: 'placeOrder',
      variant: 'primary',
      requiresComment: false,
    },
    cancel(),
  ],
  PEDIDO_REALIZADO: [
    {
      target: 'AGUARDANDO_RECEBIMENTO',
      labelKey: 'confirmShipment',
      variant: 'primary',
      requiresComment: false,
    },
    cancel(),
  ],
  AGUARDANDO_RECEBIMENTO: [
    {
      target: 'FINALIZADO',
      labelKey: 'confirmReceipt',
      variant: 'primary',
      requiresComment: false,
    },
    cancel(),
  ],
  FINALIZADO: [],
  REJEITADO: [],
};
