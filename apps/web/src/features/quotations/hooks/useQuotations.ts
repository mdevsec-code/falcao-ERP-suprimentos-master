import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { QuotationDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { quotationsApi } from '../services/quotations.api';
import type {
  CreateQuotationPayload,
  QuotationListParams,
  SubmitPricesPayload,
  UpdateQuotationPayload,
} from '../types';

export const quotationsKeys = {
  all: ['quotations'] as const,
  lists: () => [...quotationsKeys.all, 'list'] as const,
  list: (params: QuotationListParams) => [...quotationsKeys.lists(), params] as const,
  detail: (id: string) => [...quotationsKeys.all, 'detail', id] as const,
  stats: () => [...quotationsKeys.all, 'stats'] as const,
};

export function useQuotations(params: QuotationListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: quotationsKeys.list(params),
    queryFn: () => quotationsApi.list(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useQuotationStats() {
  return useQuery({ queryKey: quotationsKeys.stats(), queryFn: quotationsApi.stats });
}

export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: quotationsKeys.detail(id ?? ''),
    queryFn: () => quotationsApi.getById(id as string),
    enabled: !!id,
    // Respostas chegam pelo link do fornecedor a qualquer momento.
    refetchInterval: 60_000,
  });
}

/** Mutação que devolve a cotação atualizada: grava no cache e invalida listas e indicadores. */
function useQuotationMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<QuotationDetailDto>,
  successKey: string | null,
  /** Outras telas afetadas (ex.: o catálogo, quando a cotação é encerrada). */
  alsoInvalidate: readonly (readonly unknown[])[] = [],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationsKeys.detail(quotation.id), quotation);
      void queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: quotationsKeys.stats() });
      alsoInvalidate.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));
      if (successKey) toast.success(i18n.t(successKey));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuotationPayload) => quotationsApi.create(input),
    onSuccess: (quotation) => {
      queryClient.setQueryData(quotationsKeys.detail(quotation.id), quotation);
      void queryClient.invalidateQueries({ queryKey: quotationsKeys.all });
      // A solicitação muda para "em cotação".
      void queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(i18n.t('quotations:toast.created', { numero: quotation.numero }));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('quotations:toast.createError')));
    },
  });
}

export function useUpdateQuotation(id: string) {
  return useQuotationMutation(
    (patch: UpdateQuotationPayload) => quotationsApi.update(id, patch),
    'quotations:toast.updated',
  );
}

export function useAddQuotationSupplier(id: string) {
  return useQuotationMutation(
    (supplierId: string) => quotationsApi.addSupplier(id, supplierId),
    'quotations:toast.supplierAdded',
  );
}

export function useRemoveQuotationSupplier(id: string) {
  return useQuotationMutation(
    (quotationSupplierId: string) => quotationsApi.removeSupplier(id, quotationSupplierId),
    'quotations:toast.supplierRemoved',
  );
}

export function useRegenerateQuotationLink(id: string) {
  return useQuotationMutation(
    (quotationSupplierId: string) => quotationsApi.regenerateLink(id, quotationSupplierId),
    'quotations:toast.linkRegenerated',
  );
}

export function useSubmitQuotationPrices(id: string) {
  return useQuotationMutation(
    ({
      quotationSupplierId,
      payload,
    }: {
      quotationSupplierId: string;
      payload: SubmitPricesPayload;
    }) => quotationsApi.submitPrices(id, quotationSupplierId, payload),
    'quotations:toast.pricesSaved',
  );
}

export function useSetQuotationWinner(id: string) {
  return useQuotationMutation(
    ({ itemId, quotationSupplierId }: { itemId: string; quotationSupplierId: string | null }) =>
      quotationsApi.setWinner(id, itemId, quotationSupplierId),
    null,
  );
}

export function usePickCheapest(id: string) {
  return useQuotationMutation(
    () => quotationsApi.pickCheapest(id),
    'quotations:toast.cheapestPicked',
  );
}

export function useCloseQuotation(id: string) {
  // Os preços vencedores entram no histórico do catálogo.
  return useQuotationMutation(() => quotationsApi.close(id), 'quotations:toast.closed', [
    ['products'],
  ]);
}

export function useCancelQuotation(id: string) {
  return useQuotationMutation(() => quotationsApi.cancel(id), 'quotations:toast.cancelled');
}

export function useEnableOpenLink(id: string) {
  return useQuotationMutation(
    () => quotationsApi.enableOpenLink(id),
    'quotations:toast.openLinkOn',
  );
}

export function useDisableOpenLink(id: string) {
  return useQuotationMutation(
    () => quotationsApi.disableOpenLink(id),
    'quotations:toast.openLinkOff',
  );
}
