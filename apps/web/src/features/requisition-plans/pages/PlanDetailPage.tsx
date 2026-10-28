import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  HardHat,
  Info,
  Pencil,
  Rocket,
  Scale,
  Tag,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { InfoTile } from '@/components/data-display/InfoTile';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ExportMenu } from '@/components/common/ExportMenu';
import { Button } from '@/components/ui/Button';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PurchaseRequestStatusBadge } from '@/features/purchase-requests/components/PurchaseRequestBadges';
import { QuotationStatusBadge } from '@/features/quotations/components/QuotationBadges';
import { OpenLinkCard } from '@/features/quotations/components/OpenLinkCard';
import { useDisableOpenLink, useEnableOpenLink } from '@/features/quotations/hooks/useQuotations';
import { formatDateOnly, formatDateTime } from '@/utils/format';
import { useCancelPlan, usePlan } from '../hooks/usePlans';
import { exportPlanRequestPdf } from '../lib/exports';
import { LaunchPlanDialog } from '../components/LaunchPlanDialog';
import { PlanStatusBadge } from '../components/PlanStatusBadge';
import { PlanItemsTable } from './PlanFormPage';

export function PlanDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('plans');
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.QUOTATION_WRITE);
  const { data: plan, isLoading, isError, refetch } = usePlan(id);
  const cancel = useCancelPlan(id);
  const enableOpenLink = useEnableOpenLink(plan?.quotation?.id ?? '');
  const disableOpenLink = useDisableOpenLink(plan?.quotation?.id ?? '');
  const [launchOpen, setLaunchOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) return <PageSkeleton tiles={4} />;
  if (isError || !plan) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('plans:detail.notFoundTitle')}
          description={t('plans:detail.notFoundDescription')}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              {t('common:actions.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  const isDraft = plan.status === 'RASCUNHO';
  const quotation = plan.quotation;

  const refreshAfterLink = { onSuccess: () => void refetch() };

  return (
    <>
      <PageHeader
        eyebrow={t('plans:detail.eyebrow', { numero: plan.numero })}
        title={plan.titulo}
        description={t('plans:detail.createdBy', {
          name: plan.createdByName,
          date: formatDateTime(plan.createdAt),
        })}
        actions={
          <>
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(ROUTE_PATHS.PLANOS)}
            >
              {t('plans:detail.back')}
            </Button>
            <ExportMenu
              formats={['pdf']}
              label={t('plans:detail.pdf')}
              onExport={() => exportPlanRequestPdf(plan)}
            />
            {quotation && (
              <Button
                variant="outline"
                leftIcon={<Scale className="h-4 w-4" />}
                onClick={() => navigate(routeTo.quotation(quotation.id))}
              >
                {t('plans:detail.openMap')}
              </Button>
            )}
            {canWrite && isDraft && (
              <>
                <Button
                  variant="ghost"
                  leftIcon={<Ban className="h-4 w-4" />}
                  onClick={() => setConfirmCancel(true)}
                >
                  {t('plans:detail.cancel')}
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<Pencil className="h-4 w-4" />}
                  onClick={() => navigate(routeTo.planEdit(plan.id))}
                >
                  {t('plans:detail.edit')}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Rocket className="h-4 w-4" />}
                  onClick={() => setLaunchOpen(true)}
                >
                  {t('plans:detail.launch')}
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoTile
            icon={Tag}
            label={t('plans:detail.status')}
            value={
              <span className="flex flex-wrap items-center gap-2">
                <PlanStatusBadge status={plan.status} size="md" />
                {plan.lancadoEm && (
                  <span className="text-xs text-ink-soft">{formatDateTime(plan.lancadoEm)}</span>
                )}
              </span>
            }
          />
          <InfoTile icon={HardHat} label={t('plans:detail.workSite')} value={plan.obra ?? '—'} />
          <InfoTile
            icon={CalendarClock}
            label={t('plans:detail.deadline')}
            value={formatDateOnly(plan.prazoResposta)}
          />
          <InfoTile
            icon={Scale}
            label={t('plans:detail.quotation')}
            value={
              quotation ? (
                <Link
                  to={routeTo.quotation(quotation.id)}
                  className="flex flex-wrap items-center gap-2 text-ink hover:text-brand-gold-700"
                >
                  <span className="font-mono">#{quotation.numero}</span>
                  <QuotationStatusBadge status={quotation.status} />
                  <span className="text-xs text-ink-soft">
                    {t('plans:table.answersValue', {
                      answered: quotation.respondidos,
                      total: quotation.convidados,
                    })}
                  </span>
                </Link>
              ) : (
                t('plans:detail.notLaunched')
              )
            }
          />
        </div>

        {isDraft && (
          <p className="flex items-start gap-2 rounded-md border border-brand-gold-300 bg-brand-gold-50/60 px-4 py-3 text-sm text-ink">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-700" aria-hidden="true" />
            {t('plans:detail.draftHint')}
          </p>
        )}

        {quotation && (
          <OpenLinkCard
            token={plan.linkAbertoToken}
            isOpen={quotation.status === 'ABERTA'}
            canManage={canWrite}
            context={{
              numero: quotation.numero,
              titulo: plan.titulo,
              prazoResposta: plan.prazoResposta,
              items: plan.items,
            }}
            onEnable={() => enableOpenLink.mutate(undefined, refreshAfterLink)}
            onDisable={() => disableOpenLink.mutate(undefined, refreshAfterLink)}
            isPending={enableOpenLink.isPending || disableOpenLink.isPending}
          />
        )}

        {plan.observacoes && (
          <p className="whitespace-pre-line rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
            <strong className="text-ink">{t('plans:detail.notes')}</strong> {plan.observacoes}
          </p>
        )}

        <section aria-labelledby="plan-requests-list" className="space-y-3">
          <h2 id="plan-requests-list" className="text-base font-semibold text-ink">
            {t('plans:detail.requestsTitle', { count: plan.requests.length })}
          </h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plan.requests.map((request) => (
              <li
                key={request.id}
                className="rounded-lg border border-border bg-surface p-4 shadow-sm"
              >
                <Link
                  to={routeTo.purchaseRequest(request.id)}
                  className="font-medium text-ink hover:text-brand-gold-700 hover:underline"
                >
                  {request.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                  <PurchaseRequestStatusBadge status={request.status} />
                  <span>
                    {[
                      request.costCenter,
                      request.requesterName,
                      t('plans:form.itemCount', { count: request.itemCount }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="plan-items" className="space-y-3">
          <h2 id="plan-items" className="text-base font-semibold text-ink">
            {t('plans:detail.itemsTitle', { count: plan.items.length })}
          </h2>
          <PlanItemsTable items={plan.items} />
        </section>
      </div>

      <LaunchPlanDialog plan={plan} open={launchOpen} onOpenChange={setLaunchOpen} />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t('plans:detail.cancelTitle')}
        description={t('plans:detail.cancelDescription')}
        confirmLabel={t('plans:detail.cancel')}
        destructive
        isSubmitting={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined, { onSuccess: () => setConfirmCancel(false) })}
      />
    </>
  );
}

export default PlanDetailPage;
