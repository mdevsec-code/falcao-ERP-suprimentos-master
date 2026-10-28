import { describe, expect, it } from 'vitest';

import { PERMISSIONS, ROLE_PERMISSIONS } from '../permissions';
import { ROLES } from '../roles';

describe('permissões por perfil', () => {
  it('auditor só consulta: não avalia fornecedor (a API também recusa)', () => {
    expect(ROLE_PERMISSIONS[ROLES.AUDITOR]).not.toContain(PERMISSIONS.SUPPLIER_EVALUATE);
  });

  it('quem trabalha com fornecedores avalia', () => {
    for (const role of [
      ROLES.ADMIN,
      ROLES.MANAGER,
      ROLES.BUYER,
      ROLES.FINANCE,
      ROLES.WAREHOUSE,
      ROLES.REQUESTER,
    ]) {
      expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.SUPPLIER_EVALUATE);
    }
  });
});
