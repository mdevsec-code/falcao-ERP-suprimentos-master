import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { productsApi, type ProductListParams } from "../api/products-api";
import { productsKeys } from "../api/products-keys";

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: productsKeys.stats(),
    queryFn: () => productsApi.stats(),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productsKeys.detail(id ?? ""),
    queryFn: () => productsApi.getById(id as string),
    enabled: !!id,
  });
}
