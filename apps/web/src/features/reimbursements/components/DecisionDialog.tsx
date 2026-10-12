import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleCheck, CircleX } from 'lucide-react';
import { addDays, toDateOnly } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { formatCurrencyBRL } from '@/utils/format';
import type { DecisionPayload, ReimbursementDetailDto } from '../types';

interface DecisionDialogProps {
  /** `null` fecha o diálogo. */
  decision: 'APPROVE' | 'REJECT' | null;
  reimbursement: ReimbursementDetailDto;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: DecisionPayload) => void;
  isSubmitting: boolean;
}

/** Aprovar (define o vencimento da conta a pagar gerada) ou rejeitar (motivo obrigatório). */
export function DecisionDialog({
  decision,
  reimbursement,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: DecisionDialogProps) {
  const { t } = useTranslation('reimbursements');
  const [comment, setComment] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [touched, setTouched] = useState(false);
  const isApprove = decision === 'APPROVE';

  useEffect(() => {
    if (!decision) return;
    setComment('');
    setVencimento(addDays(toDateOnly(), 7));
    setTouched(false);
  }, [decision]);

  const commentMissing = !isApprove && comment.trim().length === 0;
  const dateMissing = isApprove && !vencimento;

  function submit() {
    setTouched(true);
    if (commentMissing || dateMissing || !decision) return;
    onSubmit({
      decision,
      comment: comment.trim() || undefined,
      vencimento: isApprove ? vencimento : undefined,
    });
  }

  return (
    <Dialog open={decision !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isApprove
              ? t('reimbursements:decision.approveTitle')
              : t('reimbursements:decision.rejectTitle')}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? t('reimbursements:decision.approveDescription', {
                  value: formatCurrencyBRL(reimbursement.total),
                  name: reimbursement.requesterName,
                })
              : t('reimbursements:decision.rejectDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isApprove && (
            <Input
              type="date"
              min={toDateOnly()}
              label={t('reimbursements:decision.dueDate')}
              hint={t('reimbursements:decision.dueDateHint')}
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              error={touched && dateMissing ? t('validation:required') : undefined}
              required
            />
          )}
          <Textarea
            label={
              isApprove
                ? t('reimbursements:decision.commentOptional')
                : t('reimbursements:decision.reason')
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={2000}
            error={touched && commentMissing ? t('validation:required') : undefined}
            required={!isApprove}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant={isApprove ? 'primary' : 'danger'}
            isLoading={isSubmitting}
            leftIcon={
              isApprove ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />
            }
            onClick={submit}
          >
            {isApprove ? t('reimbursements:actions.approve') : t('reimbursements:actions.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
