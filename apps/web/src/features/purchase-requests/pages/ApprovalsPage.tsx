import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Hourglass, Inbox } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { PURCHASE_REQUEST_STATUS_LABELS } from '@/constants/enums';

import { usePurchaseRequestQueue } from '../hooks/usePurchaseRequests';
import { FiltersBar } from '../components/FiltersBar';
import { PurchaseRequestsTable } from '../components/PurchaseRequestsTable';
import { APPROVAL_QUEUE_BY_ROLE, type PurchaseRequestFilters } from '../types';

const PAGE_SIZE = 10;

/** Fila de trabalho: solicitações nas etapas em que o papel do usuário precisa agir. */
export function ApprovalsPage() {
  const { t } = useTranslation('purchaseRequests');
  const { user } = useAuth();
  const [filters, setFilters] = useState<PurchaseRequestFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const queueStatuses = (user && APPROVAL_QUEUE_BY_ROLE[user.role]) ?? [];
  const queue = usePurchaseRequestQueue(queueStatuses, debouncedSearch);

  const total = queue.rows.length;
  const pageRows = queue.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const oldestDays =
    queue.rows[0] !== undefined
      ? Math.floor((Date.now() - new Date(queue.rows[0].createdAt).getTime()) / 86_400_000)
      : 0;

  function handleFilterChange(patch: Partial<PurchaseRequestFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  return (
    <>
      <PageHeader
        eyebrow={t('purchaseRequests:approvals.eyebrow')}
        title={t('purchaseRequests:approvals.title')}
        description={t('purchaseRequests:approvals.description')}
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span>{t('purchaseRequests:approvals.stagesLabel')}</span>
          {queueStatuses.map((status) => (
            <Badge key={status} variant="outline" size="sm">
              {PURCHASE_REQUEST_STATUS_LABELS[status]}
            </Badge>
          ))}
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {queue.isLoading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))
          ) : (
            <>
              <StatTile
                label={t('purchaseRequests:approvals.kpi.pending')}
                value={<CountUp value={total} />}
                icon={<ClipboardCheck className="h-4 w-4" />}
              />
              <StatTile
                label={t('purchaseRequests:approvals.kpi.oldest')}
                value={
                  total > 0 ? t('purchaseRequests:approvals.days', { count: oldestDays }) : '—'
                }
                icon={<Hourglass className="h-4 w-4" />}
              />
            </>
          )}
        </section>

        <Separator />

        <FiltersBar
          filters={filters}
          onChange={handleFilterChange}
          onClearAll={() => handleFilterChange({ busca: undefined })}
          showStatus={false}
        />

        {queue.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full" />
            ))}
          </div>
        )}

        {queue.isError && (
          <ErrorState
            title={t('purchaseRequests:error.title')}
            description={t('purchaseRequests:error.description')}
            action={
              <Button variant="outline" onClick={() => void queue.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {!queue.isLoading && !queue.isError && total === 0 && (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title={t('purchaseRequests:approvals.emptyTitle')}
            description={t('purchaseRequests:approvals.emptyDescription')}
          />
        )}

        {!queue.isLoading && total > 0 && (
          <div className="space-y-4">
            <PurchaseRequestsTable rows={pageRows} isFetching={queue.isFetching} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}

export default ApprovalsPage;
