import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { priceSchema } from '../types';

const NONE = '__none';

const priceEntrySchema = z.object({
  price: priceSchema,
  supplierId: z.string(),
});

type PriceEntryInput = z.infer<typeof priceEntrySchema>;

interface PriceEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fornecedor pré-selecionado (o principal do produto, quando houver). */
  defaultSupplierId?: string;
  onSubmit: (input: { price: number; supplierId?: string }) => void;
  isSubmitting: boolean;
}

export function PriceEntryDialog({
  open,
  onOpenChange,
  defaultSupplierId,
  onSubmit,
  isSubmitting,
}: PriceEntryDialogProps) {
  const { t } = useTranslation('products');
  const { data: suppliersPage } = useActiveSupplierOptions();
  const suppliers = suppliersPage?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PriceEntryInput>({
    resolver: zodResolver(priceEntrySchema),
    defaultValues: { price: undefined as unknown as number, supplierId: NONE },
  });

  useEffect(() => {
    if (!open) return;
    reset({ price: undefined as unknown as number, supplierId: defaultSupplierId ?? NONE });
  }, [open, defaultSupplierId, reset]);

  const submit = handleSubmit((data) =>
    onSubmit({
      price: data.price,
      supplierId: data.supplierId === NONE ? undefined : data.supplierId,
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('products:prices.dialog.title')}</DialogTitle>
          <DialogDescription>{t('products:prices.dialog.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <Input
            {...register('price')}
            type="number"
            min={0}
            step="0.01"
            label={t('products:prices.dialog.price')}
            leftIcon={<DollarSign className="h-4 w-4" />}
            error={errors.price?.message}
            required
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price-supplier">{t('products:prices.dialog.supplier')}</Label>
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="price-supplier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('products:prices.noSupplier')}</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nomeFantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
              {t('products:prices.dialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
