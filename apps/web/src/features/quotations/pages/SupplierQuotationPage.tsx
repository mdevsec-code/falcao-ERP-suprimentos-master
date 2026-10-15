import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bookmark, CalendarClock, CheckCircle2, Copy, LinkIcon, Lock, XCircle } from 'lucide-react';

import { FalcaoLogo } from '@/assets/logo/FalcaoLogo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { brand } from '@/config/brand';
import { ApiError, getErrorMessage } from '@/services/http/errors';
import { formatDateOnly, formatDateTime } from '@/utils/format';
import { publicQuotationsApi } from '../services/quotations.api';
import { PriceResponseForm } from '../components/PriceResponseForm';
import type { PublicDeclinePayload, PublicSubmitPayload } from '../types';

/**
 * Página do fornecedor, aberta pelo link da cotação (sem login). Mostra os
 * materiais pedidos e recebe preço, marca, referência e condições.
 */
export function SupplierQuotationPage() {
  const { token = '' } = useParams();
  const [searchParams] = useSearchParams();
  /** Chegou agora pelo link aberto: precisa guardar este link (é o acesso para editar). */
  const justJoined = searchParams.get('novo') === '1';
  const pendingRegistration = searchParams.get('pendente') === '1';
  const { t } = useTranslation('quotations');
  const queryClient = useQueryClient();
  const queryKey = ['public-quotation', token];
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineName, setDeclineName] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const query = useQuery({
    queryKey,
    queryFn: () => publicQuotationsApi.view(token),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  const submit = useMutation({
    mutationFn: (payload: PublicSubmitPayload) => publicQuotationsApi.submit(token, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success(t('quotations:public.sent'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) =>
      toast.error(getErrorMessage(error, t('quotations:public.sendError'))),
  });

  const decline = useMutation({
    mutationFn: (payload: PublicDeclinePayload) => publicQuotationsApi.decline(token, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      setDeclineOpen(false);
      toast.success(t('quotations:public.declined'));
    },
    onError: (error: Error) =>
      toast.error(getErrorMessage(error, t('quotations:public.sendError'))),
  });

  const quotation = query.data;
  const answered = quotation?.resposta.status === 'RESPONDIDO';
  const refused = quotation?.resposta.status === 'RECUSOU';

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <FalcaoLogo className="h-9 w-9" />
            <div>
              <p className="font-display text-base font-semibold text-ink">{brand.name}</p>
              <p className="text-2xs uppercase tracking-[0.14em] text-ink-soft">
                {t('quotations:public.portal')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {query.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {query.isError && (
          <div className="mx-auto max-w-lg rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
            <LinkIcon className="mx-auto h-8 w-8 text-ink-soft" aria-hidden="true" />
            <h1 className="mt-3 font-display text-xl font-semibold text-ink">
              {t('quotations:public.invalidTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {t('quotations:public.invalidDescription')}
            </p>
          </div>
        )}

        {quotation && (
          <>
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
              <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
                {t('quotations:public.eyebrow', {
                  numero: quotation.numero,
                  empresa: quotation.empresa,
                })}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                {quotation.titulo}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                {t('quotations:public.greeting', { fornecedor: quotation.fornecedor.nomeFantasia })}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <CalendarClock className="h-4 w-4 text-ink-soft" aria-hidden="true" />
                  {t('quotations:public.deadline', {
                    date: formatDateOnly(quotation.prazoResposta),
                  })}
                </span>
                <span className="text-ink-soft">
                  {t('quotations:public.itemCount', { count: quotation.itens.length })}
                </span>
              </div>
              {quotation.observacoes && (
                <p className="mt-4 rounded-md bg-bg px-4 py-3 text-sm text-ink">
                  {quotation.observacoes}
                </p>
              )}
            </section>

            {justJoined && (
              <div
                role="status"
                className="flex flex-col gap-3 rounded-lg border border-brand-gold-300 bg-brand-gold-50/70 p-4 text-sm text-ink sm:flex-row sm:items-center"
              >
                <Bookmark className="h-5 w-5 shrink-0 text-brand-gold-700" aria-hidden="true" />
                <p className="flex-1">
                  {t('quotations:public.saveLink')}
                  {pendingRegistration && ` ${t('quotations:public.pendingRegistration')}`}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}`;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success(t('quotations:toast.linkCopied')))
                      .catch(() => toast.error(t('quotations:toast.copyFailed')));
                  }}
                >
                  {t('quotations:suppliers.copyLink')}
                </Button>
              </div>
            )}

            {answered && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-ink"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <p>
                  {t('quotations:public.answeredBanner', {
                    name: quotation.resposta.respondidoPor ?? '',
                    date: formatDateTime(quotation.resposta.respondidoEm),
                  })}
                  {quotation.aberta && ` ${t('quotations:public.canEdit')}`}
                </p>
              </div>
            )}
            {refused && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-ink"
              >
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
                <p>
                  {t('quotations:public.refusedBanner', {
                    date: formatDateTime(quotation.resposta.respondidoEm),
                  })}
                </p>
              </div>
            )}
            {!quotation.aberta && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-ink"
              >
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
                <p>{t(`quotations:public.closed.${quotation.motivoFechada ?? 'ENCERRADA'}`)}</p>
              </div>
            )}

            <PriceResponseForm
              items={quotation.itens}
              answer={quotation.resposta.status === 'CONVIDADO' ? null : quotation.resposta}
              requireName
              disabled={!quotation.aberta}
              submitLabel={answered ? t('quotations:public.update') : t('quotations:public.submit')}
              isSubmitting={submit.isPending}
              onSubmit={(payload) =>
                submit.mutate({ ...payload, nomeResponsavel: payload.nomeResponsavel ?? '' })
              }
              secondaryAction={
                quotation.aberta && !refused ? (
                  <Button variant="ghost" onClick={() => setDeclineOpen(true)}>
                    {t('quotations:public.decline')}
                  </Button>
                ) : null
              }
            />

            <p className="text-center text-2xs text-ink-soft">
              {t('quotations:public.privacy', { empresa: quotation.empresa })}
            </p>
          </>
        )}
      </main>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('quotations:public.declineTitle')}</DialogTitle>
            <DialogDescription>{t('quotations:public.declineDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              label={t('quotations:response.name')}
              value={declineName}
              onChange={(e) => setDeclineName(e.target.value)}
              autoComplete="name"
              name="decline-name"
              required
            />
            <Textarea
              label={t('quotations:public.declineReason')}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              maxLength={1000}
              name="decline-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineOpen(false)}
              disabled={decline.isPending}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={declineName.trim().length < 2}
              isLoading={decline.isPending}
              onClick={() =>
                decline.mutate({
                  nomeResponsavel: declineName.trim(),
                  motivo: declineReason.trim() || undefined,
                })
              }
            >
              {t('quotations:public.declineConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupplierQuotationPage;
