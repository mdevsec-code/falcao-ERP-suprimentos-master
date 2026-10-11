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
  USERS_MANAGE: 'users:manage',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

const READ_ONLY: Permission[] = [
  PERMISSIONS.SUPPLIER_READ,
  PERMISSIONS.SUPPLIER_EVALUATE,
  PERMISSIONS.PRODUCT_READ,
  PERMISSIONS.PURCHASE_REQUEST_READ,
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLES.ADMIN]: [...ALL_PERMISSIONS],

  [ROLES.MANAGER]: [
    ...READ_ONLY,
    PERMISSIONS.SUPPLIER_WRITE,
    PERMISSIONS.PRODUCT_WRITE,
    PERMISSIONS.PURCHASE_REQUEST_WRITE,
    PERMISSIONS.APPROVALS_READ,
  ],

  [ROLES.BUYER]: [
    ...READ_ONLY,
    PERMISSIONS.SUPPLIER_WRITE,
    PERMISSIONS.PRODUCT_WRITE,
    PERMISSIONS.PURCHASE_REQUEST_WRITE,
    PERMISSIONS.APPROVALS_READ,
  ],

  [ROLES.WAREHOUSE]: [...READ_ONLY, PERMISSIONS.PURCHASE_REQUEST_WRITE, PERMISSIONS.APPROVALS_READ],

  [ROLES.FINANCE]: [...READ_ONLY, PERMISSIONS.PURCHASE_REQUEST_WRITE],

  [ROLES.REQUESTER]: [...READ_ONLY, PERMISSIONS.PURCHASE_REQUEST_WRITE],

  // Auditor: leitura de tudo (inclusive a trilha de auditoria), sem criar nem
  // movimentar solicitações.
  [ROLES.AUDITOR]: [...READ_ONLY, PERMISSIONS.AUDIT_READ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
