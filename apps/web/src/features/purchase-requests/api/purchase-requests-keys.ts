import type { PurchaseRequestListParams } from "./purchase-requests-api";

export const purchaseRequestsKeys = {
  all: ["purchase-requests"] as const,
  lists: () => [...purchaseRequestsKeys.all, "list"] as const,
  list: (params: PurchaseRequestListParams) => [...purchaseRequestsKeys.lists(), params] as const,
  details: () => [...purchaseRequestsKeys.all, "detail"] as const,
  detail: (id: string) => [...purchaseRequestsKeys.details(), id] as const,
  timeline: (id: string) => [...purchaseRequestsKeys.details(), id, "timeline"] as const,
  stats: () => [...purchaseRequestsKeys.all, "stats"] as const,
};
