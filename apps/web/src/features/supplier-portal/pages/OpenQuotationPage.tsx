import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarClock, HardHat, Lock } from 'lucide-react';

import { routeTo } from '@/constants/routes';
import { publicOpenQuotationsApi } from '@/features/quotations/services/quotations.api';
import type { PublicIdentityPayload } from '@/features/quotations/types';
import { ApiError, getErrorMessage } from '@/services/http/errors';
import { formatDateOnly } from '@/utils/format';
import { PublicInvalidLink, PublicLoading, PublicShell } from '../components/PublicShell';
import { SupplierIdentityForm } from '../components/SupplierIdentityForm';

/**
 * Link aberto da cotação (normalmente de um plano de requisição): o
 * fornecedor vê a lista, informa o CNPJ e segue para o próprio link de
 * resposta, onde cota em cima dos itens.
 */
export function OpenQuotationPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('supplierPortal');
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const query = useQuery({
    queryKey: ['public-open-quotation', token],
    queryFn: () => publicOpenQuotationsApi.view(token),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  const join = useMutation({
    mutationFn: (payload: PublicIdentityPayload) => publicOpenQuotationsApi.join(token, payload),
    onSuccess: (result) => {
      const params = new URLSearchParams({ novo: '1' });
      if (result.cadastroPendente) params.set('pendente', '1');
      navigate(`${routeTo.supplierQuotation(result.linkToken)}?${params.toString()}`);
    },
    onError: (error: Error) => {
      // 422 = CNPJ ainda não cadastrado: abre os campos de cadastro.
      if (error instanceof ApiError && error.status === 422) {
        setNeedsRegistration(true);
        toast.info(t('supplierPortal:identity.registrationNeeded'));
        return;
      }
      toast.error(getErrorMessage(error, t('supplierPortal:errors.generic')));
    },
  });

  const quotation = query.data;

  return (
    <PublicShell portal={t('supplierPortal:openQuotation.portal')}>
      {query.isLoading && <PublicLoading />}
      {query.isError && (
        <PublicInvalidLink
          title={t('supplierPortal:openQuotation.invalidTitle')}
          description={t('supplierPortal:openQuotation.invalidDescription')}
        />
      )}

      {quotation && (
        <>
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
              {quotation.plano
                ? t('supplierPortal:openQuotation.eyebrowPlan', {
                    numero: quotation.plano.numero,
                    empresa: quotation.empresa,
                  })
                : t('supplierPortal:openQuotation.eyebrow', {
                    numero: quotation.numero,
                    empresa: quotation.empresa,
                  })}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              {quotation.titulo}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {t('supplierPortal:openQuotation.intro', { empresa: quotation.empresa })}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-ink">
                <CalendarClock className="h-4 w-4 text-ink-soft" aria-hidden="true" />
                {t('supplierPortal:openQuotation.deadline', {
                  date: formatDateOnly(quotation.prazoResposta),
                })}
              </span>
              {quotation.obra && (
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <HardHat className="h-4 w-4 text-ink-soft" aria-hidden="true" />
                  {quotation.obra}
                </span>
              )}
              <span className="text-ink-soft">
                {t('supplierPortal:openQuotation.itemCount', { count: quotation.itens.length })}
              </span>
            </div>
            {quotation.observacoes && (
              <p className="mt-4 whitespace-pre-line rounded-md bg-bg px-4 py-3 text-sm text-ink">
                {quotation.observacoes}
              </p>
            )}
          </section>

          <section aria-labelledby="open-items" className="space-y-2">
            <h2 id="open-items" className="text-base font-semibold text-ink">
              {t('supplierPortal:openQuotation.itemsTitle')}
            </h2>
            <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {quotation.itens.map((item, index) => {
                const extra = [item.marca, item.referencia].filter(Boolean).join(' · ');
                return (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span className="w-6 shrink-0 font-mono text-ink-soft">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-ink">{item.descricao}</span>
                      {extra && (
                        <span className="text-xs text-ink-soft">
                          {t('supplierPortal:openQuotation.requested', { value: extra })}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-medium tabular-nums text-ink">
                      {Number(item.quantidade).toLocaleString()} {item.unidade}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {quotation.aberta ? (
            <SupplierIdentityForm
              needsRegistration={needsRegistration}
              isSubmitting={join.isPending}
              submitLabel={t('supplierPortal:openQuotation.submit')}
              onSubmit={(payload) => join.mutate(payload)}
            />
          ) : (
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-ink"
            >
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
              <p>{t(`supplierPortal:closed.${quotation.motivoFechada ?? 'ENCERRADA'}`)}</p>
            </div>
          )}

          <p className="text-center text-2xs text-ink-soft">
            {t('supplierPortal:openQuotation.privacy', { empresa: quotation.empresa })}
          </p>
        </>
      )}
    </PublicShell>
  );
}

export default OpenQuotationPage;
