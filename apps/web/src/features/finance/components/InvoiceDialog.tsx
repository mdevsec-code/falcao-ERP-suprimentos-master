import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

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
import { invoiceFormSchema, type InvoiceFormInput, type PayableDto } from '../types';

interface InvoiceDialogProps {
  payable: PayableDto | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: InvoiceFormInput) => void;
  isSubmitting: boolean;
}

/** Conciliação: vincula a nota fiscal a uma conta aberta ou já paga. */
export function InvoiceDialog({
  payable,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: InvoiceDialogProps) {
  const { t } = useTranslation('finance');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceFormSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (payable) {
      reset({
        notaFiscal: payable.notaFiscal ?? '',
        notaFiscalEmissao: payable.notaFiscalEmissao ?? '',
      });
    }
  }, [payable, reset]);

  return (
    <Dialog open={payable !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('finance:invoiceDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('finance:invoiceDialog.description', { name: payable?.descricao ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('notaFiscal')}
              label={t('finance:fields.notaFiscal')}
              inputClassName="font-mono"
              error={errors.notaFiscal?.message}
              required
            />
            <Input
              {...register('notaFiscalEmissao')}
              type="date"
              label={t('finance:fields.notaFiscalEmissao')}
              error={errors.notaFiscalEmissao?.message}
            />
          </div>
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
              {t('common:actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
