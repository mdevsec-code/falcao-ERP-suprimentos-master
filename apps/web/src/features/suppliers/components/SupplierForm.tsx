import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Trash2 } from 'lucide-react';
import { BRAZILIAN_STATES, ContactType, SupplierCategory } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { FormSection } from '@/components/common/FormSection';
import { CONTACT_TYPE_LABELS, SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { formatCNPJ } from '@/utils/format';
import { supplierFormSchema, type SupplierFormInput } from '../types';
import { SupplierDescriptionFields } from './SupplierDescriptionFields';

const EMPTY_CONTACT: SupplierFormInput['contacts'][number] = {
  type: ContactType.PHONE,
  label: '',
  value: '',
};

function emptyValues(): SupplierFormInput {
  return {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    categoria: undefined as unknown as SupplierFormInput['categoria'],
    cidade: '',
    estado: undefined as unknown as SupplierFormInput['estado'],
    responsavel: '',
    atividades: '',
    atividadesZh: '',
    produtosServicos: '',
    produtosServicosZh: '',
    contacts: [EMPTY_CONTACT],
  };
}

interface SupplierFormProps {
  defaultValues?: SupplierFormInput;
  onSubmit: (values: SupplierFormInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
}

export function SupplierForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: SupplierFormProps) {
  const { t } = useTranslation('suppliers');
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormInput>({
    resolver: zodResolver(supplierFormSchema),
    mode: 'onTouched',
    defaultValues: defaultValues ?? emptyValues(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection
        title={t('suppliers:form.sections.general')}
        description={t('suppliers:form.sections.generalDescription')}
      >
        <Input
          {...register('razaoSocial')}
          label={t('suppliers:form.fields.razaoSocial')}
          error={errors.razaoSocial?.message}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            {...register('nomeFantasia')}
            label={t('suppliers:form.fields.nomeFantasia')}
            error={errors.nomeFantasia?.message}
            required
          />
          <Controller
            control={control}
            name="cnpj"
            render={({ field }) => (
              <Input
                {...field}
                onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                label={t('suppliers:form.fields.cnpj')}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                inputClassName="font-mono"
                error={errors.cnpj?.message}
                required
              />
            )}
          />
          <Input
            {...register('inscricaoEstadual')}
            label={t('suppliers:form.fields.inscricaoEstadual')}
            hint={t('common:form.optional')}
            error={errors.inscricaoEstadual?.message}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-category" required>
              {t('suppliers:form.fields.categoria')}
            </Label>
            <Controller
              control={control}
              name="categoria"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="supplier-category"
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.categoria || undefined}
                    className={errors.categoria ? 'border-danger' : undefined}
                  >
                    <SelectValue placeholder={t('suppliers:form.placeholders.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SupplierCategory).map((value) => (
                      <SelectItem key={value} value={value}>
                        {SUPPLIER_CATEGORY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoria && <p className="text-xs text-danger">{errors.categoria.message}</p>}
          </div>
          <Input
            {...register('responsavel')}
            label={t('suppliers:form.fields.responsavel')}
            error={errors.responsavel?.message}
            required
          />
        </div>
      </FormSection>

      <FormSection title={t('suppliers:form.sections.address')} delayMs={60}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <Input
            {...register('cidade')}
            label={t('suppliers:form.fields.cidade')}
            error={errors.cidade?.message}
            required
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-state" required>
              {t('suppliers:form.fields.estado')}
            </Label>
            <Controller
              control={control}
              name="estado"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="supplier-state"
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.estado || undefined}
                    className={errors.estado ? 'border-danger' : undefined}
                  >
                    <SelectValue placeholder={t('suppliers:form.placeholders.state')} />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.estado && <p className="text-xs text-danger">{errors.estado.message}</p>}
          </div>
        </div>
      </FormSection>

      <FormSection
        title={t('suppliers:form.sections.description')}
        description={t('suppliers:form.sections.descriptionHint')}
        delayMs={90}
      >
        <SupplierDescriptionFields
          register={(name) => register(name)}
          errors={{
            atividades: errors.atividades?.message,
            atividadesZh: errors.atividadesZh?.message,
            produtosServicos: errors.produtosServicos?.message,
            produtosServicosZh: errors.produtosServicosZh?.message,
          }}
        />
      </FormSection>

      <FormSection
        title={t('suppliers:form.sections.contacts')}
        description={t('suppliers:form.sections.contactsDescription')}
        delayMs={120}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => append(EMPTY_CONTACT)}
          >
            {t('suppliers:form.addContact')}
          </Button>
        }
      >
        {errors.contacts?.root?.message && (
          <p className="text-xs text-danger">{errors.contacts.root.message}</p>
        )}
        {errors.contacts?.message && (
          <p className="text-xs text-danger">{errors.contacts.message}</p>
        )}
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="grid animate-slide-up grid-cols-1 gap-3 rounded-md border border-border bg-bg/40 p-3 sm:grid-cols-[140px_1fr_1.4fr_auto]"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`contact-type-${index}`}>
                  {t('suppliers:form.fields.contactType')}
                </Label>
                <Controller
                  control={control}
                  name={`contacts.${index}.type`}
                  render={({ field: typeField }) => (
                    <Select value={typeField.value} onValueChange={typeField.onChange}>
                      <SelectTrigger id={`contact-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ContactType).map((value) => (
                          <SelectItem key={value} value={value}>
                            {CONTACT_TYPE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Input
                {...register(`contacts.${index}.label`)}
                label={t('suppliers:form.fields.contactLabel')}
                placeholder={t('suppliers:form.placeholders.contactLabel')}
                error={errors.contacts?.[index]?.label?.message}
              />
              <Input
                {...register(`contacts.${index}.value`)}
                label={t('suppliers:form.fields.contactValue')}
                placeholder={t('suppliers:form.placeholders.contactValue')}
                error={errors.contacts?.[index]?.value?.message}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-danger hover:text-danger"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label={t('suppliers:form.removeContactAria', { index: index + 1 })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
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
