import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ExportMenu } from '@/components/common/ExportMenu';
import {
  describeFilters,
  exportReport,
  fetchAllPages,
  type ExportFormat,
} from '@/utils/export/report';
import { productsApi } from '../services/products.api';
import { productsReport } from '../lib/reports';
import { Boxes, CheckCircle2, CircleOff, Layers, ListTree, Plus } from 'lucide-react';

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

import { DisciplinesDialog } from '@/features/disciplines/components/DisciplinesDialog';
import { useProductStats, useProducts } from '../hooks/useProducts';
import { FiltersBar } from '../components/FiltersBar';
import { ProductsTable } from '../components/ProductsTable';
import type { ProductFilters } from '../types';

const PAGE_SIZE = 10;

export function ProductsPage() {
  const { t } = useTranslation('products');
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [page, setPage] = useState(1);
  const [disciplinesOpen, setDisciplinesOpen] = useState(false);
  const debouncedSearch = useDebounce(filters.busca, 300);
  const debouncedBrand = useDebounce(filters.marca, 300);

  const stats = useProductStats();
  const list = useProducts({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoria: filters.categoria,
    disciplineId: filters.disciplineId,
    marca: debouncedBrand || undefined,
    supplierId: filters.supplierId,
  });

  function handleFilterChange(patch: Partial<ProductFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function handleClearAll() {
    setFilters({});
    setPage(1);
  }

  const hasFilters = Boolean(
    filters.busca ||
    filters.categoria ||
    filters.disciplineId ||
    filters.marca ||
    filters.supplierId,
  );
  const rows = list.data?.data ?? [];

  const disciplinesButton = (
    <Can permission={PERMISSIONS.DISCIPLINE_WRITE}>
      <Button
        variant="outline"
        leftIcon={<ListTree className="h-4 w-4" />}
        onClick={() => setDisciplinesOpen(true)}
      >
        {t('products:actions.disciplines')}
      </Button>
    </Can>
  );

  const newProductButton = (
    <Can permission={PERMISSIONS.PRODUCT_WRITE}>
      <Button
        variant="primary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => navigate(ROUTE_PATHS.PRODUTO_NOVO)}
      >
        {t('products:actions.new')}
      </Button>
    </Can>
  );

  /** Todos os produtos do filtro atual (não só a página), em PDF, Excel ou CSV. */
  async function handleExport(format: ExportFormat) {
    const all = await fetchAllPages((current, pageSize) =>
      productsApi.list({
        page: current,
        pageSize,
        search: debouncedSearch || undefined,
        categoria: filters.categoria,
        disciplineId: filters.disciplineId,
        marca: debouncedBrand || undefined,
        supplierId: filters.supplierId,
      }),
    );
    if (all.length === 0) {
      toast.info(t('common:export.empty'));
      return;
    }
    const meta = describeFilters([
      [t('products:report.search'), debouncedSearch],
      [t('products:report.brand'), debouncedBrand],
    ]);
    await exportReport(productsReport(all, meta), format);
  }

  return (
    <>
      <PageHeader
        eyebrow={t('products:page.eyebrow')}
        title={t('products:page.title')}
        description={t('products:page.description')}
        actions={
          <div className="flex flex-wrap gap-2">
            <ExportMenu onExport={handleExport} />
            {disciplinesButton}
            {newProductButton}
          </div>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="products-kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="products-kpi-title" className="sr-only">
            {t('products:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('products:kpi.total')}
                value={<CountUp value={stats.data.total} />}
                icon={<Boxes className="h-4 w-4" />}
              />
              <StatTile
                label={t('products:kpi.active')}
                value={<CountUp value={stats.data.active} />}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <StatTile
                label={t('products:kpi.inactive')}
                value={<CountUp value={stats.data.total - stats.data.active} />}
                icon={<CircleOff className="h-4 w-4" />}
              />
              <StatTile
                label={t('products:kpi.disciplines')}
                value={
                  <CountUp value={stats.data.byDiscipline.filter((d) => d.disciplineId).length} />
                }
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
            title={t('products:error.title')}
            description={t('products:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<Boxes className="h-6 w-6" />}
            title={hasFilters ? t('products:empty.filteredTitle') : t('products:empty.title')}
            description={
              hasFilters ? t('products:empty.filteredDescription') : t('products:empty.description')
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={handleClearAll}>
                  {t('common:filters.clearAll')}
                </Button>
              ) : (
                newProductButton
              )
            }
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <ProductsTable rows={rows} isFetching={list.isFetching && !list.isLoading} />
            <Pagination
              page={list.data.meta.page}
              pageSize={list.data.meta.pageSize}
              total={list.data.meta.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
      <DisciplinesDialog open={disciplinesOpen} onOpenChange={setDisciplinesOpen} />
    </>
  );
}

export default ProductsPage;
