import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Landmark,
  MessageSquareQuote,
  Paperclip,
  Trash2,
  Upload,
  User,
  Wallet,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { InfoTile } from '@/components/data-display/InfoTile';
import { FileList, type FileListItem } from '@/components/data-display/FileList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UploadFileDialog } from '@/components/common/UploadFileDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EXPENSE_CATEGORY_LABELS, REIMBURSEMENT_STATUS_LABELS } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS } from '@/constants/routes';
import { formatCurrencyBRL, formatDateOnly, formatDateTime } from '@/utils/format';

import {
  useDecideReimbursement,
  useReimbursement,
  useRemoveReceipt,
  useRemoveReimbursement,
  useUploadReceipt,
} from '../hooks/useReimbursements';
import { ReimbursementStepper } from '../components/ReimbursementStepper';
import { DecisionDialog } from '../components/DecisionDialog';
import { REIMBURSEMENT_STATUS_BADGE } from '../lib/status';
import { MAX_RECEIPT_BYTES } from '../types';

export function ReimbursementDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('reimbursements');
  const { can, user } = useAuth();
  const { data: reimbursement, isLoading, isError, refetch } = useReimbursement(id);
  const decide = useDecideReimbursement(id);
  const removeReimbursement = useRemoveReimbursement();
  const uploadReceipt = useUploadReceipt(id);
  const removeReceipt = useRemoveReceipt(id);

  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [receiptToRemove, setReceiptToRemove] = useState<FileListItem | null>(null);

  if (isLoading) return <PageSkeleton tiles={3} />;

  if (isError || !reimbursement) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('reimbursements:detail.notFoundTitle')}
          description={t('reimbursements:detail.notFoundDescription')}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refetch()}>
                {t('common:actions.retry')}
              </Button>
              <Button asChild variant="primary">
                <Link to={ROUTE_PATHS.REEMBOLSOS}>{t('reimbursements:actions.backToList')}</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const isOwner = reimbursement.requesterId === user?.id;
  const isOpen = reimbursement.status === 'ENVIADO';
  const canEditReceipts = isOpen && (isOwner || user?.role === 'ADMIN');
  const canDecide = isOpen && !isOwner && can(PERMISSIONS.REIMBURSEMENT_DECIDE);

  const totalsByCategory = new Map<string, number>();
  for (const item of reimbursement.items) {
    totalsByCategory.set(
      item.categoria,
      (totalsByCategory.get(item.categoria) ?? 0) + Number(item.valor),
    );
  }

  const receipts: FileListItem[] = reimbursement.attachments.map((a) => ({
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
        eyebrow={t('reimbursements:detail.eyebrow')}
        title={reimbursement.titulo}
        description={t('reimbursements:detail.requestedBy', {
          name: reimbursement.requesterName,
          date: formatDateTime(reimbursement.createdAt),
        })}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(-1)}
            >
              {t('common:actions.back')}
            </Button>
            {isOpen && isOwner && (
              <Button
                variant="outline"
                className="text-danger"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setConfirmDelete(true)}
              >
                {t('reimbursements:actions.delete')}
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <Card className="animate-slide-up">
          <CardContent className="space-y-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant={REIMBURSEMENT_STATUS_BADGE[reimbursement.status]} size="md">
                  {REIMBURSEMENT_STATUS_LABELS[reimbursement.status]}
                </Badge>
                <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                  {formatCurrencyBRL(reimbursement.total)}
                </span>
              </div>
              {canDecide && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<CircleX className="h-4 w-4" />}
                    onClick={() => setDecision('REJECT')}
                  >
                    {t('reimbursements:actions.reject')}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<CircleCheck className="h-4 w-4" />}
                    onClick={() => setDecision('APPROVE')}
                  >
                    {t('reimbursements:actions.approve')}
                  </Button>
                </div>
              )}
              {isOpen && isOwner && can(PERMISSIONS.REIMBURSEMENT_DECIDE) && (
                <p className="text-xs text-ink-soft">{t('reimbursements:detail.ownHint')}</p>
              )}
            </div>
            <ReimbursementStepper status={reimbursement.status} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoTile
            icon={User}
            label={t('reimbursements:detail.requester')}
            value={reimbursement.requesterName}
          />
          <InfoTile
            icon={Landmark}
            label={t('reimbursements:form.fields.costCenter')}
            value={reimbursement.costCenter ?? '—'}
          />
          {reimbursement.payable && (
            <InfoTile
              icon={Wallet}
              label={t('reimbursements:detail.payment')}
              value={
                <>
                  {reimbursement.payable.pagoEm
                    ? t('reimbursements:detail.paidOn', {
                        date: formatDateOnly(reimbursement.payable.pagoEm),
                      })
                    : t('reimbursements:detail.dueOn', {
                        date: formatDateOnly(reimbursement.payable.vencimento),
                      })}
                  {can(PERMISSIONS.FINANCE_READ) && (
                    <Link
                      to={ROUTE_PATHS.FINANCEIRO}
                      className="ml-2 text-xs text-brand-gold-700 hover:underline"
                    >
                      {t('reimbursements:detail.openFinance')}
                    </Link>
                  )}
                </>
              }
            />
          )}
        </div>

        {reimbursement.decidedByName && (
          <Card className="animate-fade-in">
            <CardContent className="flex items-start gap-3 py-4">
              <MessageSquareQuote
                className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold-700"
                aria-hidden="true"
              />
              <div className="space-y-1 text-sm">
                <p className="text-ink">
                  {t(
                    reimbursement.status === 'REJEITADO'
                      ? 'reimbursements:detail.rejectedBy'
                      : 'reimbursements:detail.approvedBy',
                    {
                      name: reimbursement.decidedByName,
                      date: formatDateTime(reimbursement.decidedAt),
                    },
                  )}
                </p>
                {reimbursement.decisionComment && (
                  <p className="whitespace-pre-line text-ink-soft">
                    “{reimbursement.decisionComment}”
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">
              {t('reimbursements:detail.expenses', { count: reimbursement.items.length })}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {[...totalsByCategory.entries()].map(([categoria, value]) => (
                <Badge key={categoria} variant="outline" size="sm">
                  {EXPENSE_CATEGORY_LABELS[categoria as keyof typeof EXPENSE_CATEGORY_LABELS]}:{' '}
                  {formatCurrencyBRL(value)}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reimbursements:form.fields.data')}</TableHead>
                  <TableHead>{t('reimbursements:form.fields.categoria')}</TableHead>
                  <TableHead>{t('reimbursements:form.fields.descricao')}</TableHead>
                  <TableHead className="text-right">
                    {t('reimbursements:form.fields.valor')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reimbursement.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap tabular-nums text-ink-soft">
                      {formatDateOnly(item.data)}
                    </TableCell>
                    <TableCell>{EXPENSE_CATEGORY_LABELS[item.categoria]}</TableCell>
                    <TableCell className="text-ink">{item.descricao}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                      {formatCurrencyBRL(item.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">
              {t('reimbursements:detail.receipts', { count: receipts.length })}
            </h2>
            {canEditReceipts && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => setUploadOpen(true)}
              >
                {t('reimbursements:actions.uploadReceipt')}
              </Button>
            )}
          </div>
          {receipts.length === 0 ? (
            <EmptyState
              icon={<Paperclip className="h-6 w-6" />}
              title={t('reimbursements:receipts.emptyTitle')}
              description={
                isOpen
                  ? t('reimbursements:receipts.emptyDescription')
                  : t('reimbursements:receipts.emptyDecided')
              }
            />
          ) : (
            <FileList
              items={receipts}
              onRemove={canEditReceipts ? setReceiptToRemove : undefined}
            />
          )}
        </section>
      </div>

      <DecisionDialog
        decision={decision}
        reimbursement={reimbursement}
        onOpenChange={(open) => !open && setDecision(null)}
        isSubmitting={decide.isPending}
        onSubmit={(payload) => decide.mutate(payload, { onSuccess: () => setDecision(null) })}
      />

      <UploadFileDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title={t('reimbursements:receipts.dialogTitle')}
        description={t('reimbursements:receipts.dialogDescription')}
        fileLabel={t('reimbursements:receipts.file')}
        submitLabel={t('reimbursements:actions.uploadReceipt')}
        maxSize={MAX_RECEIPT_BYTES}
        isSubmitting={uploadReceipt.isPending}
        onSubmit={(file) => uploadReceipt.mutate(file, { onSuccess: () => setUploadOpen(false) })}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('reimbursements:confirm.deleteTitle')}
        description={t('reimbursements:confirm.deleteDescription')}
        destructive
        confirmLabel={t('reimbursements:actions.delete')}
        isSubmitting={removeReimbursement.isPending}
        onConfirm={() =>
          removeReimbursement.mutate(reimbursement.id, {
            onSuccess: () => navigate(ROUTE_PATHS.REEMBOLSOS),
          })
        }
      />

      <ConfirmDialog
        open={receiptToRemove !== null}
        onOpenChange={(open) => !open && setReceiptToRemove(null)}
        title={t('reimbursements:confirm.removeReceiptTitle')}
        description={
          <Trans
            i18nKey="reimbursements:confirm.removeReceiptDescription"
            values={{ name: receiptToRemove?.fileName ?? '' }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive
        confirmLabel={t('common:actions.remove')}
        isSubmitting={removeReceipt.isPending}
        onConfirm={() =>
          receiptToRemove &&
          removeReceipt.mutate(receiptToRemove.id, { onSuccess: () => setReceiptToRemove(null) })
        }
      />
    </>
  );
}

export default ReimbursementDetailPage;
