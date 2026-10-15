import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  PiggyBank,
  Sparkles,
  User,
  Wand2,
} from 'lucide-react';
import { toDateOnly, type QuotationSupplierDto } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { InfoTile } from '@/components/data-display/InfoTile';
import { StatTile } from '@/components/data-display/StatTile';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ExportMenu } from '@/components/common/ExportMenu';
import { Button } from '@/components/ui/Button';
import type { ExportFormat } from '@/utils/export/report';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PurchaseRequestStatusBadge } from '@/features/purchase-requests/components/PurchaseRequestBadges';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDateOnly, formatDateTime } from '@/utils/format';
import {
  useCancelQuotation,
  useCloseQuotation,
  useDisableOpenLink,
  useEnableOpenLink,
  usePickCheapest,
  useQuotation,
  useSetQuotationWinner,
} from '../hooks/useQuotations';
import { QuotationStatusBadge } from '../components/QuotationBadges';
import { QuotationMap } from '../components/QuotationMap';
import { SuppliersPanel } from '../components/SuppliersPanel';
import { OpenLinkCard } from '../components/OpenLinkCard';
import { AddSupplierDialog, ManualPricesDialog } from '../components/QuotationDialogs';

export function QuotationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('quotations');
  const { can } = useAuth();
  const { data: quotation, isLoading, isError, refetch } = useQuotation(id);
  const setWinner = useSetQuotationWinner(id);
  const pickCheapest = usePickCheapest(id);
  const close = useCloseQuotation(id);
  const cancel = useCancelQuotation(id);
  const enableOpenLink = useEnableOpenLink(id);
  const disableOpenLink = useDisableOpenLink(id);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [manualFor, setManualFor] = useState<QuotationSupplierDto | null>(null);
  const [confirm, setConfirm] = useState<'close' | 'cancel' | null>(null);

  if (isLoading) return <PageSkeleton tiles={4} />;

  if (isError || !quotation) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('quotations:detail.notFoundTitle')}
          description={t('quotations:detail.notFoundDescription')}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              {t('common:actions.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  const canManage = can(PERMISSIONS.QUOTATION_WRITE);
  const isOpen = quotation.status === 'ABERTA';
  const { analysis } = quotation;
  const overdue = isOpen && quotation.prazoResposta < toDateOnly();
  const answered = quotation.suppliers.filter((s) => s.status === 'RESPONDIDO').length;

  async function handleExport(format: ExportFormat) {
    if (!quotation || format === 'csv') return;
    const { exportQuotationMap } = await import('../lib/export');
    await exportQuotationMap(quotation, format);
  }

  return (
    <>
      <PageHeader
        eyebrow={t('quotations:detail.eyebrow', { numero: quotation.numero })}
        title={quotation.titulo}
        description={t('quotations:detail.createdBy', {
          name: quotation.createdByName,
          date: formatDateTime(quotation.createdAt),
        })}
        actions={
          <>
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(ROUTE_PATHS.COTACOES)}
            >
              {t('quotations:detail.back')}
            </Button>
            <ExportMenu
              onExport={handleExport}
              formats={['pdf', 'xlsx']}
              label={t('quotations:detail.export')}
            />
            {canManage && isOpen && (
              <>
                <Button
                  variant="outline"
                  leftIcon={<Wand2 className="h-4 w-4" />}
                  onClick={() => pickCheapest.mutate(undefined)}
                  isLoading={pickCheapest.isPending}
                  disabled={analysis.totalMelhorPreco === null}
                >
                  {t('quotations:detail.pickCheapest')}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<CheckCheck className="h-4 w-4" />}
                  onClick={() => setConfirm('close')}
                  disabled={analysis.itensComVencedor === 0}
                >
                  {t('quotations:detail.close')}
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoTile
            icon={ClipboardList}
            label={t('quotations:detail.status')}
            value={
              <span className="flex flex-wrap items-center gap-2">
                <QuotationStatusBadge status={quotation.status} size="md" />
                {quotation.encerradaEm && (
                  <span className="text-xs text-ink-soft">
                    {formatDateTime(quotation.encerradaEm)}
                  </span>
                )}
              </span>
            }
          />
          <InfoTile
            icon={CalendarClock}
            label={t('quotations:detail.deadline')}
            value={
              <span className={overdue ? 'font-semibold text-danger' : undefined}>
                {formatDateOnly(quotation.prazoResposta)}
                {overdue && ` · ${t('quotations:table.overdue')}`}
              </span>
            }
          />
          {quotation.purchaseRequest ? (
            <>
              <InfoTile
                icon={ClipboardList}
                label={t('quotations:detail.request')}
                value={
                  <span className="flex flex-col gap-1">
                    <Link
                      to={routeTo.purchaseRequest(quotation.purchaseRequest.id)}
                      className="text-ink hover:text-brand-gold-700 hover:underline"
                    >
                      {quotation.purchaseRequest.title}
                    </Link>
                    <PurchaseRequestStatusBadge status={quotation.purchaseRequest.status} />
                  </span>
                }
              />
              <InfoTile
                icon={User}
                label={t('quotations:detail.requester')}
                value={[
                  quotation.purchaseRequest.requesterName,
                  quotation.purchaseRequest.costCenter,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </>
          ) : quotation.plan ? (
            <>
              <InfoTile
                icon={ClipboardList}
                label={t('quotations:detail.plan')}
                value={
                  <Link
                    to={routeTo.plan(quotation.plan.id)}
                    className="text-ink hover:text-brand-gold-700 hover:underline"
                  >
                    {t('quotations:detail.planLink', {
                      numero: quotation.plan.numero,
                      titulo: quotation.plan.titulo,
                    })}
                  </Link>
                }
              />
              <InfoTile
                icon={User}
                label={t('quotations:detail.workSite')}
                value={quotation.plan.obra ?? '—'}
              />
            </>
          ) : null}
        </div>

        {/* Retorno de preços: o que a cotação já diz sobre o pedido. */}
        <section
          aria-labelledby="quotation-feedback"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="quotation-feedback" className="sr-only">
            {t('quotations:feedback.title')}
          </h2>
          <StatTile
            label={t('quotations:feedback.answers')}
            value={`${answered}/${quotation.suppliers.length}`}
            hint={t('quotations:feedback.answersHint')}
          />
          <StatTile
            label={t('quotations:feedback.bestTotal')}
            value={formatCurrencyBRL(analysis.totalMelhorPreco)}
            icon={<Sparkles className="h-4 w-4" />}
            hint={t('quotations:feedback.bestTotalHint')}
          />
          <StatTile
            label={t('quotations:feedback.winnersTotal')}
            value={formatCurrencyBRL(analysis.totalVencedores)}
            icon={<CheckCheck className="h-4 w-4" />}
            hint={t('quotations:feedback.winnersHint', {
              count: analysis.itensComVencedor,
              total: quotation.items.length,
            })}
          />
          <StatTile
            label={t('quotations:feedback.savings')}
            value={
              analysis.economiaVsUltimo === null ? (
                '—'
              ) : (
                <span
                  className={
                    Number(analysis.economiaVsUltimo) >= 0 ? 'text-success' : 'text-danger'
                  }
                >
                  {formatCurrencyBRL(analysis.economiaVsUltimo)}
                </span>
              )
            }
            icon={<PiggyBank className="h-4 w-4" />}
            hint={
              analysis.economiaVsUltimo !== null && Number(analysis.economiaVsUltimo) < 0
                ? t('quotations:feedback.savingsNegative')
                : t('quotations:feedback.savingsHint')
            }
          />
        </section>

        {quotation.observacoes && (
          <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
            <strong className="text-ink">{t('quotations:detail.notes')}</strong>{' '}
            {quotation.observacoes}
          </p>
        )}

        <OpenLinkCard
          token={quotation.linkAbertoToken}
          isOpen={isOpen}
          canManage={canManage}
          context={quotation}
          onEnable={() => enableOpenLink.mutate(undefined)}
          onDisable={() => disableOpenLink.mutate(undefined)}
          isPending={enableOpenLink.isPending || disableOpenLink.isPending}
        />

        <SuppliersPanel
          quotation={quotation}
          canManage={canManage}
          onAddSupplier={() => setAddSupplierOpen(true)}
          onEnterPrices={setManualFor}
        />

        <section aria-labelledby="quotation-map" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="quotation-map" className="text-base font-semibold text-ink">
              {t('quotations:map.title')}
            </h2>
            <p className="text-xs text-ink-soft">{t('quotations:map.legend')}</p>
          </div>
          <QuotationMap
            quotation={quotation}
            canChooseWinner={canManage && isOpen}
            pendingItemId={setWinner.isPending ? (setWinner.variables?.itemId ?? null) : null}
            onChooseWinner={(itemId, quotationSupplierId) =>
              setWinner.mutate({ itemId, quotationSupplierId })
            }
          />
        </section>

        {canManage && isOpen && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              className="text-danger"
              leftIcon={<Ban className="h-4 w-4" />}
              onClick={() => setConfirm('cancel')}
            >
              {t('quotations:detail.cancel')}
            </Button>
          </div>
        )}
      </div>

      <AddSupplierDialog
        quotation={quotation}
        open={addSupplierOpen}
        onOpenChange={setAddSupplierOpen}
      />
      <ManualPricesDialog
        quotation={quotation}
        supplier={manualFor}
        onOpenChange={(open) => !open && setManualFor(null)}
      />
      <ConfirmDialog
        open={confirm === 'close'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t('quotations:confirm.closeTitle')}
        description={t('quotations:confirm.closeDescription', {
          count: analysis.itensComVencedor,
          total: quotation.items.length,
        })}
        confirmLabel={t('quotations:detail.close')}
        isSubmitting={close.isPending}
        onConfirm={() => close.mutate(undefined, { onSuccess: () => setConfirm(null) })}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t('quotations:confirm.cancelTitle')}
        description={t('quotations:confirm.cancelDescription')}
        destructive
        confirmLabel={t('quotations:detail.cancel')}
        isSubmitting={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined, { onSuccess: () => setConfirm(null) })}
      />
    </>
  );
}

export default QuotationDetailPage;
