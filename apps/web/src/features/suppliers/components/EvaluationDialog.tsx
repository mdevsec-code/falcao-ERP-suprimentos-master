import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { cn } from '@/utils/cn';

interface EvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { score: number; comment?: string }) => void;
  isSubmitting: boolean;
}

export function EvaluationDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: EvaluationDialogProps) {
  const { t } = useTranslation('suppliers');
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) return;
    setScore(0);
    setHovered(0);
    setComment('');
  }, [open]);

  const shown = hovered || score;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('suppliers:evaluations.dialog.title')}</DialogTitle>
          <DialogDescription>{t('suppliers:evaluations.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label id="evaluation-score-label" required>
              {t('suppliers:evaluations.dialog.score')}
            </Label>
            <div
              role="radiogroup"
              aria-labelledby="evaluation-score-label"
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={score === value}
                  aria-label={t('suppliers:evaluations.scoreAria', { score: value })}
                  onClick={() => setScore(value)}
                  onMouseEnter={() => setHovered(value)}
                  onMouseLeave={() => setHovered(0)}
                  className="rounded-md p-0.5 transition-transform duration-fast hover:scale-110 focus:outline-none focus-visible:shadow-focus"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors duration-fast',
                      value <= shown ? 'fill-brand-gold-300 text-brand-gold-500' : 'text-border',
                    )}
                  />
                </button>
              ))}
              {shown > 0 && (
                <span className="ml-2 animate-fade-in text-sm font-medium text-ink-soft">
                  {t(`suppliers:evaluations.scoreLabels.${shown}` as never)}
                </span>
              )}
            </div>
          </div>

          <Textarea
            label={t('suppliers:evaluations.dialog.comment')}
            placeholder={t('suppliers:evaluations.dialog.commentPlaceholder')}
            hint={t('common:form.optional')}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            name="evaluation-comment"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={score === 0}
            isLoading={isSubmitting}
            onClick={() => onSubmit({ score, comment: comment.trim() || undefined })}
          >
            {t('suppliers:evaluations.dialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
