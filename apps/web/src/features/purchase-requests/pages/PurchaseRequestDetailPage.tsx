import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BookPlus,
  CalendarClock,
  Landmark,
  Package,
  ImageOff,
  Paperclip,
  Phone,
  Upload,
  User,
} from 'lucide-react';
import type { PurchaseRequestItemDto } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { uploadUrl } from '@/utils/image';
import { ExportMenu } from '@/components/common/ExportMenu';
import { InfoTile } from '@/components/data-display/InfoTile';
import { FileList, type FileListItem } from '@/components/data-display/FileList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDateOnly, formatDateTime } from '@/utils/format';

import { usePurchaseRequest, usePurchaseRequestTimeline } from '../hooks/usePurchaseRequests';
import {
  useRemovePurchaseRequestAttachment,
  useUploadPurchaseRequestAttachment,
} from '../hooks/usePurchaseRequestMutations';
import { PurchaseRequestStatusBadge } from '../components/PurchaseRequestBadges';
import { StatusStepper } from '../components/StatusStepper';
import { ApprovalSignatures } from '../components/ApprovalSignatures';
import { StatusActions } from '../components/StatusActions';
import { Timeline } from '../components/Timeline';
import { CommentsPanel } from '../components/CommentsPanel';
import { UploadAttachmentDialog } from '../components/UploadAttachmentDialog';
import { AddToCatalogDialog } from '../components/AddToCatalogDialog';
import { RequestQuotations } from '../components/RequestQuotations';

