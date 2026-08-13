import type { SupplierListParams } from "./suppliers-api";

export const suppliersKeys = {
  all: ["suppliers"] as const,
  lists: () => [...suppliersKeys.all, "list"] as const,
  list: (params: SupplierListParams) => [...suppliersKeys.lists(), params] as const,
  details: () => [...suppliersKeys.all, "detail"] as const,
  detail: (id: string) => [...suppliersKeys.details(), id] as const,
  stats: () => [...suppliersKeys.all, "stats"] as const,
};
