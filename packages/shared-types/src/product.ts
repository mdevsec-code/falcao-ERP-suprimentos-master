import type { ProductCategory, UnitOfMeasure } from "./enums";

export interface ProductSupplierRefDto {
  id: string;
  nomeFantasia: string;
}

export interface ProductPriceEntryDto {
  id: string;
  price: string;
  supplierId: string | null;
  supplierName: string | null;
  recordedAt: string;
}

export interface ProductSummaryDto {
  id: string;
  codigo: string;
  nome: string;
  categoria: ProductCategory;
  marca: string | null;
  unidade: UnitOfMeasure;
  leadTimeDays: number | null;
  isActive: boolean;
  primarySupplier: ProductSupplierRefDto | null;
  lastPrice: string | null;
  createdAt: string;
}

export interface ProductDetailDto extends ProductSummaryDto {
  observacoes: string | null;
  updatedAt: string;
  alternativeSuppliers: ProductSupplierRefDto[];
  priceHistory: ProductPriceEntryDto[];
}

export interface ProductStatsDto {
  total: number;
  active: number;
  byCategory: Array<{ categoria: ProductCategory; count: number }>;
}
