import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlarmClock, CircleDollarSign, FileText, FileWarning, Plus } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Can } from '@/features/auth/components/Can';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS } from '@/constants/routes';
import { formatCurrencyBRL } from '@/utils/format';

import { useContractStats, useContracts } from '../hooks/useContracts';
import { FiltersBar } from '../components/FiltersBar';
import { ContractsTable } from '../components/ContractsTable';
import type { ContractFilters } from '../types';

const PAGE_SIZE = 10;

export function ContractsPage() {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ContractFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = useContractStats();
  const list = useContracts({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: filters.status,
    prazo: filters.prazo,
  });

  function handleFilterChange(patch: Partial<ContractFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function handleClearAll() {
    setFilters({});
    setPage(1);
  }

  const hasFilters = Boolean(filters.busca || filters.status || filters.prazo);
  const rows = list.data?.data ?? [];

  const newButton = (
    <Can permission={PERMISSIONS.CONTRACT_WRITE}>
      <Button
        variant="primary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => navigate(ROUTE_PATHS.CONTRATO_NOVO)}
      >
        {t('contracts:actions.new')}
      </Button>
    </Can>
  );

  return (
    <>
      <PageHeader
        eyebrow={t('contracts:page.eyebrow')}
        title={t('contracts:page.title')}
        description={t('contracts:page.description')}
        actions={newButton}
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="contracts-kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="contracts-kpi-title" className="sr-only">
            {t('contracts:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('contracts:kpi.active')}
                value={<CountUp value={stats.data.vigentes} />}
                icon={<FileText className="h-4 w-4" />}
              />
              <StatTile
                label={t('contracts:kpi.activeValue')}
                value={
                  <CountUp value={Number(stats.data.valorVigente)} format={formatCurrencyBRL} />
                }
                icon={<CircleDollarSign className="h-4 w-4" />}
              />
              <button
                type="button"
                className="rounded-lg text-left focus:outline-none focus-visible:shadow-focus"
                onClick={() => handleFilterChange({ prazo: 'VENCENDO', status: undefined })}
              >
                <StatTile
                  label={t('contracts:kpi.expiring')}
                  value={<CountUp value={stats.data.vencendo} />}
                  icon={<AlarmClock className="h-4 w-4" />}
                />
              </button>
              <button
                type="button"
                className="rounded-lg text-left focus:outline-none focus-visible:shadow-focus"
                onClick={() => handleFilterChange({ prazo: 'VENCIDO', status: undefined })}
              >
                <StatTile
                  label={t('contracts:kpi.expired')}
                  value={<CountUp value={stats.data.vencidos} />}
                  icon={<FileWarning className="h-4 w-4" />}
                />
              </button>
            </>
          )}
        </section>

        <Separator />

        <FiltersBar filters={filters} onChange={handleFilterChange} onClearAll={handleClearAll} />

        {list.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full" />
            ))}
          </div>
        )}

        {list.isError && (
          <ErrorState
            title={t('contracts:error.title')}
            description={t('contracts:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={hasFilters ? t('contracts:empty.filteredTitle') : t('contracts:empty.title')}
            description={
              hasFilters
                ? t('contracts:empty.filteredDescription')
                : t('contracts:empty.description')
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={handleClearAll}>
                  {t('common:filters.clearAll')}
                </Button>
              ) : (
                newButton
              )
            }
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <ContractsTable rows={rows} isFetching={list.isFetching && !list.isLoading} />
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

export default ContractsPage;
