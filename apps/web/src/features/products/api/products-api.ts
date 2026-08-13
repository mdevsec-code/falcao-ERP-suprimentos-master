import type {
  PaginatedResult,
  ProductDetailDto,
  ProductPriceEntryDto,
  ProductStatsDto,
  ProductSummaryDto,
} from "@falcao-erp/shared-types";
import { apiClient } from "@/api/client";

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoria?: string;
  primarySupplierId?: string;
  isActive?: boolean;
}

export interface ProductFormInput {
  codigo: string;
  nome: string;
  categoria: string;
  marca?: string;
  unidade: string;
  leadTimeDays?: number;
  observacoes?: string;
  primarySupplierId?: string;
  alternativeSupplierIds?: string[];
  initialPrice?: number;
}

export const productsApi = {
  list: (params: ProductListParams) =>
    apiClient.get<PaginatedResult<ProductSummaryDto>>("/products", { params }).then((res) => res.data),

  stats: () => apiClient.get<ProductStatsDto>("/products/stats").then((res) => res.data),

  getById: (id: string) => apiClient.get<ProductDetailDto>(`/products/${id}`).then((res) => res.data),

  create: (data: ProductFormInput) =>
    apiClient.post<ProductDetailDto>("/products", data).then((res) => res.data),

  update: (id: string, data: Partial<ProductFormInput>) =>
    apiClient.patch<ProductDetailDto>(`/products/${id}`, data).then((res) => res.data),

  deactivate: (id: string) => apiClient.delete<ProductDetailDto>(`/products/${id}`).then((res) => res.data),

  reactivate: (id: string) =>
    apiClient.patch<ProductDetailDto>(`/products/${id}/reactivate`).then((res) => res.data),

  addPriceEntry: (id: string, price: number, supplierId?: string) =>
    apiClient
      .post<ProductPriceEntryDto>(`/products/${id}/price-entries`, { price, supplierId })
      .then((res) => res.data),
};
