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
import { PURCHASE_REQUEST_STATUS_LABELS } from '@/constants/enums';
import { purchaseRequestsApi } from '../services/purchaseRequests.api';
import { purchaseRequestsReport } from '../lib/reports';
import { CheckCircle2, ClipboardList, Hourglass, Plus, ShoppingCart } from 'lucide-react';

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

import { usePurchaseRequestStats, usePurchaseRequests } from '../hooks/usePurchaseRequests';
import { summarizeStats } from '../lib/stats';
import { FiltersBar } from '../components/FiltersBar';
import { PurchaseRequestsTable } from '../components/PurchaseRequestsTable';
import type { PurchaseRequestFilters } from '../types';

const PAGE_SIZE = 10;

export function PurchaseRequestsPage() {
  const { t } = useTranslation('purchaseRequests');
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PurchaseRequestFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = usePurchaseRequestStats();
  const list = usePurchaseRequests({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: filters.status,
  });
  const summary = summarizeStats(stats.data);

  function handleFilterChange(patch: Partial<PurchaseRequestFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function handleClearAll() {
    setFilters({});
    setPage(1);
  }

  const hasFilters = Boolean(filters.busca || filters.status);
  const rows = list.data?.data ?? [];

  const newRequestButton = (
    <Can permission={PERMISSIONS.PURCHASE_REQUEST_WRITE}>
      <Button
        variant="primary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => navigate(ROUTE_PATHS.SOLICITACAO_NOVA)}
      >
        {t('purchaseRequests:actions.new')}
      </Button>
    </Can>
  );

  /** Todas as solicitações do filtro atual, em PDF, Excel ou CSV. */
  async function handleExport(format: ExportFormat) {
    const all = await fetchAllPages((current, pageSize) =>
      purchaseRequestsApi.list({
        page: current,
        pageSize,
        search: debouncedSearch || undefined,
        status: filters.status,
      }),
    );
    if (all.length === 0) {
      toast.info(t('common:export.empty'));
      return;
    }
    const meta = describeFilters([
      [t('purchaseRequests:report.search'), debouncedSearch],
      [
        t('purchaseRequests:report.status'),
        filters.status && PURCHASE_REQUEST_STATUS_LABELS[filters.status],
      ],
    ]);
    await exportReport(purchaseRequestsReport(all, meta), format);
  }

  return (
    <>
      <PageHeader
        eyebrow={t('purchaseRequests:page.eyebrow')}
        title={t('purchaseRequests:page.title')}
        description={t('purchaseRequests:page.description')}
        actions={
          <>
            <ExportMenu onExport={handleExport} />
            {newRequestButton}
          </>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="pr-kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="pr-kpi-title" className="sr-only">
            {t('purchaseRequests:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('purchaseRequests:kpi.total')}
                value={<CountUp value={summary.total} />}
                icon={<ShoppingCart className="h-4 w-4" />}
              />
              <StatTile
                label={t('purchaseRequests:kpi.awaitingApproval')}
                value={<CountUp value={summary.awaitingApproval} />}
                icon={<Hourglass className="h-4 w-4" />}
              />
              <StatTile
                label={t('purchaseRequests:kpi.inProgress')}
                value={<CountUp value={summary.inProgress} />}
                icon={<ClipboardList className="h-4 w-4" />}
              />
              <StatTile
                label={t('purchaseRequests:kpi.finished')}
                value={<CountUp value={summary.finished} />}
                icon={<CheckCircle2 className="h-4 w-4" />}
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
            title={t('purchaseRequests:error.title')}
            description={t('purchaseRequests:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title={
              hasFilters
                ? t('purchaseRequests:empty.filteredTitle')
                : t('purchaseRequests:empty.title')
            }
            description={
              hasFilters
                ? t('purchaseRequests:empty.filteredDescription')
                : t('purchaseRequests:empty.description')
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={handleClearAll}>
                  {t('common:filters.clearAll')}
                </Button>
              ) : (
                newRequestButton
              )
            }
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <PurchaseRequestsTable rows={rows} isFetching={list.isFetching && !list.isLoading} />
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

export default PurchaseRequestsPage;