export function PurchaseRequestDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('purchaseRequests');
  const { can } = useAuth();
  const { data: request, isLoading, isError, refetch } = usePurchaseRequest(id);
  const { data: timeline, isLoading: timelineLoading } = usePurchaseRequestTimeline(id);
  const uploadAttachment = useUploadPurchaseRequestAttachment(id);
  const removeAttachment = useRemovePurchaseRequestAttachment(id);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [attachmentToRemove, setAttachmentToRemove] = useState<FileListItem | null>(null);
  const [itemToCatalog, setItemToCatalog] = useState<PurchaseRequestItemDto | null>(null);

  if (isLoading) return <PageSkeleton tiles={3} />;

  if (isError || !request) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('purchaseRequests:detail.notFoundTitle')}
          description={t('purchaseRequests:detail.notFoundDescription')}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refetch()}>
                {t('common:actions.retry')}
              </Button>
              <Button asChild variant="primary">
                <Link to={ROUTE_PATHS.SOLICITACOES}>
                  {t('purchaseRequests:actions.backToList')}
                </Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const canParticipate = can(PERMISSIONS.PURCHASE_REQUEST_WRITE);
  const attachments: FileListItem[] = request.attachments.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    size: a.size,
    url: a.url,
    uploadedByName: a.uploadedByName,
    uploadedAt: a.uploadedAt,
  }));

  return (
    <>
      <PageHeader
        eyebrow={t('purchaseRequests:detail.eyebrowNumber', { numero: request.numero })}
        title={request.title}
        description={t('purchaseRequests:detail.requestedBy', { name: request.requesterName })}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(-1)}
            >
              {t('common:actions.back')}
            </Button>
            <ExportMenu
              formats={['pdf']}
              label={t('purchaseRequests:pdf.button')}
              onExport={async () => {
                const { exportPurchaseRequestPdf } = await import('../lib/reports');
                await exportPurchaseRequestPdf(request);
              }}
            />
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <Card className="animate-slide-up">
          <CardContent className="space-y-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PurchaseRequestStatusBadge status={request.status} size="md" />
              <StatusActions purchaseRequestId={id} status={request.status} />
            </div>
            <StatusStepper status={request.status} />
          </CardContent>
        </Card>

        <ApprovalSignatures request={request} />

        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">{t('purchaseRequests:detail.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="timeline">{t('purchaseRequests:detail.tabs.timeline')}</TabsTrigger>
            <TabsTrigger value="comments">
              {t('purchaseRequests:detail.tabs.comments', { count: request.comments.length })}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              {t('purchaseRequests:detail.tabs.attachments', { count: request.attachments.length })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InfoTile
                icon={User}
                label={t('purchaseRequests:detail.requester')}
                value={request.requesterName}
              />
              <InfoTile
                icon={Landmark}
                label={t('purchaseRequests:form.fields.costCenter')}
                value={request.costCenter ?? '—'}
              />
              {request.requesterContact && (
                <InfoTile
                  icon={Phone}
                  label={t('purchaseRequests:form.fields.requesterContact')}
                  value={request.requesterContact}
                />
              )}
              <InfoTile
                icon={CalendarClock}
                label={t('purchaseRequests:detail.createdAt')}
                value={formatDateTime(request.createdAt) ?? '—'}
              />
            </div>

            {request.justification && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('purchaseRequests:form.fields.justification')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm text-ink">{request.justification}</p>
                </CardContent>
              </Card>
            )}

            {request.items.length === 0 ? (
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title={t('purchaseRequests:detail.noItems')}
              />
            ) : (
              <div className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{t('purchaseRequests:photo.label')}</TableHead>
                      <TableHead>{t('purchaseRequests:form.fields.description')}</TableHead>
                      <TableHead className="text-right">
                        {t('purchaseRequests:form.fields.quantity')}
                      </TableHead>
                      <TableHead>{t('purchaseRequests:form.fields.unit')}</TableHead>
                      <TableHead className="text-right">
                        {t('purchaseRequests:form.fields.estimatedPrice')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('purchaseRequests:form.fields.subtotal')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          {item.photoUrl ? (
                            <a
                              href={uploadUrl(item.photoUrl) ?? '#'}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={uploadUrl(item.photoUrl) ?? undefined}
                                alt={item.description}
                                className="h-14 w-14 rounded-md border border-border object-cover"
                              />
                            </a>
                          ) : (
                            <span className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border text-ink-soft">
                              <ImageOff className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-ink">{item.description}</p>
                          {(item.marca || item.referencia || item.especificacao) && (
                            <p className="text-xs text-ink-soft">
                              {[item.especificacao, item.marca, item.referencia]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                          {(item.localUso ||
                            item.setorSolicitante ||
                            item.dataNecessaria ||
                            item.pesoTotal) && (
                            <p className="text-xs text-ink-soft">
                              {[
                                item.localUso &&
                                  t('purchaseRequests:detail.itemLocal', { value: item.localUso }),
                                item.setorSolicitante &&
                                  t('purchaseRequests:detail.itemSector', {
                                    value: item.setorSolicitante,
                                  }),
                                item.dataNecessaria &&
                                  t('purchaseRequests:detail.itemNeededBy', {
                                    date: formatDateOnly(item.dataNecessaria),
                                  }),
                                item.pesoTotal &&
                                  t('purchaseRequests:detail.itemWeight', {
                                    value: Number(item.pesoTotal).toLocaleString(),
                                  }),
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                          {item.productId && item.productName && (
                            <Link
                              to={routeTo.product(item.productId)}
                              className="text-xs text-ink-soft hover:text-brand-gold-700 hover:underline"
                            >
                              {t('purchaseRequests:detail.catalogItem', { name: item.productName })}
                            </Link>
                          )}
                          {!item.productId && can(PERMISSIONS.PRODUCT_WRITE) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-1 h-7 px-2 text-xs"
                              leftIcon={<BookPlus className="h-3.5 w-3.5" />}
                              onClick={() => setItemToCatalog(item)}
                            >
                              {t('purchaseRequests:detail.addToCatalog')}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(item.quantity).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-ink-soft">{item.unit}</TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums text-ink-soft">
                          {formatCurrencyBRL(item.estimatedPrice)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {item.estimatedPrice
                            ? formatCurrencyBRL(Number(item.estimatedPrice) * Number(item.quantity))
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-end gap-3">
                  <span className="text-sm text-ink-soft">
                    {t('purchaseRequests:form.estimatedTotal')}
                  </span>
                  <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                    {formatCurrencyBRL(request.estimatedTotal)}
                  </span>
                </div>
              </div>
            )}

            <RequestQuotations request={request} />
          </TabsContent>

          <TabsContent value="timeline">
            {timelineLoading ? <PageSkeletonLines /> : <Timeline entries={timeline ?? []} />}
          </TabsContent>

          <TabsContent value="comments">
            <CommentsPanel
              purchaseRequestId={id}
              comments={request.comments}
              canComment={canParticipate}
            />
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            {canParticipate && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => setUploadOpen(true)}
                >
                  {t('purchaseRequests:actions.uploadAttachment')}
                </Button>
              </div>
            )}
            {attachments.length === 0 ? (
              <EmptyState
                icon={<Paperclip className="h-6 w-6" />}
                title={t('purchaseRequests:attachments.emptyTitle')}
                description={t('purchaseRequests:attachments.emptyDescription')}
              />
            ) : (
              <FileList
                items={attachments}
                onRemove={canParticipate ? setAttachmentToRemove : undefined}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <UploadAttachmentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        isSubmitting={uploadAttachment.isPending}
        onSubmit={(file) =>
          uploadAttachment.mutate(file, { onSuccess: () => setUploadOpen(false) })
        }
      />

      <AddToCatalogDialog
        item={itemToCatalog}
        onOpenChange={(open) => {
          if (!open) setItemToCatalog(null);
        }}
      />

      <ConfirmDialog
        open={attachmentToRemove !== null}
        onOpenChange={(open) => !open && setAttachmentToRemove(null)}
        title={t('purchaseRequests:confirm.removeAttachmentTitle')}
        description={
          <Trans
            i18nKey="purchaseRequests:confirm.removeAttachmentDescription"
            values={{ name: attachmentToRemove?.fileName ?? '' }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive
        confirmLabel={t('common:actions.remove')}
        isSubmitting={removeAttachment.isPending}
        onConfirm={() =>
          attachmentToRemove &&
          removeAttachment.mutate(attachmentToRemove.id, {
            onSuccess: () => setAttachmentToRemove(null),
          })
        }
      />
    </>
  );
}

function PageSkeletonLines() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-hover" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-1/2 animate-pulse rounded bg-hover" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-hover" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default PurchaseRequestDetailPage;
