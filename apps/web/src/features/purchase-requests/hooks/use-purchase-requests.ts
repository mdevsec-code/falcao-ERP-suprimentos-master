import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { purchaseRequestsApi, type PurchaseRequestListParams } from "../api/purchase-requests-api";
import { purchaseRequestsKeys } from "../api/purchase-requests-keys";

export function usePurchaseRequests(params: PurchaseRequestListParams) {
  return useQuery({
    queryKey: purchaseRequestsKeys.list(params),
    queryFn: () => purchaseRequestsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePurchaseRequestStats() {
  return useQuery({
    queryKey: purchaseRequestsKeys.stats(),
    queryFn: () => purchaseRequestsApi.stats(),
  });
}

export function usePurchaseRequest(id: string | undefined) {
  return useQuery({
    queryKey: purchaseRequestsKeys.detail(id ?? ""),
    queryFn: () => purchaseRequestsApi.getById(id as string),
    enabled: !!id,
  });
}

export function usePurchaseRequestTimeline(id: string | undefined) {
  return useQuery({
    queryKey: purchaseRequestsKeys.timeline(id ?? ""),
    queryFn: () => purchaseRequestsApi.getTimeline(id as string),
    enabled: !!id,
  });
}
