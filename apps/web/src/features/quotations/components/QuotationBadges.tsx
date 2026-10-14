import type { QuotationStatus, QuotationSupplierStatus } from '@falcao-erp/shared-types';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { QUOTATION_STATUS_LABELS, QUOTATION_SUPPLIER_STATUS_LABELS } from '@/constants/enums';

const STATUS_VARIANT: Record<QuotationStatus, BadgeVariant> = {
  ABERTA: 'info',
  ENCERRADA: 'success',
  CANCELADA: 'neutral',
};

const SUPPLIER_VARIANT: Record<QuotationSupplierStatus, BadgeVariant> = {
  CONVIDADO: 'warning',
  RESPONDIDO: 'success',
  RECUSOU: 'danger',
};

export function QuotationStatusBadge({
  status,
  size = 'sm',
}: {
  status: QuotationStatus;
  size?: 'sm' | 'md';
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} size={size}>
      {QUOTATION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function SupplierResponseBadge({ status }: { status: QuotationSupplierStatus }) {
  return (
    <Badge variant={SUPPLIER_VARIANT[status]} size="sm">
      {QUOTATION_SUPPLIER_STATUS_LABELS[status]}
    </Badge>
  );
}
