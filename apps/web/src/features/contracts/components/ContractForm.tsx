import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormSection } from '@/components/common/FormSection';
import { SelectField } from '@/components/common/SelectField';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { CostCenterInput } from '@/features/agenda/components/CostCenterInput';
import { contractFormSchema, emptyContractForm, type ContractFormInput } from '../types';

interface ContractFormProps {
  defaultValues?: ContractFormInput;
  /** Fornecedor atual na edição — entra nas opções mesmo se estiver inativo. */
  currentSupplier?: { id: string; name: string };
  onSubmit: (values: ContractFormInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
}

export function ContractForm({
  defaultValues,
  currentSupplier,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: ContractFormProps) {
  const { t } = useTranslation('contracts');
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractFormInput>({
    resolver: zodResolver(contractFormSchema),
    mode: 'onTouched',
    defaultValues: defaultValues ?? emptyContractForm(),
  });

  const { data: suppliersPage } = useActiveSupplierOptions();
  const supplierOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const s of suppliersPage?.data ?? []) byId.set(s.id, s.nomeFantasia);
    if (currentSupplier && !byId.has(currentSupplier.id))
      byId.set(currentSupplier.id, currentSupplier.name);
    return [...byId.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [suppliersPage, currentSupplier]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection
        title={t('contracts:form.sections.identification')}
        description={t('contracts:form.sections.identificationDescription')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
          <Input
            {...register('numero')}
            label={t('contracts:form.fields.numero')}
            placeholder={t('contracts:form.placeholders.numero')}
            inputClassName="font-mono"
            error={errors.numero?.message}
            required
          />
          <Input
            {...register('objeto')}
            label={t('contracts:form.fields.objeto')}
            placeholder={t('contracts:form.placeholders.objeto')}
            error={errors.objeto?.message}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="supplierId"
            render={({ field }) => (
              <SelectField
                id="contract-supplier"
                label={t('contracts:form.fields.supplier')}
                placeholder={t('contracts:form.placeholders.supplier')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={supplierOptions}
                error={errors.supplierId?.message}
                required
              />
            )}
          />
          <CostCenterInput
            {...register('costCenter')}
            label={t('contracts:form.fields.costCenter')}
            hint={t('contracts:form.hints.costCenter')}
            error={errors.costCenter?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title={t('contracts:form.sections.terms')}
        description={t('contracts:form.sections.termsDescription')}
        delayMs={60}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            {...register('valorTotal')}
            type="number"
            min={0}
            step="0.01"
            label={t('contracts:form.fields.valorTotal')}
            error={errors.valorTotal?.message}
            required
          />
          <Input
            {...register('dataInicio')}
            type="date"
            label={t('contracts:form.fields.dataInicio')}
            error={errors.dataInicio?.message}
            required
          />
          <Input
            {...register('dataFim')}
            type="date"
            label={t('contracts:form.fields.dataFim')}
            error={errors.dataFim?.message}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            {...register('assinadoEm')}
            type="date"
            label={t('contracts:form.fields.assinadoEm')}
            hint={t('contracts:form.hints.assinadoEm')}
            error={errors.assinadoEm?.message}
          />
          <Input
            {...register('alertaDias')}
            type="number"
            min={0}
            max={365}
            step={1}
            label={t('contracts:form.fields.alertaDias')}
            hint={t('contracts:form.hints.alertaDias')}
            error={errors.alertaDias?.message}
            required
          />
        </div>
        <Textarea
          {...register('descricao')}
          label={t('contracts:form.fields.descricao')}
          hint={t('common:form.optional')}
          error={errors.descricao?.message}
          rows={4}
        />
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
