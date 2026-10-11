import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilePlus2, History, PencilLine, ScrollText } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { useDebounce } from '@/hooks/useDebounce';

import { useAuditLogs, useAuditStats } from '../hooks/useAuditLogs';
import { FiltersBar } from '../components/FiltersBar';
import { AuditTable } from '../components/AuditTable';
import type { AuditFilters } from '../types';

const PAGE_SIZE = 20;

export function AuditPage() {
  const { t } = useTranslation('audit');
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = useAuditStats();
  const list = useAuditLogs({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    action: filters.action,
    entityType: filters.entityType,
    from: filters.from,
    to: filters.to,
  });

  function handleFilterChange(patch: Partial<AuditFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function handleClearAll() {
    setFilters({});
    setPage(1);
  }

  const countOf = (action: string) =>
    stats.data?.byAction.find((row) => row.action === action)?.count ?? 0;
  const rows = list.data?.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow={t('audit:page.eyebrow')}
        title={t('audit:page.title')}
        description={t('audit:page.description')}
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('audit:kpi.total')}
                value={<CountUp value={stats.data.total} />}
                icon={<ScrollText className="h-4 w-4" />}
              />
              <StatTile
                label={t('audit:kpi.today')}
                value={<CountUp value={stats.data.today} />}
                icon={<History className="h-4 w-4" />}
              />
              <StatTile
                label={t('audit:kpi.creates')}
                value={<CountUp value={countOf('CREATE')} />}
                icon={<FilePlus2 className="h-4 w-4" />}
              />
              <StatTile
                label={t('audit:kpi.changes')}
                value={<CountUp value={countOf('UPDATE') + countOf('DELETE')} />}
                icon={<PencilLine className="h-4 w-4" />}
              />
            </>
          )}
        </section>

        <Separator />

        <FiltersBar
          filters={filters}
          entityTypes={stats.data?.entityTypes ?? []}
          onChange={handleFilterChange}
          onClearAll={handleClearAll}
        />

        {list.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full" />
            ))}
          </div>
        )}

        {list.isError && (
          <ErrorState
            title={t('audit:error.title')}
            description={t('audit:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<ScrollText className="h-6 w-6" />}
            title={t('audit:empty.title')}
            description={t('audit:empty.description')}
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <AuditTable rows={rows} isFetching={list.isFetching && !list.isLoading} />
            <Pagination
              page={list.data.meta.page}
              pageSize={list.data.meta.pageSize}
              total={list.data.meta.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default AuditPage;
