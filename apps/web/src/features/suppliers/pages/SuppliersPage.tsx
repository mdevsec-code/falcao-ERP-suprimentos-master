import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, CircleOff, Layers, Plus, Truck } from 'lucide-react';

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

import { useSupplierStats, useSuppliers } from '../hooks/useSuppliers';
import { FiltersBar } from '../components/FiltersBar';
import { SuppliersTable } from '../components/SuppliersTable';
import type { SupplierFilters } from '../types';

const PAGE_SIZE = 10;

export function SuppliersPage() {
  const { t } = useTranslation('suppliers');
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = useSupplierStats();
  const list = useSuppliers({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoria: filters.categoria,
    estado: filters.estado,
  });

  function handleFilterChange(patch: Partial<SupplierFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function handleClearAll() {
    setFilters({});
    setPage(1);
  }

  const hasFilters = Boolean(filters.busca || filters.categoria || filters.estado);
  const rows = list.data?.data ?? [];

  const newSupplierButton = (
    <Can permission={PERMISSIONS.SUPPLIER_WRITE}>
      <Button
        variant="primary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => navigate(ROUTE_PATHS.FORNECEDOR_NOVO)}
      >
        {t('suppliers:actions.new')}
      </Button>
    </Can>
  );

  return (
    <>
      <PageHeader
        eyebrow={t('suppliers:page.eyebrow')}
        title={t('suppliers:page.title')}
        description={t('suppliers:page.description')}
        actions={newSupplierButton}
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="suppliers-kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="suppliers-kpi-title" className="sr-only">
            {t('suppliers:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('suppliers:kpi.total')}
                value={<CountUp value={stats.data.total} />}
                icon={<Truck className="h-4 w-4" />}
              />
              <StatTile
                label={t('suppliers:kpi.active')}
                value={<CountUp value={stats.data.active} />}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <StatTile
                label={t('suppliers:kpi.inactive')}
                value={<CountUp value={stats.data.total - stats.data.active} />}
                icon={<CircleOff className="h-4 w-4" />}
              />
              <StatTile
                label={t('suppliers:kpi.categories')}
                value={<CountUp value={stats.data.byCategory.length} />}
                icon={<Layers className="h-4 w-4" />}
              />
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
            title={t('suppliers:error.title')}
            description={t('suppliers:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<Truck className="h-6 w-6" />}
            title={hasFilters ? t('suppliers:empty.filteredTitle') : t('suppliers:empty.title')}
            description={
              hasFilters
                ? t('suppliers:empty.filteredDescription')
                : t('suppliers:empty.description')
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={handleClearAll}>
                  {t('common:filters.clearAll')}
                </Button>
              ) : (
                newSupplierButton
              )
            }
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <SuppliersTable rows={rows} isFetching={list.isFetching && !list.isLoading} />
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

export default SuppliersPage;
