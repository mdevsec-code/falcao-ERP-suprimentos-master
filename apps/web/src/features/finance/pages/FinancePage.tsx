import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Trans, useTranslation } from 'react-i18next';
import {
  AlarmClock,
  CalendarClock,
  CircleCheckBig,
  FileCode2,
  FileX2,
  Plus,
  Wallet,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ExportMenu } from '@/components/common/ExportMenu';
import { SelectField } from '@/components/common/SelectField';
import { RankingBarChart } from '@/components/charts';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/constants/permissions';
import { exportReport, fetchAllPages, type ExportFormat } from '@/utils/export/report';
import { formatCurrencyBRL } from '@/utils/format';
import { getIntlLocale } from '@/utils/locale';

import {
  useByCostCenter,
  useCancelPayable,
  useCashFlow,
  useCreatePayable,
  usePayableCostCenters,
  usePayables,
  usePayableStats,
  usePayPayable,
  usePreviewInvoiceXml,
  useRegisterInvoice,
  useUpdatePayable,
  useUploadInvoiceFile,
} from '../hooks/useFinance';
import { financeApi } from '../services/finance.api';
import { CashFlowChart } from '../components/CashFlowChart';
import { FiltersBar } from '../components/FiltersBar';
import { PayablesTable } from '../components/PayablesTable';
import { PayableDialog } from '../components/PayableDialog';
import { PayDialog } from '../components/PayDialog';
import { InvoiceDialog } from '../components/InvoiceDialog';
import { invoicesReport, payableFiltersMeta, payablesReport } from '../lib/reports';
import {
  fromPayableForm,
  toListParams,
  type PayableDto,
  type PayableFilters,
  type PayableFormInput,
} from '../types';

const PAGE_SIZE = 15;

const compactNumber = (value: number) =>
  new Intl.NumberFormat(getIntlLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );

