import type { ProductListParams } from "./products-api";

export const productsKeys = {
  all: ["products"] as const,
  lists: () => [...productsKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productsKeys.lists(), params] as const,
  details: () => [...productsKeys.all, "detail"] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
  stats: () => [...productsKeys.all, "stats"] as const,
};
