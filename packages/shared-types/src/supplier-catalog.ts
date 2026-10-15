import type { SupplierCatalogItemStatus, SupplierCatalogStatus } from "./enums";

export interface SupplierCatalogItemDto {
  id: string;
  codigoFornecedor: string | null;
  descricao: string;
  unidade: string;
  marca: string | null;
  referencia: string | null;
  preco: string | null;
  observacao: string | null;
  status: SupplierCatalogItemStatus;
  productId: string | null;
  productCodigo: string | null;
  productNome: string | null;
  /** Produto do catálogo vivo que parece ser o mesmo (referência ou nome) — só sugestão. */
  sugestao: { productId: string; codigo: string; nome: string } | null;
}

export interface SupplierCatalogSummaryDto {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
  cadastroPendente: boolean;
  status: SupplierCatalogStatus;
  enviadoPor: string;
  itens: number;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: string;
}

export interface SupplierCatalogDetailDto extends SupplierCatalogSummaryDto {
  observacoes: string | null;
  revisadoPorName: string | null;
  revisadoEm: string | null;
  motivoRecusa: string | null;
  items: SupplierCatalogItemDto[];
}

/** Página pública do link de catálogo. */
export interface PublicCatalogLinkDto {
  empresa: string;
}

export interface PublicCatalogSubmitResultDto {
  fornecedor: string;
  itens: number;
  cadastroPendente: boolean;
}

/** Colunas da planilha modelo de catálogo — a mesma ordem no download e na leitura. */
export const CATALOG_TEMPLATE_COLUMNS = [
  "codigoFornecedor",
  "descricao",
  "unidade",
  "marca",
  "referencia",
  "preco",
  "observacao",
] as const;
export type CatalogTemplateColumn = (typeof CATALOG_TEMPLATE_COLUMNS)[number];

/** Limite de itens por envio de catálogo. */
export const MAX_CATALOG_ITEMS = 2000;
