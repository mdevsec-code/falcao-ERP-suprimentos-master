import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

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
import { formatCurrencyBRL, formatDateOnly } from '@/utils/format';
import {
  amendmentFormSchema,
  fromAmendmentForm,
  type AmendmentFormInput,
  type AmendmentPayload,
  type ContractDetailDto,
} from '../types';

interface AmendmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetailDto;
  onSubmit: (payload: AmendmentPayload) => void;
  isSubmitting: boolean;
}

const EMPTY: AmendmentFormInput = { descricao: '', valorDelta: '', novaDataFim: '' };

export function AmendmentDialog({
  open,
  onOpenChange,
  contract,
  onSubmit,
  isSubmitting,
}: AmendmentDialogProps) {
  const { t } = useTranslation('contracts');
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AmendmentFormInput>({
    resolver: zodResolver(amendmentFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const [delta, novaDataFim] = useWatch({ control, name: ['valorDelta', 'novaDataFim'] });
  const deltaNumber = delta === '' || delta === undefined ? 0 : Number(delta);
  const projected = Number(contract.valorTotal) + (Number.isNaN(deltaNumber) ? 0 : deltaNumber);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('contracts:amendments.dialog.title', { number: contract.amendments.length + 1 })}
          </DialogTitle>
          <DialogDescription>{t('contracts:amendments.dialog.description')}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => onSubmit(fromAmendmentForm(values)))}
          noValidate
          className="space-y-4"
        >
          <Textarea
            {...register('descricao')}
            label={t('contracts:amendments.fields.descricao')}
            placeholder={t('contracts:amendments.placeholders.descricao')}
            error={errors.descricao?.message}
            rows={3}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              {...register('valorDelta')}
              type="number"
              step="0.01"
              label={t('contracts:amendments.fields.valorDelta')}
              hint={t('contracts:amendments.hints.valorDelta')}
              error={errors.valorDelta?.message}
            />
            <Input
              {...register('novaDataFim')}
              type="date"
              label={t('contracts:amendments.fields.novaDataFim')}
              hint={t('contracts:amendments.hints.novaDataFim', {
                date: formatDateOnly(contract.dataFim),
              })}
              error={errors.novaDataFim?.message}
            />
          </div>

          {/* Prévia do efeito do aditivo — o mesmo cálculo que a API faz. */}
          <dl className="grid grid-cols-2 gap-3 rounded-md border border-dashed border-border bg-hover/40 p-3 font-mono text-xs">
            <div>
              <dt className="uppercase tracking-[0.12em] text-ink-soft">
                {t('contracts:amendments.preview.value')}
              </dt>
              <dd className="mt-0.5 tabular-nums text-ink">
                {formatCurrencyBRL(contract.valorTotal)} → {formatCurrencyBRL(projected)}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.12em] text-ink-soft">
                {t('contracts:amendments.preview.end')}
              </dt>
              <dd className="mt-0.5 tabular-nums text-ink">
                {formatDateOnly(contract.dataFim)} →{' '}
                {formatDateOnly(novaDataFim || contract.dataFim)}
              </dd>
            </div>
          </dl>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('contracts:amendments.dialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
