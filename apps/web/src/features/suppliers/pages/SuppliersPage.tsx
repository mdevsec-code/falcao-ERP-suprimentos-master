import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BookOpen, CheckCircle2, CircleOff, Layers, Plus, Truck, UserCheck } from 'lucide-react';

import { ExportMenu } from '@/components/common/ExportMenu';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import {
  describeFilters,
  exportReport,
  fetchAllPages,
  type ExportFormat,
} from '@/utils/export/report';
import { suppliersApi } from '../services/suppliers.api';
import { suppliersReport } from '../lib/reports';

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
import { SignupLinkCard } from '../components/SignupLinkCard';
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
  /** Só os cadastros que os fornecedores fizeram pelo link e aguardam revisão. */
  const [onlyPending, setOnlyPending] = useState(false);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = useSupplierStats();
  const listParams = {
    search: debouncedSearch || undefined,
    categoria: filters.categoria,
    estado: filters.estado,
    cadastroPendente: onlyPending || undefined,
  };
  const list = useSuppliers({ page, pageSize: PAGE_SIZE, ...listParams });

  async function handleExport(format: ExportFormat) {
    const all = await fetchAllPages((current, pageSize) =>
      suppliersApi.list({ ...listParams, page: current, pageSize }),
    );
    if (all.length === 0) {
      toast.info(t('common:export.empty'));
      return;
    }
    const meta = describeFilters([
      [t('suppliers:report.search'), debouncedSearch],
      [
        t('suppliers:report.categoria'),
        filters.categoria && SUPPLIER_CATEGORY_LABELS[filters.categoria],
      ],
      [t('suppliers:report.estado'), filters.estado],
      [null, onlyPending && t('suppliers:registration.onlyPending')],
    ]);
    await exportReport(suppliersReport(all, meta), format);
  }

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
        actions={
          <>
            <ExportMenu onExport={handleExport} />
            <Can permission={PERMISSIONS.QUOTATION_WRITE}>
              <Button
                variant="outline"
                leftIcon={<BookOpen className="h-4 w-4" />}
                onClick={() => navigate(ROUTE_PATHS.CATALOGOS)}
              >
                {t('suppliers:actions.catalogs')}
              </Button>
            </Can>
            {newSupplierButton}
          </>
        }
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

        {(onlyPending || (stats.data?.pendentes ?? 0) > 0) && (
          <div className="flex flex-col gap-3 rounded-lg border border-brand-gold-300 bg-brand-gold-50/70 p-4 text-sm text-ink sm:flex-row sm:items-center">
            <UserCheck className="h-5 w-5 shrink-0 text-brand-gold-700" aria-hidden="true" />
            <p className="flex-1">
              {t('suppliers:registration.listBanner', { count: stats.data?.pendentes ?? 0 })}
            </p>
            <Button
              size="sm"
              variant={onlyPending ? 'primary' : 'outline'}
              aria-pressed={onlyPending}
              onClick={() => {
                setOnlyPending((current) => !current);
                setPage(1);
              }}
            >
              {onlyPending
                ? t('suppliers:registration.showAll')
                : t('suppliers:registration.onlyPending')}
            </Button>
          </div>
        )}

        <Can permission={PERMISSIONS.SUPPLIER_WRITE}>
          <SignupLinkCard />
        </Can>

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
