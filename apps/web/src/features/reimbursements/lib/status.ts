import type { ReimbursementStatus } from '@falcao-erp/shared-types';
import type { BadgeVariant } from '@/components/ui/Badge';

export const REIMBURSEMENT_STATUS_BADGE: Record<ReimbursementStatus, BadgeVariant> = {
  ENVIADO: 'warning',
  APROVADO: 'info',
  REJEITADO: 'danger',
  PAGO: 'success',
};

/** Caminho feliz do reembolso, para o stepper do detalhe. */
export const REIMBURSEMENT_PIPELINE: ReimbursementStatus[] = ['ENVIADO', 'APROVADO', 'PAGO'];
