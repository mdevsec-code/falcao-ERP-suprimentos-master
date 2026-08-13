import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client";
import { suppliersApi, type SupplierFormInput } from "../api/suppliers-api";
import { suppliersKeys } from "../api/suppliers-keys";

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierFormInput) => suppliersApi.create(data),
    onSuccess: () => {
      toast.success("Fornecedor cadastrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível cadastrar o fornecedor.")),
  });
}

export function useUpdateSupplier(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupplierFormInput>) => suppliersApi.update(id, data),
    onSuccess: () => {
      toast.success("Fornecedor atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível atualizar o fornecedor.")),
  });
}

export function useSetSupplierActive(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) =>
      isActive ? suppliersApi.reactivate(id) : suppliersApi.deactivate(id),
    onSuccess: (_, isActive) => {
      toast.success(isActive ? "Fornecedor reativado." : "Fornecedor desativado.");
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useAddEvaluation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ score, comment }: { score: number; comment?: string }) =>
      suppliersApi.addEvaluation(id, score, comment),
    onSuccess: () => {
      toast.success("Avaliação registrada.");
      queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUploadDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, category }: { file: File; category: string }) =>
      suppliersApi.uploadDocument(id, file, category),
    onSuccess: () => {
      toast.success("Documento enviado com sucesso.");
      queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível enviar o documento.")),
  });
}

export function useRemoveDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => suppliersApi.removeDocument(id, documentId),
    onSuccess: () => {
      toast.success("Documento removido.");
      queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
