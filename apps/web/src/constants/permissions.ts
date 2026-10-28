import { ROLES, type Role } from './roles';

/**
 * Permissões do frontend. Espelham os `@Roles(...)` dos controllers da API
 * (`apps/api/src/modules/*`) — a API continua sendo a autoridade; aqui só
 * decidimos o que mostrar, para não oferecer ações que voltariam 403.
 */
export const PERMISSIONS = {
  SUPPLIER_READ: 'supplier:read',
  SUPPLIER_WRITE: 'supplier:write',
  SUPPLIER_EVALUATE: 'supplier:evaluate',
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  PURCHASE_REQUEST_READ: 'purchase-request:read',
  PURCHASE_REQUEST_WRITE: 'purchase-request:write',
  APPROVALS_READ: 'approvals:read',
  QUOTATION_READ: 'quotation:read',
  QUOTATION_WRITE: 'quotation:write',
  DISCIPLINE_WRITE: 'discipline:write',
  CONTRACT_READ: 'contract:read',
  CONTRACT_WRITE: 'contract:write',
  FINANCE_READ: 'finance:read',
  FINANCE_WRITE: 'finance:write',
  REIMBURSEMENT_REQUEST: 'reimbursement:request',
  REIMBURSEMENT_DECIDE: 'reimbursement:decide',
  REIMBURSEMENT_VIEW_ALL: 'reimbursement:view-all',
  DOCUMENT_WRITE: 'document:write',
  DOCUMENT_MANAGE: 'document:manage',
  AGENDA_WRITE: 'agenda:write',
  AGENDA_MANAGE: 'agenda:manage',
  USERS_MANAGE: 'users:manage',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

const READ_ONLY: Permission[] = [
  PERMISSIONS.SUPPLIER_READ,
  PERMISSIONS.PRODUCT_READ,
  PERMISSIONS.PURCHASE_REQUEST_READ,
];

/** Todo mundo que trabalha (não só consulta): pede reembolso, usa a agenda e avalia fornecedor. */
const COLLABORATOR: Permission[] = [
  PERMISSIONS.REIMBURSEMENT_REQUEST,
  PERMISSIONS.AGENDA_WRITE,
  PERMISSIONS.SUPPLIER_EVALUATE,
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLES.ADMIN]: [...ALL_PERMISSIONS],

  [ROLES.MANAGER]: [
    ...READ_ONLY,
    ...COLLABORATOR,
    PERMISSIONS.SUPPLIER_WRITE,
    PERMISSIONS.PRODUCT_WRITE,
    PERMISSIONS.PURCHASE_REQUEST_WRITE,
    PERMISSIONS.APPROVALS_READ,
    PERMISSIONS.QUOTATION_READ,
    PERMISSIONS.QUOTATION_WRITE,
    PERMISSIONS.DISCIPLINE_WRITE,
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.CONTRACT_WRITE,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.REIMBURSEMENT_DECIDE,
    PERMISSIONS.REIMBURSEMENT_VIEW_ALL,
    PERMISSIONS.DOCUMENT_WRITE,
    PERMISSIONS.DOCUMENT_MANAGE,
    PERMISSIONS.AGENDA_MANAGE,
  ],

  [ROLES.BUYER]: [
    ...READ_ONLY,
    ...COLLABORATOR,
    PERMISSIONS.SUPPLIER_WRITE,
    PERMISSIONS.PRODUCT_WRITE,
    PERMISSIONS.PURCHASE_REQUEST_WRITE,
    PERMISSIONS.APPROVALS_READ,
    PERMISSIONS.QUOTATION_READ,
    PERMISSIONS.QUOTATION_WRITE,
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.CONTRACT_WRITE,
    PERMISSIONS.DOCUMENT_WRITE,
  ],

  [ROLES.WAREHOUSE]: [
    ...READ_ONLY,
    ...COLLABORATOR,
    PERMISSIONS.PURCHASE_REQUEST_WRITE,
    PERMISSIONS.APPROVALS_READ,
    PERMISSIONS.DOCUMENT_WRITE,
  ],

  [ROLES.FINANCE]: [
    ...READ_ONLY,
    ...COLLABORATOR,
    PERMISSIONS.PURCHASE_REQUEST_WRITE,
    PERMISSIONS.QUOTATION_READ,
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.REIMBURSEMENT_VIEW_ALL,
    PERMISSIONS.DOCUMENT_WRITE,
  ],

  [ROLES.REQUESTER]: [...READ_ONLY, ...COLLABORATOR, PERMISSIONS.PURCHASE_REQUEST_WRITE],

  // Auditor: leitura de tudo (inclusive a trilha de auditoria), sem criar nem
  // movimentar nada.
  [ROLES.AUDITOR]: [
    ...READ_ONLY,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.QUOTATION_READ,
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.REIMBURSEMENT_VIEW_ALL,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
