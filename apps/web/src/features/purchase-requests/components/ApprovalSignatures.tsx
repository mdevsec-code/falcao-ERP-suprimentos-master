import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Hourglass, PenLine, XCircle } from 'lucide-react';
import type { PurchaseRequestDetailDto } from '@falcao-erp/shared-types';

import { SignaturePad, type SignaturePadHandle } from '@/components/common/SignaturePad';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { APPROVAL_STEP_LABELS } from '@/constants/enums';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { useMySignature, useSignPurchaseRequest } from '../hooks/usePurchaseRequestMutations';

type Decision = 'APROVADO' | 'RECUSADO';

/**
 * Quadro de assinaturas do plano de aquisição: o solicitante e as quatro
 * etapas (técnico → compras → custos → gerente geral), como no formulário em papel.
 */
export function ApprovalSignatures({ request }: { request: PurchaseRequestDetailDto }) {
  const { t } = useTranslation('purchaseRequests');
  const [decision, setDecision] = useState<Decision | null>(null);
  const current = request.approvalSteps.find((step) => step.current);

  return (
    <section aria-labelledby="signatures-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="signatures-title" className="text-base font-semibold text-ink">
            {t('purchaseRequests:sign.title')}
          </h2>
          <p className="text-sm text-ink-soft">
            {current
              ? t('purchaseRequests:sign.waitingStep', {
                  step: APPROVAL_STEP_LABELS[current.step],
                })
              : t('purchaseRequests:sign.subtitle')}
          </p>
        </div>
        {request.canSign && current && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={() => setDecision('RECUSADO')}
            >
              {t('purchaseRequests:sign.reject')}
            </Button>
            <Button
              variant="primary"
              leftIcon={<PenLine className="h-4 w-4" />}
              onClick={() => setDecision('APROVADO')}
            >
              {t('purchaseRequests:sign.approve')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SignatureBox
          label={t('purchaseRequests:sign.requester')}
          name={request.requesterName}
          date={request.createdAt}
          note={t('purchaseRequests:sign.submitted')}
          state="done"
        />
        {request.approvalSteps.map((step) => {
          const signature = step.signature;
          const state = signature
            ? signature.decision === 'APROVADO'
              ? 'done'
              : 'rejected'
            : step.current
              ? 'current'
              : 'waiting';
          return (
            <SignatureBox
              key={step.step}
              label={APPROVAL_STEP_LABELS[step.step]}
              image={signature?.signatureData}
              name={signature?.signerName}
              date={signature?.signedAt}
              state={state}
              note={
                signature
                  ? (signature.comment ?? undefined)
                  : step.approvers.length > 0
                    ? t('purchaseRequests:sign.approversList', {
                        names: step.approvers.map((approver) => approver.name).join(', '),
                      })
                    : t('purchaseRequests:sign.noApprovers')
              }
            />
          );
        })}
      </div>

      <SignDialog request={request} decision={decision} onClose={() => setDecision(null)} />
    </section>
  );
}

interface SignatureBoxProps {
  label: string;
  image?: string;
  name?: string;
  date?: string;
  note?: string;
  state: 'done' | 'rejected' | 'current' | 'waiting';
}

function SignatureBox({ label, image, name, date, note, state }: SignatureBoxProps) {
  const { t } = useTranslation('purchaseRequests');
  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border bg-surface p-3 shadow-sm',
        state === 'current' && 'border-brand-gold-500 ring-2 ring-brand-gold-300/60',
        state === 'rejected' && 'border-danger/40',
        (state === 'done' || state === 'waiting') && 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {label}
        </span>
        {state === 'done' && <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
        {state === 'rejected' && <XCircle className="h-4 w-4 text-danger" aria-hidden="true" />}
        {state === 'current' && (
          <Badge size="sm" variant="warning">
            {t('purchaseRequests:sign.yourTurn')}
          </Badge>
        )}
        {state === 'waiting' && <Hourglass className="h-4 w-4 text-ink-soft" aria-hidden="true" />}
      </div>
      <div className="mt-2 flex h-16 items-end justify-center border-b border-ink-soft/40 bg-white">
        {image && (
          <img
            src={image}
            alt={t('purchaseRequests:sign.signatureAlt', { name: name ?? '' })}
            className="max-h-14 max-w-full object-contain"
          />
        )}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-ink">{name ?? '—'}</p>
      <p className="text-xs text-ink-soft">
        {date
          ? formatDateTime(date)
          : state === 'current'
            ? t('purchaseRequests:sign.pending')
            : t('purchaseRequests:sign.notYet')}
      </p>
      {state === 'rejected' && (
        <Badge size="sm" variant="danger" className="mt-1 self-start">
          {t('purchaseRequests:sign.rejectedBadge')}
        </Badge>
      )}
      {note && <p className="mt-1 line-clamp-3 text-xs italic text-ink-soft">{note}</p>}
    </div>
  );
}

interface SignDialogProps {
  request: PurchaseRequestDetailDto;
  decision: Decision | null;
  onClose: () => void;
}

/** Desenhar (ou reusar) a assinatura, com motivo obrigatório na recusa. */
function SignDialog({ request, decision, onClose }: SignDialogProps) {
  const { t } = useTranslation('purchaseRequests');
  const sign = useSignPurchaseRequest(request.id);
  const saved = useMySignature(decision !== null);
  const pad = useRef<SignaturePadHandle>(null);
  const [useSaved, setUseSaved] = useState(true);
  const [hasInk, setHasInk] = useState(false);
  const [saveSignature, setSaveSignature] = useState(true);
  const [comment, setComment] = useState('');
  const current = request.approvalSteps.find((step) => step.current);
  const savedSignature = saved.data?.signatureData ?? null;
  const drawing = !savedSignature || !useSaved;

  useEffect(() => {
    if (decision) {
      setUseSaved(true);
      setHasInk(false);
      setComment('');
      setSaveSignature(true);
    }
  }, [decision]);

  const commentMissing = decision === 'RECUSADO' && comment.trim().length < 3;
  const signatureMissing = drawing && !hasInk;

  function confirm() {
    if (!decision || commentMissing) return;
    const signatureData = drawing ? pad.current?.toDataUrl() : savedSignature;
    if (!signatureData) return;
    sign.mutate(
      {
        decision,
        signatureData,
        comment: comment.trim() || undefined,
        saveSignature: drawing && saveSignature ? true : undefined,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open={decision !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {decision === 'RECUSADO'
              ? t('purchaseRequests:sign.rejectTitle', { numero: request.numero })
              : t('purchaseRequests:sign.approveTitle', { numero: request.numero })}
          </DialogTitle>
          <DialogDescription>
            {t('purchaseRequests:sign.dialogDescription', {
              step: current ? APPROVAL_STEP_LABELS[current.step] : '',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {savedSignature && (
            <div className="flex flex-wrap gap-2" role="group">
              <Button
                type="button"
                size="sm"
                variant={useSaved ? 'primary' : 'outline'}
                aria-pressed={useSaved}
                onClick={() => setUseSaved(true)}
              >
                {t('purchaseRequests:sign.useSaved')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!useSaved ? 'primary' : 'outline'}
                aria-pressed={!useSaved}
                onClick={() => setUseSaved(false)}
              >
                {t('purchaseRequests:sign.drawNew')}
              </Button>
            </div>
          )}

          {drawing ? (
            <>
              <SignaturePad ref={pad} onChange={setHasInk} />
              <label className="flex items-center gap-2 text-sm text-ink">
                <Checkbox
                  checked={saveSignature}
                  onCheckedChange={(value) => setSaveSignature(value === true)}
                />
                {t('purchaseRequests:sign.saveForNext')}
              </label>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-md border border-border bg-white">
              {savedSignature && (
                <img
                  src={savedSignature}
                  alt={t('purchaseRequests:sign.savedAlt')}
                  className="max-h-32 max-w-full object-contain"
                />
              )}
            </div>
          )}

          <Textarea
            label={
              decision === 'RECUSADO'
                ? t('purchaseRequests:sign.reasonRequired')
                : t('purchaseRequests:sign.commentOptional')
            }
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={1000}
            name="signature-comment"
            required={decision === 'RECUSADO'}
          />
          <p className="text-xs text-ink-soft">{t('purchaseRequests:sign.legalNote')}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sign.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant={decision === 'RECUSADO' ? 'danger' : 'primary'}
            onClick={confirm}
            disabled={commentMissing || signatureMissing}
            isLoading={sign.isPending}
          >
            {decision === 'RECUSADO'
              ? t('purchaseRequests:sign.confirmReject')
              : t('purchaseRequests:sign.confirmApprove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
