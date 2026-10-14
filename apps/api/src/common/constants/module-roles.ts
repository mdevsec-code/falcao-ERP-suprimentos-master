import type { Role } from "@falcao-erp/shared-types";

/**
 * Papéis por módulo — usados nos `@Roles(...)` dos controllers e também pela
 * Agenda, que só mostra prazos de módulos que o usuário pode consultar.
 * O Web espelha isto em `apps/web/src/constants/permissions.ts`.
 */
export const CONTRACT_READ_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "BUYER", "FINANCE", "AUDITOR"];
export const CONTRACT_WRITE_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "BUYER"];

export const FINANCE_READ_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "FINANCE", "AUDITOR"];
export const FINANCE_WRITE_ROLES: readonly Role[] = ["ADMIN", "FINANCE"];

/** Todos pedem reembolso, menos o auditor (só consulta). */
export const REIMBURSEMENT_REQUEST_ROLES: readonly Role[] = [
  "ADMIN",
  "MANAGER",
  "BUYER",
  "FINANCE",
  "WAREHOUSE",
  "REQUESTER",
];
export const REIMBURSEMENT_DECIDE_ROLES: readonly Role[] = ["ADMIN", "MANAGER"];
/** Veem os reembolsos de todos; os demais veem só os próprios. */
export const REIMBURSEMENT_VIEW_ALL_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "FINANCE", "AUDITOR"];

export const DOCUMENT_WRITE_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "BUYER", "FINANCE", "WAREHOUSE"];
/** Removem documentos enviados por outras pessoas. */
export const DOCUMENT_MANAGE_ROLES: readonly Role[] = ["ADMIN", "MANAGER"];

export const AGENDA_WRITE_ROLES: readonly Role[] = [
  "ADMIN",
  "MANAGER",
  "BUYER",
  "FINANCE",
  "WAREHOUSE",
  "REQUESTER",
];
/** Editam/removem eventos criados por outras pessoas. */
export const AGENDA_MANAGE_ROLES: readonly Role[] = ["ADMIN", "MANAGER"];

export const QUOTATION_READ_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "BUYER", "FINANCE", "AUDITOR"];
export const QUOTATION_WRITE_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "BUYER"];

/** Mantêm a lista de disciplinas (Civil, Elétrica…). */
export const DISCIPLINE_WRITE_ROLES: readonly Role[] = ["ADMIN", "MANAGER"];
/** Incluem no catálogo um item digitado à mão numa solicitação. */
export const CATALOG_WRITE_ROLES: readonly Role[] = ["ADMIN", "MANAGER", "BUYER"];
