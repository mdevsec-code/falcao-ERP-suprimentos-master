import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import {
  ProductCategory,
  UnitOfMeasure,
  type ProductSupplierRefDto,
} from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { FormSection } from '@/components/common/FormSection';
import { PRODUCT_CATEGORY_LABELS, UNIT_LABELS } from '@/constants/enums';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { productFormSchema, type ProductFormInput } from '../types';

const NONE = '__none';

function emptyValues(): ProductFormInput {
  return {
    codigo: '',
    nome: '',
    categoria: undefined as unknown as ProductFormInput['categoria'],
    marca: '',
    unidade: undefined as unknown as ProductFormInput['unidade'],
    leadTimeDays: '',
    observacoes: '',
    primarySupplierId: '',
    alternativeSupplierIds: [],
    initialPrice: '',
  };
}

interface ProductFormProps {
  defaultValues?: ProductFormInput;
  /**
   * Fornecedores já vinculados ao produto. Entram nas opções mesmo se
   * estiverem inativos — senão o seletor apareceria vazio na edição.
   */
  linkedSuppliers?: ProductSupplierRefDto[];
  showInitialPrice?: boolean;
  onSubmit: (values: ProductFormInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
}

export function ProductForm({
  defaultValues,
  linkedSuppliers = [],
  showInitialPrice = false,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: ProductFormProps) {
  const { t } = useTranslation('products');
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    mode: 'onTouched',
    defaultValues: defaultValues ?? emptyValues(),
  });

  const { data: suppliersPage, isLoading: suppliersLoading } = useActiveSupplierOptions();
  const supplierOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const s of suppliersPage?.data ?? []) byId.set(s.id, s.nomeFantasia);
    for (const s of linkedSuppliers) if (!byId.has(s.id)) byId.set(s.id, s.nomeFantasia);
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliersPage, linkedSuppliers]);

  const primarySupplierId = useWatch({ control, name: 'primarySupplierId' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection
        title={t('products:form.sections.general')}
        description={t('products:form.sections.generalDescription')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
          <Input
            {...register('codigo')}
            label={t('products:form.fields.codigo')}
            inputClassName="font-mono"
            error={errors.codigo?.message}
            required
          />
          <Input
            {...register('nome')}
            label={t('products:form.fields.nome')}
            error={errors.nome?.message}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-category" required>
              {t('products:form.fields.categoria')}
            </Label>
            <Controller
              control={control}
              name="categoria"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="product-category"
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.categoria || undefined}
                    className={errors.categoria ? 'border-danger' : undefined}
                  >
                    <SelectValue placeholder={t('products:form.placeholders.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ProductCategory).map((value) => (
                      <SelectItem key={value} value={value}>
                        {PRODUCT_CATEGORY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoria && <p className="text-xs text-danger">{errors.categoria.message}</p>}
          </div>
          <Input
            {...register('marca')}
            label={t('products:form.fields.marca')}
            hint={t('common:form.optional')}
            error={errors.marca?.message}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-unit" required>
              {t('products:form.fields.unidade')}
            </Label>
            <Controller
              control={control}
              name="unidade"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="product-unit"
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.unidade || undefined}
                    className={errors.unidade ? 'border-danger' : undefined}
                  >
                    <SelectValue placeholder={t('products:form.placeholders.unit')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UnitOfMeasure).map((value) => (
                      <SelectItem key={value} value={value}>
                        {UNIT_LABELS[value]} ({value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unidade && <p className="text-xs text-danger">{errors.unidade.message}</p>}
          </div>
          <Input
            {...register('leadTimeDays')}
            type="number"
            min={0}
            step={1}
            label={t('products:form.fields.leadTimeDays')}
            hint={t('products:form.hints.leadTimeDays')}
            error={errors.leadTimeDays?.message}
          />
          {showInitialPrice && (
            <Input
              {...register('initialPrice')}
              type="number"
              min={0}
              step="0.01"
              label={t('products:form.fields.initialPrice')}
              hint={t('products:form.hints.initialPrice')}
              error={errors.initialPrice?.message}
            />
          )}
        </div>
        <Textarea
          {...register('observacoes')}
          label={t('products:form.fields.observacoes')}
          hint={t('common:form.optional')}
          error={errors.observacoes?.message}
          rows={3}
        />
      </FormSection>

      <FormSection
        title={t('products:form.sections.suppliers')}
        description={t('products:form.sections.suppliersDescription')}
        delayMs={60}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-primary-supplier">
            {t('products:form.fields.primarySupplier')}
          </Label>
          <Controller
            control={control}
            name="primarySupplierId"
            render={({ field }) => (
              <Select
                value={field.value || NONE}
                onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
              >
                <SelectTrigger id="product-primary-supplier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t('products:form.noPrimarySupplier')}</SelectItem>
                  {supplierOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-xs font-semibold text-ink-soft">
            {t('products:form.fields.alternativeSuppliers')}
          </legend>
          {suppliersLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : supplierOptions.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-ink-soft">
              {t('products:form.noSuppliers')}
            </p>
          ) : (
            <Controller
              control={control}
              name="alternativeSupplierIds"
              render={({ field }) => (
                <div className="scrollbar-thin grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-2">
                  {supplierOptions
                    .filter((s) => s.id !== primarySupplierId)
                    .map((s) => {
                      const checked = field.value.includes(s.id);
                      const checkboxId = `alt-supplier-${s.id}`;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-hover"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={checked}
                            onCheckedChange={(value) =>
                              field.onChange(
                                value === true
                                  ? [...field.value, s.id]
                                  : field.value.filter((id) => id !== s.id),
                              )
                            }
                          />
                          <label
                            htmlFor={checkboxId}
                            className="flex-1 cursor-pointer text-sm text-ink"
                          >
                            {s.name}
                          </label>
                        </div>
                      );
                    })}
                </div>
              )}
            />
          )}
        </fieldset>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
