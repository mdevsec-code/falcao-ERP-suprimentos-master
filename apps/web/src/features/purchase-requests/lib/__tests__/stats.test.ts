import { describe, expect, it } from 'vitest';
import type { PurchaseRequestStatsDto } from '@falcao-erp/shared-types';
import { countByStatus, summarizeStats } from '../stats';

const stats: PurchaseRequestStatsDto = {
  total: 10,
  pendingMyApproval: 2,
  byStatus: [
    { status: 'AGUARDANDO_APROVACAO', count: 3 },
    { status: 'EM_COMPRAS', count: 1 },
    { status: 'EM_COTACAO', count: 2 },
    { status: 'AGUARDANDO_RECEBIMENTO', count: 1 },
    { status: 'FINALIZADO', count: 2 },
    { status: 'REJEITADO', count: 1 },
  ],
};

describe('purchase request stats', () => {
  it('soma as contagens dos status pedidos', () => {
    expect(countByStatus(stats, ['EM_COMPRAS', 'EM_COTACAO'])).toBe(3);
    expect(countByStatus(stats, ['PEDIDO_REALIZADO'])).toBe(0);
  });

  it('resume os KPIs da tela', () => {
    expect(summarizeStats(stats)).toEqual({
      total: 10,
      awaitingApproval: 3,
      inProgress: 4,
      finished: 2,
      rejected: 1,
      pendingMyApproval: 2,
    });
  });

  it('tolera stats ainda não carregados', () => {
    expect(summarizeStats(undefined).total).toBe(0);
    expect(countByStatus(undefined, ['FINALIZADO'])).toBe(0);
  });
});
