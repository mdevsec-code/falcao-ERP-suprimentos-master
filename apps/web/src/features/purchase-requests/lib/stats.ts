import type { PurchaseRequestStatsDto, PurchaseRequestStatus } from '@falcao-erp/shared-types';

const IN_PROGRESS: PurchaseRequestStatus[] = [
  'EM_COMPRAS',
  'EM_COTACAO',
  'PEDIDO_REALIZADO',
  'AGUARDANDO_RECEBIMENTO',
];

export function countByStatus(
  stats: PurchaseRequestStatsDto | undefined,
  statuses: readonly PurchaseRequestStatus[],
): number {
  if (!stats) return 0;
  return stats.byStatus
    .filter((row) => statuses.includes(row.status))
    .reduce((sum, row) => sum + row.count, 0);
}

/** Resumo para os KPIs: aguardando aprovação, em andamento, finalizadas e rejeitadas. */
export function summarizeStats(stats: PurchaseRequestStatsDto | undefined) {
  return {
    total: stats?.total ?? 0,
    awaitingApproval: countByStatus(stats, ['AGUARDANDO_APROVACAO']),
    inProgress: countByStatus(stats, IN_PROGRESS),
    finished: countByStatus(stats, ['FINALIZADO']),
    rejected: countByStatus(stats, ['REJEITADO']),
    pendingMyApproval: stats?.pendingMyApproval ?? 0,
  };
}
