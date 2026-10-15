import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronRight, ClipboardList, FilePen, Layers, Plus, Rocket, Search } from 'lucide-react';
import { RequisitionPlanStatus } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ExportMenu } from '@/components/common/ExportMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { REQUISITION_PLAN_STATUS_LABELS } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { QuotationStatusBadge } from '@/features/quotations/components/QuotationBadges';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/utils/cn';
import {
  describeFilters,
  exportReport,
  fetchAllPages,
  type ExportFormat,
} from '@/utils/export/report';
import { formatDateOnly } from '@/utils/format';
import { usePlans, usePlanStats } from '../hooks/usePlans';
import { plansApi } from '../services/plans.api';
import { plansReport } from '../lib/exports';
import { PlanStatusBadge } from '../components/PlanStatusBadge';

const PAGE_SIZE = 15;

/** Planos de requisição: solicitações aprovadas reunidas numa lista só para cotar. */
export function PlansPage() {
  const { t } = useTranslation('plans');
  const navigate = useNavigate();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.QUOTATION_WRITE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RequisitionPlanStatus | undefined>();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const stats = usePlanStats();
  const list = usePlans({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status,
  });
  const rows = list.data?.data ?? [];

  async function handleExport(format: ExportFormat) {
    const all = await fetchAllPages((current, pageSize) =>
      plansApi.list({ page: current, pageSize, search: debouncedSearch || undefined, status }),
    );
    if (all.length === 0) {
      toast.info(t('common:export.empty'));
      return;
    }
    const meta = describeFilters([
      [t('plans:filters.search'), debouncedSearch],
      [t('plans:filters.status'), status && REQUISITION_PLAN_STATUS_LABELS[status]],
    ]);
    await exportReport(plansReport(all, meta), format);
  }

  return (
    <>
      <PageHeader
        eyebrow={t('plans:page.eyebrow')}
        title={t('plans:page.title')}
        description={t('plans:page.description')}
        actions={
          <>
            <ExportMenu onExport={handleExport} />
            {canWrite && (
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => navigate(ROUTE_PATHS.PLANO_NOVO)}
              >
                {t('plans:page.new')}
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section aria-labelledby="plans-kpi" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <h2 id="plans-kpi" className="sr-only">
            {t('plans:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('plans:kpi.available')}
                value={<CountUp value={stats.data.solicitacoesDisponiveis} />}
                icon={<ClipboardList className="h-4 w-4" />}
                hint={t('plans:kpi.availableHint')}
              />
              <StatTile
                label={t('plans:kpi.drafts')}
                value={<CountUp value={stats.data.rascunhos} />}
                icon={<FilePen className="h-4 w-4" />}
              />
              <StatTile
                label={t('plans:kpi.launched')}
                value={<CountUp value={stats.data.lancados} />}
                icon={<Rocket className="h-4 w-4" />}
                hint={t('plans:kpi.launchedHint')}
              />
            </>
          )}
        </section>

        <Separator />

        <div className="flex flex-wrap items-end gap-3">
          <Input
            label={t('plans:filters.search')}
            placeholder={t('plans:filters.searchPlaceholder')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            name="plan-search"
            className="max-w-md flex-1"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('plans:filters.status')}>
            {[undefined, ...Object.values(RequisitionPlanStatus)].map((value) => (
              <Button
                key={value ?? 'all'}
                size="sm"
                variant={status === value ? 'primary' : 'outline'}
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                {value ? REQUISITION_PLAN_STATUS_LABELS[value] : t('plans:filters.all')}
              </Button>
            ))}
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
            title={t('plans:error.title')}
            description={t('plans:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<Layers className="h-6 w-6" />}
            title={t('plans:empty.title')}
            description={t('plans:empty.description')}
            action={
              canWrite ? (
                <Button variant="primary" onClick={() => navigate(ROUTE_PATHS.PLANO_NOVO)}>
                  {t('plans:page.new')}
                </Button>
              ) : undefined
            }
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <Table
              className={cn(
                'transition-opacity duration-base',
                list.isFetching && !list.isLoading && 'opacity-60',
              )}
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t('plans:table.number')}</TableHead>
                  <TableHead>{t('plans:table.title')}</TableHead>
                  <TableHead>{t('plans:table.status')}</TableHead>
                  <TableHead>{t('plans:table.deadline')}</TableHead>
                  <TableHead className="text-right">{t('plans:table.requests')}</TableHead>
                  <TableHead>{t('plans:table.quotation')}</TableHead>
                  <TableHead className="w-10" aria-hidden="true" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  // Clique na linha é atalho de mouse; teclado usa o link do título.
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                  <TableRow
                    key={row.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(routeTo.plan(row.id))}
                  >
                    <TableCell className="font-mono text-ink-soft">#{row.numero}</TableCell>
                    <TableCell>
                      <Link
                        to={routeTo.plan(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-ink hover:underline group-hover:text-brand-gold-700"
                      >
                        {row.titulo}
                      </Link>
                      <p className="text-xs text-ink-soft">
                        {[row.obra, row.createdByName].filter(Boolean).join(' · ')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <PlanStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ink-soft">
                      {formatDateOnly(row.prazoResposta)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.solicitacoes}</TableCell>
                    <TableCell>
                      {row.quotation ? (
                        <span className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-mono text-ink-soft">#{row.quotation.numero}</span>
                          <QuotationStatusBadge status={row.quotation.status} />
                          <span className="tabular-nums text-ink-soft">
                            {t('plans:table.answersValue', {
                              answered: row.quotation.respondidos,
                              total: row.quotation.convidados,
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </TableCell>
                    <TableCell aria-hidden="true">
                      <ChevronRight className="h-4 w-4 text-ink-soft transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-brand-gold-700" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

export default PlansPage;
