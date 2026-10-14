import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Send, Trash2, X } from 'lucide-react';
import type { ProductSummaryDto } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormSection } from '@/components/common/FormSection';
import { formatCurrencyBRL } from '@/utils/format';
import { CatalogPickerDialog } from './CatalogPickerDialog';
import {
  itemSubtotal,
  purchaseRequestFormSchema,
  type PurchaseRequestFormInput,
  type PurchaseRequestItemInput,
} from '../types';

const EMPTY_ITEM: PurchaseRequestItemInput = {
  productId: '',
  description: '',
  quantity: 1,
  unit: 'UN',
  estimatedPrice: '',
  marca: '',
  referencia: '',
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

  /** Item cujo "escolher do catálogo" está aberto. */
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);
  /** Nome do produto escolhido em cada linha, só para exibir. */
  const [pickedNames, setPickedNames] = useState<Record<string, string>>({});

  /** Ao escolher do catálogo, preenche descrição, unidade, marca, referência e último preço. */
  function handlePick(product: ProductSummaryDto) {
    if (pickingIndex === null) return;
    const index = pickingIndex;
    const fieldId = fields[index]?.id;
    setValue(`items.${index}.productId`, product.id, { shouldDirty: true });
    setValue(`items.${index}.description`, product.nome, { shouldValidate: true });
    setValue(`items.${index}.unit`, product.unidade, { shouldValidate: true });
    setValue(`items.${index}.marca`, product.marca ?? '');
    setValue(`items.${index}.referencia`, product.referencia ?? '');
    const current = getValues(`items.${index}`);
    if (current.estimatedPrice === '' && product.lastPrice !== null) {
      setValue(`items.${index}.estimatedPrice`, Number(product.lastPrice), {
        shouldValidate: true,
      });
    }
    if (fieldId) {
      setPickedNames((prev) => ({ ...prev, [fieldId]: `${product.codigo} · ${product.nome}` }));
    }
    setPickingIndex(null);
  }

  function unlinkProduct(index: number) {
    setValue(`items.${index}.productId`, '', { shouldDirty: true });
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

                <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-surface px-3 py-2">
                  {items?.[index]?.productId ? (
                    <>
                      <BookOpen className="h-4 w-4 text-brand-gold-700" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {pickedNames[field.id] ?? t('purchaseRequests:form.fromCatalog')}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPickingIndex(index)}
                      >
                        {t('purchaseRequests:form.changeProduct')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<X className="h-3.5 w-3.5" />}
                        onClick={() => unlinkProduct(index)}
                      >
                        {t('purchaseRequests:form.unlinkProduct')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 text-sm text-ink-soft">
                        {t('purchaseRequests:form.looseItemHint')}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                        onClick={() => setPickingIndex(index)}
                      >
                        {t('purchaseRequests:form.pickFromCatalog')}
                      </Button>
                    </>
                  )}
                </div>

                <Input
                  {...register(`items.${index}.description`)}
                  label={t('purchaseRequests:form.fields.description')}
                  error={itemErrors?.description?.message}
                  required
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    {...register(`items.${index}.marca`)}
                    label={t('purchaseRequests:form.fields.marca')}
                    hint={t('common:form.optional')}
                    error={itemErrors?.marca?.message}
                  />
                  <Input
                    {...register(`items.${index}.referencia`)}
                    label={t('purchaseRequests:form.fields.referencia')}
                    hint={t('common:form.optional')}
                    inputClassName="font-mono"
                    error={itemErrors?.referencia?.message}
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

      <CatalogPickerDialog
        open={pickingIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPickingIndex(null);
        }}
        onPick={handlePick}
      />

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
