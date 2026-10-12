import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CircleCheck } from 'lucide-react';
import { PaymentMethod, toDateOnly } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { SelectField } from '@/components/common/SelectField';
import { PAYMENT_METHOD_LABELS } from '@/constants/enums';
import { formatCurrencyBRL, formatDateOnly } from '@/utils/format';
import { payFormSchema, type PayableDto, type PayFormInput, type PayPayload } from '../types';

interface PayDialogProps {
  payable: PayableDto | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: PayPayload) => void;
  isSubmitting: boolean;
}

export function PayDialog({ payable, onOpenChange, onSubmit, isSubmitting }: PayDialogProps) {
  const { t } = useTranslation('finance');
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayFormInput>({
    resolver: zodResolver(payFormSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (payable) {
      reset({ pagoEm: toDateOnly(), valorPago: Number(payable.valor), formaPagamento: '' });
    }
  }, [payable, reset]);

  return (
    <Dialog open={payable !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('finance:payDialog.title')}</DialogTitle>
          <DialogDescription>
            {payable &&
              t('finance:payDialog.description', {
                name: payable.descricao,
                value: formatCurrencyBRL(payable.valor),
                date: formatDateOnly(payable.vencimento),
              })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) =>
            onSubmit({
              pagoEm: values.pagoEm,
              valorPago: Number(values.valorPago),
              formaPagamento: values.formaPagamento as PaymentMethod,
            }),
          )}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('pagoEm')}
              type="date"
              max={toDateOnly()}
              label={t('finance:fields.pagoEm')}
              error={errors.pagoEm?.message}
              required
            />
            <Input
              {...register('valorPago')}
              type="number"
              min={0}
              step="0.01"
              label={t('finance:fields.valorPago')}
              hint={t('finance:hints.valorPago')}
              error={errors.valorPago?.message}
              required
            />
          </div>
          <Controller
            control={control}
            name="formaPagamento"
            render={({ field }) => (
              <SelectField
                id="pay-method"
                label={t('finance:fields.formaPagamento')}
                placeholder={t('finance:placeholders.formaPagamento')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={Object.values(PaymentMethod).map((value) => ({
                  value,
                  label: PAYMENT_METHOD_LABELS[value],
                }))}
                error={errors.formaPagamento?.message}
                required
              />
            )}
          />
          {payable?.origem === 'REEMBOLSO' && (
            <p className="rounded-md bg-info/10 px-3 py-2 text-xs text-ink">
              {t('finance:payDialog.reimbursementNote')}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<CircleCheck className="h-4 w-4" />}
            >
              {t('finance:payDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
