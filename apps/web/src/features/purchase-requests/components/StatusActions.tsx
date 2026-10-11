import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ALLOWED_TRANSITIONS,
  ROLES_BY_CURRENT_STATUS,
  type PurchaseRequestStatus,
} from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useChangePurchaseRequestStatus } from '../hooks/usePurchaseRequestMutations';
import { TRANSITION_OPTIONS, type TransitionOption } from '../lib/status';

interface StatusActionsProps {
  purchaseRequestId: string;
  status: PurchaseRequestStatus;
}

/** Botões da etapa atual (aprovar, cotar, receber…) para quem pode agir nela. */
export function StatusActions({ purchaseRequestId, status }: StatusActionsProps) {
  const { t } = useTranslation('purchaseRequests');
  const { user } = useAuth();
  const changeStatus = useChangePurchaseRequestStatus(purchaseRequestId);
  const [pending, setPending] = useState<TransitionOption | null>(null);
  const [comment, setComment] = useState('');

  const canAct = !!user && ROLES_BY_CURRENT_STATUS[status].includes(user.role);
  const options = TRANSITION_OPTIONS[status].filter((option) =>
    ALLOWED_TRANSITIONS[status].includes(option.target),
  );

  if (!canAct || options.length === 0) return null;

  const commentMissing = !!pending?.requiresComment && comment.trim().length === 0;

  function handleConfirm() {
    if (!pending || commentMissing) return;
    changeStatus.mutate(
      { status: pending.target, comment: comment.trim() || undefined },
      { onSuccess: () => setPending(null) },
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.labelKey}
            variant={option.variant}
            size="sm"
            onClick={() => {
              setComment('');
              setPending(option);
            }}
          >
            {t(`purchaseRequests:transitions.${option.labelKey}` as never)}
          </Button>
        ))}
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pending && t(`purchaseRequests:transitions.${pending.labelKey}` as never)}
            </DialogTitle>
            <DialogDescription>
              {pending?.requiresComment
                ? t('purchaseRequests:transitionDialog.requiredComment')
                : t('purchaseRequests:transitionDialog.optionalComment')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            label={t('purchaseRequests:transitionDialog.comment')}
            hint={pending?.requiresComment ? undefined : t('common:form.optional')}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            name="status-comment"
            required={pending?.requiresComment}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPending(null)}
              disabled={changeStatus.isPending}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant={pending?.variant === 'danger' ? 'danger' : 'primary'}
              onClick={handleConfirm}
              disabled={commentMissing}
              isLoading={changeStatus.isPending}
            >
              {t('common:actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
