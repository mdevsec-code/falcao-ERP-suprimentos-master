import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  AlarmClock,
  ArrowLeft,
  CalendarCheck,
  CircleDollarSign,
  FilePlus2,
  Landmark,
  Paperclip,
  Pencil,
  Stamp,
  Truck,
  Upload,
  User,
} from 'lucide-react';
import type { ContractStatus } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { InfoTile } from '@/components/data-display/InfoTile';
import { FileList, type FileListItem } from '@/components/data-display/FileList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DocumentDialog } from '@/features/documents/components/DocumentDialog';
import { useRemoveDocument, useUploadDocument } from '@/features/documents/hooks/useDocuments';
import { toUploadFormData } from '@/features/documents/types';
import { CONTRACT_STATUS_LABELS } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDateOnly, formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';

import { useContract } from '../hooks/useContracts';
import { useAddAmendment, useChangeContractStatus } from '../hooks/useContractMutations';
import { ContractStatusBadge, DeadlineBadge } from '../components/ContractBadges';
import { VigenciaBar } from '../components/VigenciaBar';
import { AmendmentDialog } from '../components/AmendmentDialog';
import {
  CONTRACT_STATUS_ACTIONS,
  isContractEditable,
  type ContractStatusAction,
} from '../lib/status';

export function ContractDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('contracts');
  const { can } = useAuth();
  const { data: contract, isLoading, isError, refetch } = useContract(id);
  const changeStatus = useChangeContractStatus(id);
  const addAmendment = useAddAmendment(id);
  const uploadDocument = useUploadDocument();
  const removeDocument = useRemoveDocument();

  const [amendmentOpen, setAmendmentOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ContractStatusAction | null>(null);
  const [documentToRemove, setDocumentToRemove] = useState<FileListItem | null>(null);

  if (isLoading) return <PageSkeleton tiles={3} />;

  if (isError || !contract) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('contracts:detail.notFoundTitle')}
          description={t('contracts:detail.notFoundDescription')}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refetch()}>
                {t('common:actions.retry')}
              </Button>
              <Button asChild variant="primary">
                <Link to={ROUTE_PATHS.CONTRATOS}>{t('contracts:actions.backToList')}</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const canWrite = can(PERMISSIONS.CONTRACT_WRITE);
  const editable = isContractEditable(contract.status);
  const canManageDocs = can(PERMISSIONS.DOCUMENT_WRITE);
  const valorTotal = Number(contract.valorTotal);
  const lancado = Number(contract.totalLancado);
  const pago = Number(contract.totalPago);
  const consumo = valorTotal > 0 ? Math.min(100, (lancado / valorTotal) * 100) : 0;

  const attachments: FileListItem[] = contract.documents.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    size: doc.size,
    url: doc.url,
    uploadedByName: doc.uploadedByName,
    uploadedAt: doc.createdAt,
    tag: <span className="font-medium text-ink">{doc.titulo}</span>,
  }));

  function runStatusChange(target: ContractStatus) {
    changeStatus.mutate(target, { onSuccess: () => setPendingAction(null) });
  }

  return (
    <>
      <PageHeader
        eyebrow={t('contracts:detail.eyebrow', { numero: contract.numero })}
        title={contract.objeto}
        description={t('contracts:detail.supplierLine', { name: contract.supplierName })}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(-1)}
            >
              {t('common:actions.back')}
            </Button>
            {canWrite && editable && (
              <Button
                variant="outline"
                leftIcon={<Pencil className="h-4 w-4" />}
                onClick={() => navigate(routeTo.contractEdit(contract.id))}
              >
                {t('common:actions.edit')}
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <Card className="animate-slide-up">
          <CardContent className="space-y-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <ContractStatusBadge status={contract.status} size="md" />
                <DeadlineBadge prazo={contract.prazo} diasRestantes={contract.diasRestantes} />
              </div>
              {canWrite && (
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_STATUS_ACTIONS[contract.status].map((action) => (
                    <Button
                      key={action.target}
                      size="sm"
                      variant={action.variant}
                      isLoading={changeStatus.isPending && changeStatus.variables === action.target}
                      onClick={() =>
                        action.confirm ? setPendingAction(action) : runStatusChange(action.target)
                      }
                    >
                      {t(`contracts:statusActions.${action.labelKey}` as never)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <VigenciaBar
              dataInicio={contract.dataInicio}
              dataFim={contract.dataFim}
              alertaDias={contract.alertaDias}
              prazo={contract.prazo}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">{t('contracts:detail.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="amendments">
              {t('contracts:detail.tabs.amendments', { count: contract.amendments.length })}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              {t('contracts:detail.tabs.attachments', { count: contract.documents.length })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InfoTile
                icon={Truck}
                label={t('contracts:form.fields.supplier')}
                value={
                  <Link
                    to={routeTo.supplier(contract.supplierId)}
                    className="hover:text-brand-gold-700 hover:underline"
                  >
                    {contract.supplierName}
                  </Link>
                }
              />
              <InfoTile
                icon={Landmark}
                label={t('contracts:form.fields.costCenter')}
                value={contract.costCenter ?? '—'}
              />
              <InfoTile
                icon={CircleDollarSign}
                label={t('contracts:detail.value')}
                value={formatCurrencyBRL(contract.valorTotal)}
              />
              <InfoTile
                icon={Stamp}
                label={t('contracts:form.fields.assinadoEm')}
                value={formatDateOnly(contract.assinadoEm) ?? t('contracts:detail.notSigned')}
              />
              <InfoTile
                icon={AlarmClock}
                label={t('contracts:detail.alert')}
                value={t('contracts:detail.alertDays', { count: contract.alertaDias })}
              />
              <InfoTile
                icon={User}
                label={t('contracts:detail.createdBy')}
                value={`${contract.createdByName} · ${formatDateTime(contract.createdAt) ?? ''}`}
              />
            </div>

            {can(PERMISSIONS.FINANCE_READ) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('contracts:detail.financeTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-2 overflow-hidden rounded-full bg-hover">
                    <div
                      className={cn(
                        'h-full origin-left animate-grow-x rounded-full',
                        lancado > valorTotal ? 'bg-danger' : 'bg-brand-gold-500',
                      )}
                      style={{ width: `${consumo}%` }}
                    />
                  </div>
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-ink-soft">{t('contracts:detail.launched')}</dt>
                      <dd className="font-semibold tabular-nums text-ink">
                        {formatCurrencyBRL(lancado)}{' '}
                        <span className="text-xs font-normal text-ink-soft">
                          ({Math.round(consumo)}%)
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-soft">{t('contracts:detail.paid')}</dt>
                      <dd className="font-semibold tabular-nums text-ink">
                        {formatCurrencyBRL(pago)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-soft">{t('contracts:detail.balance')}</dt>
                      <dd
                        className={cn(
                          'font-semibold tabular-nums',
                          valorTotal - lancado < 0 ? 'text-danger' : 'text-ink',
                        )}
                      >
                        {formatCurrencyBRL(valorTotal - lancado)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}

            {contract.descricao && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('contracts:form.fields.descricao')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm text-ink">{contract.descricao}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="amendments" className="space-y-4">
            {canWrite && editable && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FilePlus2 className="h-3.5 w-3.5" />}
                  onClick={() => setAmendmentOpen(true)}
                >
                  {t('contracts:amendments.add')}
                </Button>
              </div>
            )}
            {contract.amendments.length === 0 ? (
              <EmptyState
                icon={<FilePlus2 className="h-6 w-6" />}
                title={t('contracts:amendments.emptyTitle')}
                description={t('contracts:amendments.emptyDescription')}
              />
            ) : (
              <ol className="relative space-y-4 border-l border-dashed border-border pl-6">
                {contract.amendments.map((amendment, idx) => (
                  <li
                    key={amendment.id}
                    className="relative animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <span
                      className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-brand-gold-500 bg-surface font-mono text-[9px] font-semibold text-brand-gold-700"
                      aria-hidden="true"
                    >
                      {amendment.numero}
                    </span>
                    <Card>
                      <CardContent className="space-y-2 py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
                            {t('contracts:amendments.label', { number: amendment.numero })}
                          </p>
                          <p className="text-xs text-ink-soft">
                            {amendment.authorName} · {formatDateTime(amendment.createdAt)}
                          </p>
                        </div>
                        <p className="whitespace-pre-line text-sm text-ink">
                          {amendment.descricao}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
                          {amendment.valorDelta && (
                            <span className="inline-flex items-center gap-1">
                              <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                              <span
                                className={cn(
                                  'font-semibold tabular-nums',
                                  Number(amendment.valorDelta) < 0 ? 'text-danger' : 'text-success',
                                )}
                              >
                                {Number(amendment.valorDelta) > 0 ? '+' : ''}
                                {formatCurrencyBRL(amendment.valorDelta)}
                              </span>
                            </span>
                          )}
                          {amendment.novaDataFim && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                              {t('contracts:amendments.newEnd', {
                                date: formatDateOnly(amendment.novaDataFim),
                              })}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            {canManageDocs && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => setUploadOpen(true)}
                >
                  {t('contracts:attachments.upload')}
                </Button>
              </div>
            )}
            {attachments.length === 0 ? (
              <EmptyState
                icon={<Paperclip className="h-6 w-6" />}
                title={t('contracts:attachments.emptyTitle')}
                description={t('contracts:attachments.emptyDescription')}
              />
            ) : (
              <FileList
                items={attachments}
                onRemove={can(PERMISSIONS.DOCUMENT_MANAGE) ? setDocumentToRemove : undefined}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AmendmentDialog
        open={amendmentOpen}
        onOpenChange={setAmendmentOpen}
        contract={contract}
        isSubmitting={addAmendment.isPending}
        onSubmit={(payload) =>
          addAmendment.mutate(payload, { onSuccess: () => setAmendmentOpen(false) })
        }
      />

      <DocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        document={null}
        preset={{ categoria: 'CONTRATO', contractId: contract.id, supplierId: contract.supplierId }}
        lockLinks
        isSubmitting={uploadDocument.isPending}
        onUpload={(input, file) =>
          uploadDocument.mutate(toUploadFormData(input, file), {
            onSuccess: () => setUploadOpen(false),
          })
        }
        onUpdate={() => undefined}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={t('contracts:confirm.statusTitle', {
          status: pendingAction ? CONTRACT_STATUS_LABELS[pendingAction.target] : '',
        })}
        description={t('contracts:confirm.statusDescription')}
        destructive={pendingAction?.target === 'CANCELADO'}
        confirmLabel={
          pendingAction
            ? t(`contracts:statusActions.${pendingAction.labelKey}` as never)
            : undefined
        }
        isSubmitting={changeStatus.isPending}
        onConfirm={() => pendingAction && runStatusChange(pendingAction.target)}
      />

      <ConfirmDialog
        open={documentToRemove !== null}
        onOpenChange={(open) => !open && setDocumentToRemove(null)}
        title={t('contracts:confirm.removeAttachmentTitle')}
        description={
          <Trans
            i18nKey="contracts:confirm.removeAttachmentDescription"
            values={{ name: documentToRemove?.fileName ?? '' }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive
        confirmLabel={t('common:actions.remove')}
        isSubmitting={removeDocument.isPending}
        onConfirm={() =>
          documentToRemove &&
          removeDocument.mutate(documentToRemove.id, {
            onSuccess: () => setDocumentToRemove(null),
          })
        }
      />
    </>
  );
}

export default ContractDetailPage;
