import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  MessageSquare,
  PencilLine,
  PlusCircle,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { EmptyState } from '@/components/feedback/EmptyState';
import { PURCHASE_REQUEST_STATUS_LABELS } from '@/constants/enums';
import { formatDateTime, relativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { PurchaseRequestTimelineEntryDto } from '../types';

function entryVisual(entry: PurchaseRequestTimelineEntryDto): { icon: LucideIcon; tone: string } {
  if (entry.type === 'CREATED')
    return { icon: PlusCircle, tone: 'bg-brand-gold-50 text-brand-gold-700' };
  if (entry.type === 'COMMENT') return { icon: MessageSquare, tone: 'bg-info/10 text-info' };
  if (entry.type === 'UPDATED') return { icon: PencilLine, tone: 'bg-hover text-ink-soft' };
  if (entry.action === 'REJECT') return { icon: XCircle, tone: 'bg-danger/10 text-danger' };
  if (entry.action === 'REQUEST_CHANGES')
    return { icon: RotateCcw, tone: 'bg-brand-gold-50 text-brand-gold-700' };
  return { icon: CheckCircle2, tone: 'bg-success/10 text-success' };
}

export function Timeline({ entries }: { entries: readonly PurchaseRequestTimelineEntryDto[] }) {
  const { t } = useTranslation('purchaseRequests');

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-6 w-6" />}
        title={t('purchaseRequests:timeline.emptyTitle')}
      />
    );
  }

  function describe(entry: PurchaseRequestTimelineEntryDto): string {
    if (entry.type === 'CREATED') return t('purchaseRequests:timeline.created');
    if (entry.type === 'COMMENT') return t('purchaseRequests:timeline.commented');
    if (entry.type === 'UPDATED') return t('purchaseRequests:timeline.updated');
    if (entry.action === 'REQUEST_CHANGES') return t('purchaseRequests:timeline.requestedChanges');
    if (entry.action === 'REJECT') return t('purchaseRequests:timeline.rejected');
    return t('purchaseRequests:timeline.moved', {
      status: entry.toStatus ? PURCHASE_REQUEST_STATUS_LABELS[entry.toStatus] : '',
    });
  }

  return (
    <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
      {entries.map((entry, idx) => {
        const { icon: Icon, tone } = entryVisual(entry);
        return (
          <li
            key={`${entry.type}-${entry.id}`}
            className="relative flex animate-slide-up gap-3"
            style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
          >
            <span
              aria-hidden="true"
              className={cn(
                'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-bg',
                tone,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm text-ink">
                <span className="font-semibold">{entry.authorName}</span> {describe(entry)}
              </p>
              {entry.message && (
                <p className="mt-1 whitespace-pre-line rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-soft">
                  {entry.message}
                </p>
              )}
              <time
                dateTime={entry.createdAt}
                title={formatDateTime(entry.createdAt) ?? ''}
                className="mt-1 block text-xs text-ink-soft"
              >
                {relativeTime(entry.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
