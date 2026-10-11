import type { ApprovalAction, PurchaseRequestStatus } from '@falcao-erp/shared-types';
import { Badge } from '@/components/ui/Badge';
import { APPROVAL_ACTION_LABELS, PURCHASE_REQUEST_STATUS_LABELS } from '@/constants/enums';
import { ACTION_BADGE_VARIANT, STATUS_BADGE_VARIANT } from '../lib/status';

export function PurchaseRequestStatusBadge({
  status,
  size = 'sm',
}: {
  status: PurchaseRequestStatus;
  size?: 'sm' | 'md';
}) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} size={size}>
      {PURCHASE_REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ApprovalActionBadge({ action }: { action: ApprovalAction }) {
  return (
    <Badge variant={ACTION_BADGE_VARIANT[action]} size="sm">
      {APPROVAL_ACTION_LABELS[action]}
    </Badge>
  );
}
