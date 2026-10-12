import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Building2, MapPin, Pencil, Truck } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { AGENDA_EVENT_TYPE_LABELS, AGENDA_ITEM_KIND_LABELS } from '@/constants/enums';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { KIND_STYLE } from '../lib/kinds';
import type { AgendaItemDto } from '../types';

interface AgendaItemCardProps {
  item: AgendaItemDto;
  /** Só eventos editáveis por quem vê (criador ou gestor) recebem o lápis. */
  canEdit: boolean;
  onEdit: (item: AgendaItemDto) => void;
  style?: CSSProperties;
}

/** Link para a tela de origem de um prazo vindo de outro módulo. */
function sourceLink(item: AgendaItemDto): string | null {
  switch (item.kind) {
    case 'PAYABLE_DUE':
      return ROUTE_PATHS.FINANCEIRO;
    case 'CONTRACT_END':
      return routeTo.contract(item.sourceId);
    case 'DOCUMENT_EXPIRY':
      return ROUTE_PATHS.DOCUMENTOS;
    default:
      return null;
  }
}

export function AgendaItemCard({ item, canEdit, onEdit, style }: AgendaItemCardProps) {
  const { t } = useTranslation('agenda');
  const kind = KIND_STYLE[item.kind];
  const Icon = kind.icon;
  const link = sourceLink(item);

  const when = item.diaInteiro
    ? t('agenda:item.allDay')
    : item.fim
      ? `${formatTime(item.inicio)} – ${formatTime(item.fim)}`
      : formatTime(item.inicio);

  return (
    <article
      className="group relative flex animate-slide-up gap-3 rounded-md border border-border bg-surface p-3 transition-shadow duration-base hover:shadow-sm"
      style={{ animationFillMode: 'backwards', ...style }}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
          kind.className,
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          {item.kind === 'EVENT' && item.tipo
            ? AGENDA_EVENT_TYPE_LABELS[item.tipo]
            : AGENDA_ITEM_KIND_LABELS[item.kind]}{' '}
          · {when}
        </p>
        <p className="font-medium leading-snug text-ink">{item.titulo}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-soft">
          {item.valor && item.kind === 'PAYABLE_DUE' && (
            <span className="font-semibold tabular-nums text-ink">
              {formatCurrencyBRL(item.valor)}
            </span>
          )}
          {item.obra && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" aria-hidden="true" />
              {item.obra}
            </span>
          )}
          {item.local && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {item.local}
            </span>
          )}
          {item.supplierName && (
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3 w-3" aria-hidden="true" />
              {item.supplierName}
            </span>
          )}
        </div>
        {item.descricao && (
          <p className="line-clamp-2 whitespace-pre-line text-xs text-ink-soft">{item.descricao}</p>
        )}
      </div>
      <div className="flex shrink-0 items-start">
        {item.kind === 'EVENT' && canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={t('agenda:item.edit', { title: item.titulo })}
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {link && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={t('agenda:item.open', { title: item.titulo })}
          >
            <Link to={link}>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
