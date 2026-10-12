import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Banknote,
  CircleCheckBig,
  Hourglass,
  Plus,
  ReceiptText,
  Search,
  XCircle,
} from 'lucide-react';
import { ReimbursementStatus } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SelectField } from '@/components/common/SelectField';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Can } from '@/features/auth/components/Can';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS } from '@/constants/routes';
import { REIMBURSEMENT_STATUS_LABELS } from '@/constants/enums';
import { formatCurrencyBRL } from '@/utils/format';

import { useReimbursements, useReimbursementStats } from '../hooks/useReimbursements';
import { ReimbursementsTable } from '../components/ReimbursementsTable';
import type { ReimbursementFilters } from '../types';

const PAGE_SIZE = 10;

const STATUS_TILES = [
  { status: 'ENVIADO', icon: Hourglass },
  { status: 'APROVADO', icon: Banknote },
  { status: 'PAGO', icon: CircleCheckBig },
  { status: 'REJEITADO', icon: XCircle },
] as const;

export function ReimbursementsPage() {
  const { t } = useTranslation('reimbursements');
  const navigate = useNavigate();
  const { can } = useAuth();
  const viewAll = can(PERMISSIONS.REIMBURSEMENT_VIEW_ALL);

  const [filters, setFilters] = useState<ReimbursementFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = useReimbursementStats();
  const list = useReimbursements({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: filters.status,
    mine: filters.mine || undefined,
  });

  function patch(next: Partial<ReimbursementFilters>) {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }

  const byStatus = new Map(stats.data?.byStatus.map((row) => [row.status, row]) ?? []);
  const rows = list.data?.data ?? [];
  const hasFilters = Boolean(filters.busca || filters.status);
  const pending = stats.data?.pendingMyDecision ?? 0;

  const newButton = (
    <Can permission={PERMISSIONS.REIMBURSEMENT_REQUEST}>
      <Button
        variant="primary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => navigate(ROUTE_PATHS.REEMBOLSO_NOVO)}
      >
        {t('reimbursements:actions.new')}
      </Button>
    </Can>
  );

  return (
    <>
      <PageHeader
        eyebrow={t('reimbursements:page.eyebrow')}
        title={t('reimbursements:page.title')}
        description={
          viewAll
            ? t('reimbursements:page.descriptionAll')
            : t('reimbursements:page.descriptionMine')
        }
        actions={newButton}
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="reimbursements-kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="reimbursements-kpi-title" className="sr-only">
            {t('reimbursements:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data &&
            STATUS_TILES.map(({ status, icon: Icon }) => {
              const row = byStatus.get(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => patch({ status: filters.status === status ? undefined : status })}
                  aria-pressed={filters.status === status}
                  className="rounded-lg text-left focus:outline-none focus-visible:shadow-focus"
                >
                  <StatTile
                    label={REIMBURSEMENT_STATUS_LABELS[status]}
                    value={<CountUp value={row?.count ?? 0} />}
                    hint={formatCurrencyBRL(row?.total ?? 0)}
                    icon={<Icon className="h-4 w-4" />}
                    className={
                      filters.status === status ? 'border-brand-gold-500 shadow-md' : undefined
                    }
                  />
                </button>
              );
            })}
        </section>

        {pending > 0 && filters.status !== 'ENVIADO' && (
          <button
            type="button"
            onClick={() => patch({ status: 'ENVIADO', mine: undefined })}
            className="flex w-full animate-fade-in items-center gap-3 rounded-lg border border-dashed border-brand-gold-500/60 bg-brand-gold-50/60 px-4 py-3 text-left text-sm transition-colors duration-fast hover:bg-brand-gold-50 focus:outline-none focus-visible:shadow-focus"
          >
            <Hourglass className="h-4 w-4 shrink-0 text-brand-gold-700" aria-hidden="true" />
            <span className="text-ink">
              {t('reimbursements:pendingBanner', { count: pending })}
            </span>
            <span className="ml-auto font-medium text-brand-gold-700">
              {t('reimbursements:pendingAction')}
            </span>
          </button>
        )}

        <Separator />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {viewAll && (
            <Tabs
              value={filters.mine ? 'mine' : 'all'}
              onValueChange={(v) => patch({ mine: v === 'mine' || undefined })}
            >
              <TabsList>
                <TabsTrigger value="all">{t('reimbursements:scope.all')}</TabsTrigger>
                <TabsTrigger value="mine">{t('reimbursements:scope.mine')}</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <Input
              label={t('reimbursements:filters.search.label')}
              placeholder={
                viewAll
                  ? t('reimbursements:filters.search.placeholderAll')
                  : t('reimbursements:filters.search.placeholderMine')
              }
              leftIcon={<Search className="h-4 w-4" />}
              value={filters.busca ?? ''}
              onChange={(e) => patch({ busca: e.target.value || undefined })}
              name="reimbursement-search"
            />
            <SelectField
              id="reimbursements-filter-status"
              label={t('reimbursements:filters.status')}
              noneLabel={t('reimbursements:filters.allStatuses')}
              value={filters.status}
              onChange={(v) =>
                patch({ status: (v || undefined) as ReimbursementStatus | undefined })
              }
              options={Object.values(ReimbursementStatus).map((value) => ({
                value,
                label: REIMBURSEMENT_STATUS_LABELS[value],
              }))}
            />
          </div>
        </div>

        {list.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full" />
            ))}
          </div>
        )}

        {list.isError && (
          <ErrorState
            title={t('reimbursements:error.title')}
            description={t('reimbursements:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title={
              hasFilters ? t('reimbursements:empty.filteredTitle') : t('reimbursements:empty.title')
            }
            description={
              hasFilters
                ? t('reimbursements:empty.filteredDescription')
                : t('reimbursements:empty.description')
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => patch({ busca: undefined, status: undefined })}
                >
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
            <ReimbursementsTable
              rows={rows}
              isFetching={list.isFetching && !list.isLoading}
              showRequester={viewAll && !filters.mine}
            />
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

export default ReimbursementsPage;
