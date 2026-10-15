import type { ContractSummaryDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { CONTRACT_STATUS_LABELS, DEADLINE_STATE_LABELS } from '@/constants/enums';
import type { ReportDefinition } from '@/utils/export/report';

const t = (key: string) => i18n.t(key);

/** Contratos do filtro atual, com vigência e prazo — relatório padrão. */
export function contractsReport(
  rows: readonly ContractSummaryDto[],
  meta: string[],
): ReportDefinition<ContractSummaryDto> {
  return {
    title: t('contracts:page.title'),
    subtitle: t('contracts:page.eyebrow'),
    meta,
    fileBase: t('contracts:report.fileBase'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('contracts:report.number'), value: (c) => c.numero, width: 14 },
      { header: t('contracts:report.object'), value: (c) => c.objeto, width: 36 },
      { header: t('contracts:report.supplier'), value: (c) => c.supplierName, width: 24 },
      { header: t('contracts:report.costCenter'), value: (c) => c.costCenter, width: 16 },
      {
        header: t('contracts:report.value'),
        value: (c) => c.valorTotal,
        type: 'money',
        total: true,
      },
      { header: t('contracts:report.start'), value: (c) => c.dataInicio, type: 'date' },
      { header: t('contracts:report.end'), value: (c) => c.dataFim, type: 'date' },
      {
        header: t('contracts:report.status'),
        value: (c) => CONTRACT_STATUS_LABELS[c.status],
        width: 12,
      },
      {
        header: t('contracts:report.deadline'),
        value: (c) => (c.prazo ? DEADLINE_STATE_LABELS[c.prazo] : null),
        width: 14,
      },
      {
        header: t('contracts:report.amendments'),
        value: (c) => c.amendmentCount,
        type: 'integer',
        width: 10,
      },
    ],
  };
}
