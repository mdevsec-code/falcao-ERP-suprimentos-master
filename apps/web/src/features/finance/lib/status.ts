import type { PayableSource, PayableStatus } from '@falcao-erp/shared-types';
import type { BadgeVariant } from '@/components/ui/Badge';

export const PAYABLE_STATUS_BADGE: Record<PayableStatus, BadgeVariant> = {
  ABERTO: 'info',
  PAGO: 'success',
  CANCELADO: 'neutral',
};

export const PAYABLE_SOURCE_BADGE: Record<PayableSource, BadgeVariant> = {
  MANUAL: 'outline',
  PEDIDO: 'brand',
  CONTRATO: 'accent',
  REEMBOLSO: 'warning',
};

/** `YYYY-MM` → rótulo curto do mês no idioma ativo ("out/26"). */
export function monthLabel(month: string, locale: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' })
    .format(new Date(y, m - 1, 1))
    .replace('.', '');
}
