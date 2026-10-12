import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { contractsKeys } from '@/features/contracts/hooks/useContracts';
import { agendaKeys } from '@/features/agenda/hooks/useAgenda';
import { documentsApi } from '../services/documents.api';
import type { DocumentListParams, DocumentUpdatePayload } from '../types';

export const documentsKeys = {
  all: ['documents'] as const,
  list: (params: DocumentListParams) => [...documentsKeys.all, 'list', params] as const,
  stats: () => [...documentsKeys.all, 'stats'] as const,
  tags: () => [...documentsKeys.all, 'tags'] as const,
};

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: documentsKeys.list(params),
    queryFn: () => documentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDocumentStats() {
  return useQuery({ queryKey: documentsKeys.stats(), queryFn: documentsApi.stats });
}

export function useDocumentTags() {
  return useQuery({ queryKey: documentsKeys.tags(), queryFn: documentsApi.tags });
}

/** Documentos entram no detalhe do contrato e nos prazos da agenda. */
function useInvalidateDocuments() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    void queryClient.invalidateQueries({ queryKey: contractsKeys.all });
    void queryClient.invalidateQueries({ queryKey: agendaKeys.all });
  };
}

export function useUploadDocument() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (form: FormData) => documentsApi.upload(form),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('documents:toast.uploaded'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('documents:toast.uploadError')));
    },
  });
}

export function useUpdateDocument() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DocumentUpdatePayload }) =>
      documentsApi.update(id, input),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('documents:toast.updated'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useRemoveDocument() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('documents:toast.removed'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}
