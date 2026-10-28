import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Send } from 'lucide-react';
import { BRAZILIAN_STATES, SupplierCategory } from '@falcao-erp/shared-types';

import { SelectField } from '@/components/common/SelectField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { SupplierDescriptionFields } from '@/features/suppliers/components/SupplierDescriptionFields';
import { publicSupplierSignupApi } from '@/features/suppliers/services/suppliers.api';
import { makeSupplierSignupSchema, type SupplierSignupInput } from '@/features/suppliers/types';
import { ApiError } from '@/services/http/errors';
import { formatCNPJ, formatPhoneBR } from '@/utils/format';
import { PublicInvalidLink, PublicLoading, PublicShell } from '../components/PublicShell';

const EMPTY: SupplierSignupInput = {
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  inscricaoEstadual: '',
  categoria: undefined as unknown as SupplierSignupInput['categoria'],
  cidade: '',
  estado: undefined as unknown as SupplierSignupInput['estado'],
  responsavel: '',
  email: '',
  telefone: '',
  atividades: '',
  atividadesZh: '',
  produtosServicos: '',
  produtosServicosZh: '',
};

/**
 * Link público para o fornecedor fazer o próprio cadastro: dados da empresa,
 * contato e o que ela fornece, em português e/ou chinês. O cadastro chega a
 * compras como pendente, para análise e aprovação.
 */
export function SupplierSignupPage() {
  const { token = '' } = useParams();
  const { t, i18n } = useTranslation(['suppliers', 'supplierPortal']);
  const [sent, setSent] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['public-supplier-signup', token],
    queryFn: () => publicSupplierSignupApi.view(token),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  // Recriado ao trocar o idioma, para as mensagens de erro saírem no idioma escolhido.
  const schema = useMemo(() => makeSupplierSignupSchema(), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const form = useForm<SupplierSignupInput>({
    // O Zod só confere "produtos em pelo menos um idioma" quando o resto está válido;
    // aqui o aviso aparece junto com os outros erros.
    resolver: async (values, context, options) => {
      const result = await zodResolver(schema)(values, context, options);
      if (!values.produtosServicos?.trim() && !values.produtosServicosZh?.trim()) {
        return {
          values: {},
          errors: {
            ...result.errors,
            produtosServicos: { type: 'required', message: t('suppliers:signup.productsRequired') },
          },
        };
      }
      return result;
    },
    defaultValues: EMPTY,
    mode: 'onTouched',
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitted },
  } = form;

  useEffect(() => {
    if (isSubmitted) void trigger();
  }, [schema, isSubmitted, trigger]);

  const submit = useMutation({
    mutationFn: (values: SupplierSignupInput) => publicSupplierSignupApi.submit(token, values),
    onSuccess: (data) => {
      setSent(data.fornecedor);
      reset(EMPTY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) => {
      const status = error instanceof ApiError ? error.status : 0;
      toast.error(
        status === 409
          ? t('suppliers:signup.cnpjExists')
          : status === 400
            ? t('suppliers:signup.invalid')
            : status === 429
              ? t('suppliers:signup.tooMany')
              : t('supplierPortal:errors.generic'),
      );
    },
  });

  return (
    <PublicShell portal={t('suppliers:signup.portal')}>
      {query.isLoading && <PublicLoading />}
      {query.isError && (
        <PublicInvalidLink
          title={t('suppliers:signup.invalidTitle')}
          description={t('suppliers:signup.invalidDescription')}
        />
      )}

      {query.data && sent && (
        <section className="mx-auto max-w-xl rounded-lg border border-success/30 bg-surface p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
          <h1 className="mt-3 font-display text-xl font-semibold text-ink">
            {t('suppliers:signup.sentTitle')}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {t('suppliers:signup.sentDescription', {
              fornecedor: sent,
              empresa: query.data.empresa,
            })}
          </p>
        </section>
      )}

      {query.data && !sent && (
        <form
          noValidate
          onSubmit={handleSubmit((values) => submit.mutate(values))}
          className="space-y-6"
        >
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
              {query.data.empresa}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              {t('suppliers:signup.title')}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{t('suppliers:signup.intro')}</p>
          </section>

          <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-ink">
              {t('suppliers:signup.companyStep')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="cnpj"
                render={({ field }) => (
                  <Input
                    label={t('suppliers:form.fields.cnpj')}
                    value={field.value}
                    onChange={(event) => field.onChange(formatCNPJ(event.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    error={errors.cnpj?.message as string | undefined}
                    required
                  />
                )}
              />
              <Input
                {...register('inscricaoEstadual')}
                label={t('suppliers:form.fields.inscricaoEstadual')}
                error={errors.inscricaoEstadual?.message}
              />
              <Input
                {...register('razaoSocial')}
                label={t('suppliers:form.fields.razaoSocial')}
                autoComplete="organization"
                error={errors.razaoSocial?.message}
                required
              />
              <Input
                {...register('nomeFantasia')}
                label={t('suppliers:form.fields.nomeFantasia')}
                error={errors.nomeFantasia?.message}
                required
              />
              <Controller
                control={control}
                name="categoria"
                render={({ field }) => (
                  <SelectField
                    id="signup-category"
                    label={t('suppliers:form.fields.categoria')}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={t('suppliers:form.placeholders.category')}
                    options={Object.values(SupplierCategory).map((value) => ({
                      value,
                      label: SUPPLIER_CATEGORY_LABELS[value],
                    }))}
                    error={errors.categoria?.message}
                    required
                  />
                )}
              />
              <div className="grid grid-cols-[1fr_6rem] gap-3">
                <Input
                  {...register('cidade')}
                  label={t('suppliers:form.fields.cidade')}
                  autoComplete="address-level2"
                  error={errors.cidade?.message}
                  required
                />
                <Controller
                  control={control}
                  name="estado"
                  render={({ field }) => (
                    <SelectField
                      id="signup-state"
                      label={t('suppliers:form.fields.estado')}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }))}
                      error={errors.estado?.message}
                      required
                    />
                  )}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-ink">
              {t('suppliers:signup.contactStep')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                {...register('responsavel')}
                label={t('suppliers:form.fields.responsavel')}
                autoComplete="name"
                error={errors.responsavel?.message}
                required
              />
              <Input
                {...register('email')}
                type="email"
                label={t('suppliers:signup.email')}
                autoComplete="email"
                error={errors.email?.message}
                required
              />
              <Controller
                control={control}
                name="telefone"
                render={({ field }) => (
                  <Input
                    label={t('suppliers:signup.telefone')}
                    value={field.value}
                    onChange={(event) => field.onChange(formatPhoneBR(event.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    type="tel"
                    autoComplete="tel"
                    error={errors.telefone?.message}
                    required
                  />
                )}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-ink">
                {t('suppliers:form.sections.description')}
              </h2>
              <p className="text-sm text-ink-soft">{t('suppliers:signup.descriptionHint')}</p>
            </div>
            <SupplierDescriptionFields
              idPrefix="signup"
              productsRequired
              register={(name) => register(name)}
              errors={{
                atividades: errors.atividades?.message,
                atividadesZh: errors.atividadesZh?.message,
                produtosServicos: errors.produtosServicos?.message,
                produtosServicosZh: errors.produtosServicosZh?.message,
              }}
            />
          </section>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-soft">{t('suppliers:signup.review')}</p>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              isLoading={submit.isPending}
            >
              {t('suppliers:signup.submit')}
            </Button>
          </div>
        </form>
      )}
    </PublicShell>
  );
}
