import { useEffect, useMemo, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Send } from 'lucide-react';
import type { PublicQuotationDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { formatCurrencyBRL } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { PriceInput, SubmitPricesPayload } from '../types';

type Item = PublicQuotationDto['itens'][number];
type Answer = PublicQuotationDto['resposta'];

const twoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
const optionalMoney = z.union([
  z.literal(''),
  z.coerce
    .number({ invalid_type_error: i18n.t('validation:number') })
    .min(0, i18n.t('validation:minValue', { count: 0 }))
    .refine(twoDecimals, i18n.t('validation:maxDecimals', { count: 2 })),
]);

const schema = (requireName: boolean) =>
  z.object({
    nomeResponsavel: requireName
      ? z.string().trim().min(2, i18n.t('quotations:response.errors.name')).max(120)
      : z.string().optional(),
    precos: z.array(
      z
        .object({
          itemId: z.string(),
          disponivel: z.boolean(),
          precoUnitario: optionalMoney,
          marca: z.string().max(80),
          referencia: z.string().max(80),
          observacao: z.string().max(500),
        })
        .superRefine((value, ctx) => {
          if (
            value.disponivel &&
            (value.precoUnitario === '' || Number(value.precoUnitario) <= 0)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['precoUnitario'],
              message: i18n.t('quotations:response.errors.price'),
            });
          }
        }),
    ),
    prazoEntregaDias: z.union([z.literal(''), z.coerce.number().int().min(0).max(3650)]),
    condicaoPagamento: z.string().max(120),
    validadeProposta: z.string(),
    frete: optionalMoney,
    observacoes: z.string().max(2000),
  });

type FormValues = z.infer<ReturnType<typeof schema>>;

function initialValues(items: readonly Item[], answer: Answer | null): FormValues {
  return {
    nomeResponsavel: answer?.respondidoPor ?? '',
    precos: items.map((item) => {
      const previous = answer?.precos.find((p) => p.itemId === item.id);
      return {
        itemId: item.id,
        disponivel: previous?.disponivel ?? true,
        precoUnitario: previous?.precoUnitario ? Number(previous.precoUnitario) : '',
        marca: previous?.marca ?? item.marca ?? '',
        referencia: previous?.referencia ?? item.referencia ?? '',
        observacao: previous?.observacao ?? '',
      };
    }),
    prazoEntregaDias: answer?.prazoEntregaDias ?? '',
    condicaoPagamento: answer?.condicaoPagamento ?? '',
    validadeProposta: answer?.validadeProposta ?? '',
    frete: answer?.frete ? Number(answer.frete) : '',
    observacoes: answer?.observacoes ?? '',
  };
}

interface PriceResponseFormProps {
  items: readonly Item[];
  answer: Answer | null;
  /** Link público: pede o nome de quem responde. */
  requireName: boolean;
  submitLabel: string;
  isSubmitting: boolean;
  disabled?: boolean;
  onSubmit: (payload: SubmitPricesPayload & { nomeResponsavel?: string }) => void;
  /** Ação extra no rodapé (ex.: "Não vamos cotar"). */
  secondaryAction?: ReactNode;
}

