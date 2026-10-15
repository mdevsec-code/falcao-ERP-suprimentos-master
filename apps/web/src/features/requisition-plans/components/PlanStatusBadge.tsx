import type { RequisitionPlanStatus } from '@falcao-erp/shared-types';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { REQUISITION_PLAN_STATUS_LABELS } from '@/constants/enums';

const VARIANT: Record<RequisitionPlanStatus, BadgeVariant> = {
  RASCUNHO: 'warning',
  LANCADO: 'info',
  CANCELADO: 'neutral',
};

export function PlanStatusBadge({
  status,
  size = 'sm',
}: {
  status: RequisitionPlanStatus;
  size?: 'sm' | 'md';
}) {
  return (
    <Badge variant={VARIANT[status]} size={size}>
      {REQUISITION_PLAN_STATUS_LABELS[status]}
    </Badge>
  );
}
