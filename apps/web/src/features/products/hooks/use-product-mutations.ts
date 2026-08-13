import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client";
import { productsApi, type ProductFormInput } from "../api/products-api";
import { productsKeys } from "../api/products-keys";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductFormInput) => productsApi.create(data),
    onSuccess: () => {
      toast.success("Produto cadastrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível cadastrar o produto.")),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductFormInput>) => productsApi.update(id, data),
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Não foi possível atualizar o produto.")),
  });
}

export function useSetProductActive(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) =>
      isActive ? productsApi.reactivate(id) : productsApi.deactivate(id),
    onSuccess: (_, isActive) => {
      toast.success(isActive ? "Produto reativado." : "Produto desativado.");
      queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useAddPriceEntry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ price, supplierId }: { price: number; supplierId?: string }) =>
      productsApi.addPriceEntry(id, price, supplierId),
    onSuccess: () => {
      toast.success("Preço registrado.");
      queryClient.invalidateQueries({ queryKey: productsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
