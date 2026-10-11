import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Plus, Send, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { FormSection } from '@/components/common/FormSection';
import { useActiveProductOptions } from '@/features/products/hooks/useProducts';
import { formatCurrencyBRL } from '@/utils/format';
import {
  itemSubtotal,
  purchaseRequestFormSchema,
  type PurchaseRequestFormInput,
  type PurchaseRequestItemInput,
} from '../types';

const NONE = '__none';

const EMPTY_ITEM: PurchaseRequestItemInput = {
  productId: '',
  description: '',
  quantity: 1,
  unit: 'UN',
  estimatedPrice: '',
};

interface PurchaseRequestFormProps {
  onSubmit: (values: PurchaseRequestFormInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PurchaseRequestForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: PurchaseRequestFormProps) {
  const { t } = useTranslation('purchaseRequests');
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PurchaseRequestFormInput>({
    resolver: zodResolver(purchaseRequestFormSchema),
    mode: 'onTouched',
    defaultValues: { title: '', justification: '', costCenter: '', items: [EMPTY_ITEM] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' });
  const total = (items ?? []).reduce((sum, item) => sum + itemSubtotal(item), 0);

  const { data: productsPage } = useActiveProductOptions();
  const products = productsPage?.data ?? [];

  /** Ao escolher um produto do catálogo, sugere descrição, unidade e último preço. */
  function handleProductChange(index: number, productId: string) {
    setValue(`items.${index}.productId`, productId, { shouldDirty: true });
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const current = getValues(`items.${index}`);
    if (!current.description) {
      setValue(`items.${index}.description`, product.nome, { shouldValidate: true });
    }
    setValue(`items.${index}.unit`, product.unidade, { shouldValidate: true });
    if (current.estimatedPrice === '' && product.lastPrice !== null) {
      setValue(`items.${index}.estimatedPrice`, Number(product.lastPrice), {
        shouldValidate: true,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection
        title={t('purchaseRequests:form.sections.general')}
        description={t('purchaseRequests:form.sections.generalDescription')}
      >
        <Input
          {...register('title')}
          label={t('purchaseRequests:form.fields.title')}
          placeholder={t('purchaseRequests:form.placeholders.title')}
          error={errors.title?.message}
          required
        />
        <Input
          {...register('costCenter')}
          label={t('purchaseRequests:form.fields.costCenter')}
          hint={t('common:form.optional')}
          error={errors.costCenter?.message}
          className="sm:max-w-xs"
        />
        <Textarea
          {...register('justification')}
          label={t('purchaseRequests:form.fields.justification')}
          placeholder={t('purchaseRequests:form.placeholders.justification')}
          hint={t('common:form.optional')}
          error={errors.justification?.message}
          rows={3}
        />
      </FormSection>

      <FormSection
        title={t('purchaseRequests:form.sections.items')}
        description={t('purchaseRequests:form.sections.itemsDescription')}
        delayMs={60}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => append(EMPTY_ITEM)}
          >
            {t('purchaseRequests:form.addItem')}
          </Button>
        }
      >
        {errors.items?.root?.message && (
          <p className="text-xs text-danger">{errors.items.root.message}</p>
        )}
        {errors.items?.message && <p className="text-xs text-danger">{errors.items.message}</p>}

        <ul className="space-y-3">
          {fields.map((field, index) => {
            const itemErrors = errors.items?.[index];
            const subtotal = itemSubtotal(items?.[index] ?? {});
            return (
              <li
                key={field.id}
                className="animate-slide-up space-y-3 rounded-md border border-border bg-bg/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-2xs uppercase tracking-[0.12em] text-brand-gold-700">
                    {t('purchaseRequests:form.itemNumber', { index: index + 1 })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-danger hover:text-danger"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    aria-label={t('purchaseRequests:form.removeItemAria', { index: index + 1 })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`item-product-${index}`}>
                      {t('purchaseRequests:form.fields.product')}
                    </Label>
                    <Controller
                      control={control}
                      name={`items.${index}.productId`}
                      render={({ field: productField }) => (
                        <Select
                          value={productField.value || NONE}
                          onValueChange={(v) => handleProductChange(index, v === NONE ? '' : v)}
                        >
                          <SelectTrigger id={`item-product-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>
                              {t('purchaseRequests:form.looseItem')}
                            </SelectItem>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.codigo} · {p.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Input
                    {...register(`items.${index}.description`)}
                    label={t('purchaseRequests:form.fields.description')}
                    error={itemErrors?.description?.message}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Input
                    {...register(`items.${index}.quantity`)}
                    type="number"
                    min={0.01}
                    step="0.01"
                    label={t('purchaseRequests:form.fields.quantity')}
                    error={itemErrors?.quantity?.message}
                    required
                  />
                  <Input
                    {...register(`items.${index}.unit`)}
                    label={t('purchaseRequests:form.fields.unit')}
                    error={itemErrors?.unit?.message}
                    required
                  />
                  <Input
                    {...register(`items.${index}.estimatedPrice`)}
                    type="number"
                    min={0}
                    step="0.01"
                    label={t('purchaseRequests:form.fields.estimatedPrice')}
                    error={itemErrors?.estimatedPrice?.message}
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-soft">
                      {t('purchaseRequests:form.fields.subtotal')}
                    </span>
                    <span className="flex h-10 items-center font-semibold tabular-nums text-ink">
                      {subtotal > 0 ? formatCurrencyBRL(subtotal) : '—'}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <span className="text-sm text-ink-soft">{t('purchaseRequests:form.estimatedTotal')}</span>
          <span className="font-display text-2xl font-semibold tabular-nums text-ink">
            {formatCurrencyBRL(total)}
          </span>
        </div>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          leftIcon={<Send className="h-4 w-4" />}
        >
          {t('purchaseRequests:form.submit')}
        </Button>
      </div>
    </form>
  );
}
