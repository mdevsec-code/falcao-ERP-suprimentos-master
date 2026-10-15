import type { PriceEntrySource, ProductCategory, UnitOfMeasure } from "./enums";

export interface ProductDisciplineRefDto {
  id: string;
  nome: string;
}

export interface ProductSupplierRefDto {
  id: string;
  nomeFantasia: string;
}

export interface ProductPriceEntryDto {
  id: string;
  price: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: string | null;
  marca: string | null;
  referencia: string | null;
  origem: PriceEntrySource;
  quotationId: string | null;
  quotationNumero: number | null;
  recordedAt: string;
}

export interface ProductSummaryDto {
  id: string;
  codigo: string;
  nome: string;
  categoria: ProductCategory;
  marca: string | null;
  referencia: string | null;
  discipline: ProductDisciplineRefDto | null;
  unidade: UnitOfMeasure;
  leadTimeDays: number | null;
  isActive: boolean;
  /** Foto do produto (`/uploads/…`). */
  photoUrl: string | null;
  primarySupplier: ProductSupplierRefDto | null;
  lastPrice: string | null;
  /** Quantidade, data e fornecedor do último preço registrado. */
  lastQuantity: string | null;
  lastPriceAt: string | null;
  lastSupplierName: string | null;
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
  byDiscipline: Array<{ disciplineId: string | null; nome: string | null; count: number }>;
}