export function PriceResponseForm({
  items,
  answer,
  requireName,
  submitLabel,
  isSubmitting,
  disabled,
  onSubmit,
  secondaryAction,
}: PriceResponseFormProps) {
  const { t } = useTranslation('quotations');
  const resolver = useMemo(() => zodResolver(schema(requireName)), [requireName]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver, defaultValues: initialValues(items, answer) });
  const { fields } = useFieldArray({ control, name: 'precos' });
  const precos = useWatch({ control, name: 'precos' });
  const frete = useWatch({ control, name: 'frete' });

  useEffect(() => {
    reset(initialValues(items, answer));
  }, [items, answer, reset]);

  const total = useMemo(() => {
    const itemsTotal = (precos ?? []).reduce((sum, price, index) => {
      const qty = Number(items[index]?.quantidade ?? 0);
      return price?.disponivel && price.precoUnitario !== ''
        ? sum + Number(price.precoUnitario) * qty
        : sum;
    }, 0);
    return itemsTotal + (frete === '' || frete === undefined ? 0 : Number(frete));
  }, [precos, frete, items]);

  const submit = handleSubmit((values) => {
    const precosPayload: PriceInput[] = values.precos.map((price) => ({
      itemId: price.itemId,
      disponivel: price.disponivel,
      precoUnitario:
        price.disponivel && price.precoUnitario !== '' ? Number(price.precoUnitario) : null,
      marca: price.marca.trim() || undefined,
      referencia: price.referencia.trim() || undefined,
      observacao: price.observacao.trim() || undefined,
    }));
    onSubmit({
      nomeResponsavel: values.nomeResponsavel?.trim() || undefined,
      precos: precosPayload,
      prazoEntregaDias:
        values.prazoEntregaDias === '' ? undefined : Number(values.prazoEntregaDias),
      condicaoPagamento: values.condicaoPagamento.trim() || undefined,
      validadeProposta: values.validadeProposta || undefined,
      frete: values.frete === '' ? undefined : Number(values.frete),
      observacoes: values.observacoes.trim() || undefined,
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <fieldset disabled={disabled} className="space-y-3">
        <legend className="sr-only">{t('quotations:response.itemsLegend')}</legend>
        {fields.map((field, index) => {
          const item = items[index];
          if (!item) return null;
          const available = precos?.[index]?.disponivel ?? true;
          const unit = precos?.[index]?.precoUnitario;
          const itemErrors = errors.precos?.[index];
          return (
            <div
              key={field.id}
              className={cn(
                'rounded-lg border border-border bg-surface p-4 shadow-sm transition-opacity',
                !available && 'opacity-70',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-2xs uppercase tracking-[0.12em] text-brand-gold-700">
                    {t('quotations:response.itemNumber', { index: index + 1 })}
                  </p>
                  <p className="font-medium text-ink">{item.descricao}</p>
                  <p className="text-sm text-ink-soft">
                    <strong className="tabular-nums text-ink">
                      {Number(item.quantidade).toLocaleString()} {item.unidade}
                    </strong>
                    {item.marca || item.referencia ? (
                      <>
                        {' · '}
                        {t('quotations:response.requested', {
                          value: [item.marca, item.referencia].filter(Boolean).join(' · '),
                        })}
                      </>
                    ) : null}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-soft">
                  <Controller
                    control={control}
                    name={`precos.${index}.disponivel`}
                    render={({ field: f }) => (
                      <Switch checked={f.value} onCheckedChange={f.onChange} />
                    )}
                  />
                  {available
                    ? t('quotations:response.available')
                    : t('quotations:response.unavailable')}
                </label>
              </div>

              {available && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr]">
                  <Input
                    {...register(`precos.${index}.precoUnitario`)}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    label={t('quotations:response.unitPrice', { unit: item.unidade })}
                    error={itemErrors?.precoUnitario?.message}
                    required
                  />
                  <Input
                    {...register(`precos.${index}.marca`)}
                    label={t('quotations:response.brand')}
                    error={itemErrors?.marca?.message}
                  />
                  <Input
                    {...register(`precos.${index}.referencia`)}
                    label={t('quotations:response.reference')}
                    inputClassName="font-mono"
                    error={itemErrors?.referencia?.message}
                  />
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <Input
                  {...register(`precos.${index}.observacao`)}
                  label={t('quotations:response.itemNote')}
                  className="min-w-[14rem] flex-1"
                />
                {available && unit !== '' && unit !== undefined && Number(unit) > 0 && (
                  <p className="text-sm text-ink-soft">
                    {t('quotations:response.lineTotal')}{' '}
                    <strong className="tabular-nums text-ink">
                      {formatCurrencyBRL(Number(unit) * Number(item.quantidade))}
                    </strong>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </fieldset>

      <fieldset
        disabled={disabled}
        className="space-y-4 rounded-lg border border-border bg-surface p-4"
      >
        <legend className="px-1 text-sm font-semibold text-ink">
          {t('quotations:response.conditions')}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            {...register('prazoEntregaDias')}
            type="number"
            min={0}
            label={t('quotations:response.deliveryDays')}
            error={errors.prazoEntregaDias?.message}
          />
          <Input
            {...register('condicaoPagamento')}
            label={t('quotations:response.payment')}
            placeholder={t('quotations:response.paymentPlaceholder')}
            error={errors.condicaoPagamento?.message}
          />
          <Input
            {...register('validadeProposta')}
            type="date"
            label={t('quotations:response.validity')}
          />
          <Input
            {...register('frete')}
            type="number"
            min={0}
            step="0.01"
            label={t('quotations:response.freight')}
            error={errors.frete?.message}
          />
        </div>
        <Textarea
          {...register('observacoes')}
          label={t('quotations:response.notes')}
          rows={3}
          error={errors.observacoes?.message}
        />
        {requireName && (
          <Input
            {...register('nomeResponsavel')}
            label={t('quotations:response.name')}
            autoComplete="name"
            error={errors.nomeResponsavel?.message}
            required
          />
        )}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {t('quotations:response.total')}{' '}
          <strong className="font-display text-xl tabular-nums text-ink">
            {formatCurrencyBRL(total)}
          </strong>
        </p>
        <div className="flex flex-wrap gap-2">
          {secondaryAction}
          {!disabled && (
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              isLoading={isSubmitting}
            >
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
