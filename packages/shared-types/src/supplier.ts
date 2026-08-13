import type { BrazilianState, ContactType, SupplierCategory, SupplierDocumentCategory } from "./enums";

export interface SupplierContactDto {
  id: string;
  type: ContactType;
  label: string;
  value: string;
}

export interface SupplierEvaluationDto {
  id: string;
  score: number;
  comment: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface SupplierDocumentDto {
  id: string;
  fileName: string;
  category: SupplierDocumentCategory;
  mimeType: string;
  size: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  url: string;
}

export interface SupplierSummaryDto {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  categoria: SupplierCategory;
  cidade: string;
  estado: BrazilianState;
  isActive: boolean;
  averageScore: number | null;
  createdAt: string;
}

export interface SupplierDetailDto extends SupplierSummaryDto {
  inscricaoEstadual: string | null;
  responsavel: string;
  updatedAt: string;
  contacts: SupplierContactDto[];
  evaluations: SupplierEvaluationDto[];
  documents: SupplierDocumentDto[];
}

export interface SupplierStatsDto {
  total: number;
  active: number;
  byCategory: Array<{ categoria: SupplierCategory; count: number }>;
  byState: Array<{ estado: BrazilianState; count: number }>;
}
