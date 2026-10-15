import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ExportMenu } from '@/components/common/ExportMenu';
import {
  describeFilters,
  exportReport,
  fetchAllPages,
  type ExportFormat,
} from '@/utils/export/report';
import { quotationsApi } from '../services/quotations.api';
import { quotationsReport } from '../lib/reports';
import { CalendarClock, CheckCircle2, ChevronRight, Hourglass, Scale, Search } from 'lucide-react';
import { QuotationStatus, toDateOnly } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
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
import { QUOTATION_STATUS_LABELS } from '@/constants/enums';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateOnly } from '@/utils/format';
import { cn } from '@/utils/cn';
import { useQuotationStats, useQuotations } from '../hooks/useQuotations';
import { QuotationStatusBadge } from '../components/QuotationBadges';

const PAGE_SIZE = 15;

export function QuotationsPage() {
  const { t } = useTranslation('quotations');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuotationStatus | undefined>('ABERTA');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const today = toDateOnly();

  const stats = useQuotationStats();
  const list = useQuotations({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status,
  });
  const rows = list.data?.data ?? [];

  /** Todas as cotações do filtro atual, em PDF, Excel ou CSV. */
  async function handleExport(format: ExportFormat) {
    const all = await fetchAllPages((current, pageSize) =>
      quotationsApi.list({
        page: current,
        pageSize,
        search: debouncedSearch || undefined,
        status,
      }),
    );
    if (all.length === 0) {
      toast.info(t('common:export.empty'));
      return;
    }
    const meta = describeFilters([
      [t('quotations:filters.search'), debouncedSearch],
      [t('quotations:filters.status'), status && QUOTATION_STATUS_LABELS[status]],
    ]);
    await exportReport(quotationsReport(all, meta), format);
  }

  return (
    <>
      <PageHeader
        eyebrow={t('quotations:page.eyebrow')}
        title={t('quotations:page.title')}
        description={t('quotations:page.description')}
        actions={
          <>
            <ExportMenu onExport={handleExport} />
            <Button variant="outline" onClick={() => navigate(ROUTE_PATHS.APROVACOES)}>
              {t('quotations:page.fromRequests')}
            </Button>
          </>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="quotations-kpi"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="quotations-kpi" className="sr-only">
            {t('quotations:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('quotations:kpi.open')}
                value={<CountUp value={stats.data.abertas} />}
                icon={<Scale className="h-4 w-4" />}
              />
              <StatTile
                label={t('quotations:kpi.waiting')}
                value={<CountUp value={stats.data.aguardandoResposta} />}
                icon={<Hourglass className="h-4 w-4" />}
                hint={t('quotations:kpi.waitingHint')}
              />
              <StatTile
                label={t('quotations:kpi.dueSoon')}
                value={<CountUp value={stats.data.vencendo} />}
                icon={<CalendarClock className="h-4 w-4" />}
                hint={t('quotations:kpi.dueSoonHint')}
              />
              <StatTile
                label={t('quotations:kpi.closedThisMonth')}
                value={<CountUp value={stats.data.encerradasNoMes} />}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
            </>
          )}
        </section>

        <Separator />

        <div className="flex flex-wrap items-end gap-3">
          <Input
            label={t('quotations:filters.search')}
            placeholder={t('quotations:filters.searchPlaceholder')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            name="quotation-search"
            className="max-w-md flex-1"
          />
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('quotations:filters.status')}
          >
            {[undefined, ...Object.values(QuotationStatus)].map((value) => (
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
                {value ? QUOTATION_STATUS_LABELS[value] : t('quotations:filters.all')}
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
            title={t('quotations:error.title')}
            description={t('quotations:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<Scale className="h-6 w-6" />}
            title={t('quotations:empty.title')}
            description={t('quotations:empty.description')}
            action={
              <Button variant="outline" onClick={() => navigate(ROUTE_PATHS.APROVACOES)}>
                {t('quotations:page.fromRequests')}
              </Button>
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
                  <TableHead className="w-20">{t('quotations:table.number')}</TableHead>
                  <TableHead>{t('quotations:table.title')}</TableHead>
                  <TableHead>{t('quotations:table.status')}</TableHead>
                  <TableHead>{t('quotations:table.deadline')}</TableHead>
                  <TableHead className="text-right">{t('quotations:table.answers')}</TableHead>
                  <TableHead className="text-right">{t('quotations:table.items')}</TableHead>
                  <TableHead className="w-10" aria-hidden="true" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const overdue = row.status === 'ABERTA' && row.prazoResposta < today;
                  return (
                    // Clique na linha é atalho de mouse; teclado usa o link do título.
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                    <TableRow
                      key={row.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(routeTo.quotation(row.id))}
                    >
                      <TableCell className="font-mono text-ink-soft">#{row.numero}</TableCell>
                      <TableCell>
                        <Link
                          to={routeTo.quotation(row.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-ink hover:underline group-hover:text-brand-gold-700"
                        >
                          {row.titulo}
                        </Link>
                        <p className="text-xs text-ink-soft">
                          {row.plan
                            ? t('quotations:table.plan', { numero: row.plan.numero })
                            : t('quotations:table.request', {
                                title: row.purchaseRequestTitle,
                              })}{' '}
                          · {row.createdByName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <QuotationStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell
                        className={cn(
                          'whitespace-nowrap',
                          overdue ? 'font-semibold text-danger' : 'text-ink-soft',
                        )}
                      >
                        {formatDateOnly(row.prazoResposta)}
                        {overdue && (
                          <span className="block text-2xs">{t('quotations:table.overdue')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.respondidos}/{row.convidados}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-ink-soft">
                        {row.itens}
                      </TableCell>
                      <TableCell aria-hidden="true">
                        <ChevronRight className="h-4 w-4 text-ink-soft transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-brand-gold-700" />
                      </TableCell>
                    </TableRow>
                  );
                })}
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

export default QuotationsPage;