export function FinancePage() {
  const { t } = useTranslation('finance');
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.FINANCE_WRITE);

  const [filters, setFilters] = useState<PayableFilters>({ status: 'ABERTO' });
  const [page, setPage] = useState(1);
  const [chartCostCenter, setChartCostCenter] = useState('');
  const debouncedSearch = useDebounce(filters.busca, 300);
  const listParams = toListParams(filters, debouncedSearch);

  const stats = usePayableStats();
  const cashFlow = useCashFlow(chartCostCenter);
  const byCostCenter = useByCostCenter();
  const costCenters = usePayableCostCenters();
  const list = usePayables({ ...listParams, page, pageSize: PAGE_SIZE });

  const createPayable = useCreatePayable();
  const updatePayable = useUpdatePayable();
  const payPayable = usePayPayable();
  const registerInvoice = useRegisterInvoice();
  const cancelPayable = useCancelPayable();

  const [editing, setEditing] = useState<PayableDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [paying, setPaying] = useState<PayableDto | null>(null);
  const [invoicing, setInvoicing] = useState<PayableDto | null>(null);
  const [cancelling, setCancelling] = useState<PayableDto | null>(null);
  /** Conta nova aberta a partir do XML: valores sugeridos e o arquivo, anexado depois de criar. */
  const [prefill, setPrefill] = useState<Partial<PayableFormInput> | null>(null);
  const [pendingXml, setPendingXml] = useState<File | null>(null);
  const xmlInput = useRef<HTMLInputElement>(null);
  const previewXml = usePreviewInvoiceXml();
  const uploadInvoiceFile = useUploadInvoiceFile();

  function handleFilterChange(patch: Partial<PayableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function handleClearAll() {
    setFilters({});
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setPrefill(null);
    setPendingXml(null);
    setFormOpen(true);
  }

  /** Lê o XML da NF-e e abre o lançamento já preenchido (fornecedor, valor, vencimento). */
  function handleXmlChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    previewXml.mutate(file, {
      onSuccess: (check) => {
        setEditing(null);
        setPendingXml(file);
        setPrefill({
          descricao: t('finance:importXml.description', {
            numero: check.numero,
            emitente: check.supplierName ?? check.emitenteNome ?? '',
          }).slice(0, 200),
          valor: check.valor ? Number(check.valor) : ('' as unknown as number),
          vencimento: check.primeiroVencimento ?? '',
          supplierId: check.supplierId ?? '',
          notaFiscal: check.numero,
          notaFiscalEmissao: check.emissao ?? '',
        });
        check.avisos.forEach((aviso) => toast.warning(aviso));
        setFormOpen(true);
      },
    });
  }

  function handleSubmit(values: PayableFormInput) {
    const close = { onSuccess: () => setFormOpen(false) };
    if (editing) {
      updatePayable.mutate(
        { id: editing.id, input: fromPayableForm(values, editing.origem === 'REEMBOLSO') },
        close,
      );
    } else {
      createPayable.mutate(fromPayableForm(values), {
        onSuccess: (created) => {
          setFormOpen(false);
          // Conta veio do XML: o arquivo vai junto, e a chave de acesso fica gravada.
          if (pendingXml) {
            uploadInvoiceFile.mutate({ id: (created as PayableDto).id, file: pendingXml });
          }
          setPendingXml(null);
          setPrefill(null);
        },
      });
    }
  }

  /** Notas fiscais do filtro atual (todas as páginas), no padrão de exportação. */
  async function handleExportInvoices(format: ExportFormat) {
    const rows = await fetchAllPages((current, pageSize) =>
      financeApi.list({
        ...listParams,
        semNota: undefined,
        comNota: true,
        page: current,
        pageSize,
      }),
    );
    if (rows.length === 0) {
      toast.info(t('finance:invoiceExport.empty'));
      return;
    }
    await exportReport(invoicesReport(rows, payableFiltersMeta(filters, debouncedSearch)), format);
  }

  /** Contas a pagar do filtro atual (não só a página), em PDF, Excel ou CSV. */
  async function handleExport(format: ExportFormat) {
    const rows = await fetchAllPages((current, pageSize) =>
      financeApi.list({ ...listParams, page: current, pageSize }),
    );
    if (rows.length === 0) {
      toast.info(t('common:export.empty'));
      return;
    }
    await exportReport(payablesReport(rows, payableFiltersMeta(filters, debouncedSearch)), format);
  }

  const hasFilters = Object.values(filters).some(Boolean);
  const rows = list.data?.data ?? [];
  const costCenterLabel = (value: string) => value || t('finance:noCostCenter');

  return (
    <>
      <PageHeader
        eyebrow={t('finance:page.eyebrow')}
        title={t('finance:page.title')}
        description={t('finance:page.description')}
        actions={
          <>
            <ExportMenu onExport={handleExport} label={t('finance:actions.export')} />
            <ExportMenu
              onExport={handleExportInvoices}
              label={t('finance:actions.exportInvoices')}
            />
            {canWrite && (
              <>
                <input
                  ref={xmlInput}
                  type="file"
                  accept=".xml,text/xml,application/xml"
                  className="sr-only"
                  onChange={handleXmlChosen}
                  aria-label={t('finance:actions.importXml')}
                />
                <Button
                  variant="outline"
                  leftIcon={<FileCode2 className="h-4 w-4" />}
                  onClick={() => xmlInput.current?.click()}
                  isLoading={previewXml.isPending}
                >
                  {t('finance:actions.importXml')}
                </Button>
              </>
            )}
            {canWrite && (
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openCreate}
              >
                {t('finance:actions.new')}
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="finance-kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="finance-kpi-title" className="sr-only">
            {t('finance:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('finance:kpi.open')}
                value={<CountUp value={Number(stats.data.aPagar)} format={formatCurrencyBRL} />}
                hint={t('finance:kpi.count', { count: stats.data.aPagarCount })}
                icon={<Wallet className="h-4 w-4" />}
              />
              <StatTile
                label={t('finance:kpi.overdue')}
                value={<CountUp value={Number(stats.data.vencido)} format={formatCurrencyBRL} />}
                hint={t('finance:kpi.count', { count: stats.data.vencidoCount })}
                icon={<AlarmClock className="h-4 w-4" />}
              />
              <StatTile
                label={t('finance:kpi.next7')}
                value={
                  <CountUp value={Number(stats.data.proximos7Dias)} format={formatCurrencyBRL} />
                }
                hint={t('finance:kpi.count', { count: stats.data.proximos7DiasCount })}
                icon={<CalendarClock className="h-4 w-4" />}
              />
              <StatTile
                label={t('finance:kpi.paidMonth')}
                value={<CountUp value={Number(stats.data.pagoNoMes)} format={formatCurrencyBRL} />}
                hint={t('finance:kpi.count', { count: stats.data.pagoNoMesCount })}
                icon={<CircleCheckBig className="h-4 w-4" />}
              />
            </>
          )}
        </section>

        {stats.data && stats.data.semNotaCount > 0 && !filters.semNota && (
          <button
            type="button"
            onClick={() => handleFilterChange({ semNota: true, status: undefined })}
            className="flex w-full animate-fade-in items-center gap-3 rounded-lg border border-dashed border-warning/60 bg-warning/5 px-4 py-3 text-left text-sm transition-colors duration-fast hover:bg-warning/10 focus:outline-none focus-visible:shadow-focus"
          >
            <FileX2 className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span className="text-ink">
              <Trans
                i18nKey="finance:reconcile.banner"
                count={stats.data.semNotaCount}
                components={{ strong: <strong /> }}
              />
            </span>
            <span className="ml-auto font-medium text-brand-gold-700">
              {t('finance:reconcile.action')}
            </span>
          </button>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
          <Card className="animate-slide-up">
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">{t('finance:cashFlow.title')}</CardTitle>
                <CardDescription>{t('finance:cashFlow.description')}</CardDescription>
              </div>
              <div className="w-56">
                <SelectField
                  id="cash-flow-cost-center"
                  label={t('finance:filters.costCenter')}
                  noneLabel={t('finance:filters.allCostCenters')}
                  value={chartCostCenter}
                  onChange={setChartCostCenter}
                  options={(costCenters.data ?? []).map((value) => ({ value, label: value }))}
                />
              </div>
            </CardHeader>
            <CardContent>
              {cashFlow.data ? (
                <CashFlowChart data={cashFlow.data} />
              ) : (
                <Skeleton className="h-[290px] w-full" />
              )}
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '60ms' }}>
            <CardHeader>
              <CardTitle className="text-base">{t('finance:byCostCenter.title')}</CardTitle>
              <CardDescription>{t('finance:byCostCenter.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {byCostCenter.data ? (
                byCostCenter.data.length > 0 ? (
                  <RankingBarChart
                    data={byCostCenter.data.map((row) => ({
                      label: costCenterLabel(row.costCenter),
                      value: Number(row.aberto) + Number(row.pago),
                    }))}
                    formatValue={formatCurrencyBRL}
                    formatTick={compactNumber}
                    labelWidth={160}
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-ink-soft">
                    {t('finance:byCostCenter.empty')}
                  </p>
                )
              ) : (
                <Skeleton className="h-[240px] w-full" />
              )}
            </CardContent>
          </Card>
        </section>

        <Separator />

        <FiltersBar
          filters={filters}
          costCenters={costCenters.data ?? []}
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
            title={t('finance:error.title')}
            description={t('finance:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title={hasFilters ? t('finance:empty.filteredTitle') : t('finance:empty.title')}
            description={
              hasFilters ? t('finance:empty.filteredDescription') : t('finance:empty.description')
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={handleClearAll}>
                  {t('common:filters.clearAll')}
                </Button>
              ) : undefined
            }
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <PayablesTable
              rows={rows}
              isFetching={list.isFetching && !list.isLoading}
              canWrite={canWrite}
              onPay={setPaying}
              onInvoice={setInvoicing}
              onEdit={(payable) => {
                setEditing(payable);
                setFormOpen(true);
              }}
              onCancel={setCancelling}
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

      <PayableDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        payable={editing}
        initialValues={prefill}
        onSubmit={handleSubmit}
        isSubmitting={createPayable.isPending || updatePayable.isPending}
      />

      <PayDialog
        payable={paying}
        onOpenChange={(open) => !open && setPaying(null)}
        isSubmitting={payPayable.isPending}
        onSubmit={(input) =>
          paying &&
          payPayable.mutate({ id: paying.id, input }, { onSuccess: () => setPaying(null) })
        }
      />

      <InvoiceDialog
        payable={invoicing}
        onOpenChange={(open) => !open && setInvoicing(null)}
        canAttach={canWrite}
        isSubmitting={registerInvoice.isPending}
        onSubmit={(input) =>
          invoicing &&
          registerInvoice.mutate(
            { id: invoicing.id, input },
            { onSuccess: () => setInvoicing(null) },
          )
        }
      />

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => !open && setCancelling(null)}
        title={t('finance:confirm.cancelTitle')}
        description={
          <Trans
            i18nKey="finance:confirm.cancelDescription"
            values={{
              name: cancelling?.descricao ?? '',
              value: formatCurrencyBRL(cancelling?.valor),
            }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive
        confirmLabel={t('finance:actions.cancel')}
        isSubmitting={cancelPayable.isPending}
        onConfirm={() =>
          cancelling &&
          cancelPayable.mutate(cancelling.id, { onSuccess: () => setCancelling(null) })
        }
      />
    </>
  );
}

export default FinancePage;
