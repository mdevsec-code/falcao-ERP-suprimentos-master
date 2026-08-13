import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client";
import { purchaseRequestsApi, type PurchaseRequestFormInput } from "../api/purchase-requests-api";
import { purchaseRequestsKeys } from "../api/purchase-requests-keys";

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PurchaseRequestFormInput) => purchaseRequestsApi.create(data),
    onSuccess: () => {
      toast.success("Solicitação criada com sucesso.");
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível criar a solicitação.")),
  });
}

export function useUpdatePurchaseRequest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PurchaseRequestFormInput>) => purchaseRequestsApi.update(id, data),
    onSuccess: () => {
      toast.success("Solicitação atualizada com sucesso.");
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível atualizar a solicitação.")),
  });
}

export function useChangeStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, comment }: { status: string; comment?: string }) =>
      purchaseRequestsApi.changeStatus(id, status, comment),
    onSuccess: () => {
      toast.success("Status atualizado.");
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.stats() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível alterar o status.")),
  });
}

export function useAddPurchaseRequestComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => purchaseRequestsApi.addComment(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.timeline(id) });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUploadPurchaseRequestAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => purchaseRequestsApi.uploadAttachment(id, file),
    onSuccess: () => {
      toast.success("Arquivo enviado com sucesso.");
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.detail(id) });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível enviar o arquivo.")),
  });
}

export function useRemovePurchaseRequestAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => purchaseRequestsApi.removeAttachment(id, attachmentId),
    onSuccess: () => {
      toast.success("Arquivo removido.");
      queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.detail(id) });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
