import { useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { FileUp, Paperclip, Plus, Send, Trash2, X } from 'lucide-react';
import { ExpenseCategory } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormSection } from '@/components/common/FormSection';
import { SelectField } from '@/components/common/SelectField';
import { CostCenterInput } from '@/features/agenda/components/CostCenterInput';
import { EXPENSE_CATEGORY_LABELS } from '@/constants/enums';
import { formatCurrencyBRL, formatFileSize } from '@/utils/format';
import { toDateOnly } from '@falcao-erp/shared-types';
import {
  emptyExpenseItem,
  MAX_RECEIPT_BYTES,
  reimbursementFormSchema,
  type ReimbursementFormInput,
} from '../types';

interface ReimbursementFormProps {
  onSubmit: (values: ReimbursementFormInput, files: File[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ReimbursementForm({ onSubmit, onCancel, isSubmitting }: ReimbursementFormProps) {
  const { t } = useTranslation('reimbursements');
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReimbursementFormInput>({
    resolver: zodResolver(reimbursementFormSchema),
    mode: 'onTouched',
    defaultValues: { titulo: '', costCenter: '', items: [emptyExpenseItem()] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' });
  const total = (items ?? []).reduce((sum, item) => {
    const value = Number(item?.valor);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

  const categoryOptions = Object.values(ExpenseCategory).map((value) => ({
    value,
    label: EXPENSE_CATEGORY_LABELS[value],
  }));

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const picked = [...list];
    const tooLarge = picked.filter((file) => file.size > MAX_RECEIPT_BYTES);
    setFileError(
      tooLarge.length > 0
        ? t('common:file.tooLarge', { max: formatFileSize(MAX_RECEIPT_BYTES) })
        : null,
    );
    setFiles((prev) => [...prev, ...picked.filter((file) => file.size <= MAX_RECEIPT_BYTES)]);
    if (fileInput.current) fileInput.current.value = '';
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values, files))}
      noValidate
      className="space-y-6"
    >
      <FormSection
        title={t('reimbursements:form.sections.general')}
        description={t('reimbursements:form.sections.generalDescription')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <Input
            {...register('titulo')}
            label={t('reimbursements:form.fields.titulo')}
            placeholder={t('reimbursements:form.placeholders.titulo')}
            error={errors.titulo?.message}
            required
          />
          <CostCenterInput
            {...register('costCenter')}
            label={t('reimbursements:form.fields.costCenter')}
            hint={t('common:form.optional')}
            error={errors.costCenter?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title={t('reimbursements:form.sections.expenses')}
        description={t('reimbursements:form.sections.expensesDescription')}
        delayMs={60}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => append(emptyExpenseItem())}
          >
            {t('reimbursements:form.addExpense')}
          </Button>
        }
      >
        {errors.items?.message && <p className="text-xs text-danger">{errors.items.message}</p>}
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const itemErrors = errors.items?.[index];
            return (
              <li
                key={field.id}
                className="grid animate-slide-up grid-cols-1 items-start gap-3 rounded-md border border-border bg-bg/40 p-3 sm:grid-cols-[9rem_11rem_1fr_8rem_auto]"
              >
                <Input
                  {...register(`items.${index}.data`)}
                  type="date"
                  max={toDateOnly()}
                  label={t('reimbursements:form.fields.data')}
                  error={itemErrors?.data?.message}
                  required
                />
                <Controller
                  control={control}
                  name={`items.${index}.categoria`}
                  render={({ field: categoryField }) => (
                    <SelectField
                      id={`expense-category-${index}`}
                      label={t('reimbursements:form.fields.categoria')}
                      placeholder={t('reimbursements:form.placeholders.categoria')}
                      value={categoryField.value}
                      onChange={categoryField.onChange}
                      onBlur={categoryField.onBlur}
                      options={categoryOptions}
                      error={itemErrors?.categoria?.message}
                      required
                    />
                  )}
                />
                <Input
                  {...register(`items.${index}.descricao`)}
                  label={t('reimbursements:form.fields.descricao')}
                  placeholder={t('reimbursements:form.placeholders.descricao')}
                  error={itemErrors?.descricao?.message}
                  required
                />
                <Input
                  {...register(`items.${index}.valor`)}
                  type="number"
                  min={0.01}
                  step="0.01"
                  label={t('reimbursements:form.fields.valor')}
                  error={itemErrors?.valor?.message}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 h-10 w-10 text-danger hover:text-danger"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label={t('reimbursements:form.removeExpenseAria', { index: index + 1 })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <span className="text-sm text-ink-soft">{t('reimbursements:form.total')}</span>
          <span className="font-display text-2xl font-semibold tabular-nums text-ink">
            {formatCurrencyBRL(total)}
          </span>
        </div>
      </FormSection>

      <FormSection
        title={t('reimbursements:form.sections.receipts')}
        description={t('reimbursements:form.sections.receiptsDescription')}
        delayMs={120}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<FileUp className="h-3.5 w-3.5" />}
            onClick={() => fileInput.current?.click()}
          >
            {t('reimbursements:form.addReceipts')}
          </Button>
        }
      >
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {fileError && <p className="text-xs text-danger">{fileError}</p>}
        {files.length === 0 ? (
          <p className="text-sm text-ink-soft">{t('reimbursements:form.noReceipts')}</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="flex animate-fade-in items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
                  <span className="truncate text-ink">{file.name}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {formatFileSize(file.size)}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={t('common:file.remove')}
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
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
          {t('reimbursements:form.submit')}
        </Button>
      </div>
    </form>
  );
}
