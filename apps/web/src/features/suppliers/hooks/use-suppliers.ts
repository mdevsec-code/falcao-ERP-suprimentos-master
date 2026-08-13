import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { suppliersApi, type SupplierListParams } from "../api/suppliers-api";
import { suppliersKeys } from "../api/suppliers-keys";

export function useSuppliers(params: SupplierListParams) {
  return useQuery({
    queryKey: suppliersKeys.list(params),
    queryFn: () => suppliersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSupplierStats() {
  return useQuery({
    queryKey: suppliersKeys.stats(),
    queryFn: () => suppliersApi.stats(),
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: suppliersKeys.detail(id ?? ""),
    queryFn: () => suppliersApi.getById(id as string),
    enabled: !!id,
  });
}
