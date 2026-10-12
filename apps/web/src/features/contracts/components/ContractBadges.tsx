import { useTranslation } from 'react-i18next';
import type { ContractStatus, DeadlineState } from '@falcao-erp/shared-types';
import { Badge } from '@/components/ui/Badge';
import { CONTRACT_STATUS_LABELS } from '@/constants/enums';
import { CONTRACT_STATUS_BADGE, DEADLINE_BADGE } from '../lib/status';

export function ContractStatusBadge({
  status,
  size = 'sm',
}: {
  status: ContractStatus;
  size?: 'sm' | 'md';
}) {
  return (
    <Badge variant={CONTRACT_STATUS_BADGE[status]} size={size}>
      {CONTRACT_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Prazo de contrato vigente: "vence em 12 dias", "venceu há 3 dias". */
export function DeadlineBadge({
  prazo,
  diasRestantes,
}: {
  prazo: DeadlineState | null;
  diasRestantes: number;
}) {
  const { t } = useTranslation('contracts');
  if (!prazo || prazo === 'OK') return null;
  return (
    <Badge variant={DEADLINE_BADGE[prazo]} size="sm">
      {prazo === 'VENCIDO'
        ? t('contracts:deadline.expired', { count: Math.abs(diasRestantes) })
        : diasRestantes === 0
          ? t('contracts:deadline.today')
          : t('contracts:deadline.expiring', { count: diasRestantes })}
    </Badge>
  );
}
