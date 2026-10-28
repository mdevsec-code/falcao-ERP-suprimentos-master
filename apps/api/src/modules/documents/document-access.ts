import type { Prisma } from "@prisma/client";
import type { DocumentCategory, Role } from "@falcao-erp/shared-types";
import { CONTRACT_READ_ROLES } from "../../common/constants/module-roles";

/**
 * Documentos sigilosos: os ligados a um contrato e os das categorias Contrato e
 * Nota fiscal. Só os veem os perfis que consultam contratos (administrador,
 * gerência, compras, financeiro e auditoria) — a mesma regra de `/contracts`.
 * Para os demais, eles não aparecem em lista, contagens, etiquetas, agenda nem
 * pelo id (404, como se não existissem). O filtro por empresa continua valendo.
 */
export const SENSITIVE_DOCUMENT_CATEGORIES: readonly DocumentCategory[] = ["CONTRATO", "NOTA_FISCAL"];

export function canSeeSensitiveDocuments(role: Role | string): boolean {
  return CONTRACT_READ_ROLES.includes(role as Role);
}

export function isSensitiveDocument(document: {
  categoria: DocumentCategory | string;
  contractId: string | null | undefined;
}): boolean {
  return Boolean(document.contractId) || SENSITIVE_DOCUMENT_CATEGORIES.includes(document.categoria as DocumentCategory);
}

/** Condição extra das consultas de documentos para o perfil; `undefined` = vê todos. */
export function documentVisibilityWhere(role: Role | string): Prisma.DocumentWhereInput | undefined {
  if (canSeeSensitiveDocuments(role)) return undefined;
  return { contractId: null, categoria: { notIn: [...SENSITIVE_DOCUMENT_CATEGORIES] } };
}
