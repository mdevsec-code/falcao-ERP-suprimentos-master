import { CalendarDays, FileClock, FileText, Wallet, type LucideIcon } from 'lucide-react';
import type { AgendaItemKind } from '@falcao-erp/shared-types';

/**
 * Cada origem tem ícone e tom próprios. O tom reforça, mas não carrega
 * sozinho a informação — o ícone e o rótulo dizem o tipo.
 */
export const KIND_STYLE: Record<
  AgendaItemKind,
  { icon: LucideIcon; className: string; dot: string }
> = {
  EVENT: {
    icon: CalendarDays,
    className: 'border-brand-gold-500/40 bg-brand-gold-50 text-brand-gold-900',
    dot: 'bg-brand-gold-500',
  },
  PAYABLE_DUE: {
    icon: Wallet,
    className: 'border-info/30 bg-info/10 text-ink',
    dot: 'bg-info',
  },
  CONTRACT_END: {
    icon: FileText,
    className: 'border-warning/40 bg-warning/10 text-ink',
    dot: 'bg-warning',
  },
  DOCUMENT_EXPIRY: {
    icon: FileClock,
    className: 'border-danger/30 bg-danger/10 text-ink',
    dot: 'bg-danger',
  },
};

export const ALL_KINDS: AgendaItemKind[] = [
  'EVENT',
  'PAYABLE_DUE',
  'CONTRACT_END',
  'DOCUMENT_EXPIRY',
];
