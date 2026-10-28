import type { QuotationSummaryDto } from '@falcao-erp/shared-types';

import { fileT, xlabel, xt } from '@/utils/export/language';
import { QUOTATION_STATUS_LABELS } from '@/constants/enums';
import type { ReportDefinition } from '@/utils/export/report';

const t = (key: string, options?: Record<string, unknown>) => xt(key, options);

/** Cotações do filtro atual — relatório padrão. */
export function quotationsReport(
  rows: readonly QuotationSummaryDto[],
  meta: string[],
): ReportDefinition<QuotationSummaryDto> {
  return {
    title: t('quotations:page.title'),
    subtitle: t('quotations:page.eyebrow'),
    meta,
    fileBase: fileT('quotations:report.fileBase'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('quotations:table.number'), value: (q) => q.numero, type: 'integer', width: 8 },
      { header: t('quotations:table.title'), value: (q) => q.titulo, width: 36 },
      {
        header: t('quotations:report.origin'),
        value: (q) =>
          q.plan ? t('quotations:table.plan', { numero: q.plan.numero }) : q.purchaseRequestTitle,
        width: 30,
      },
      {
        header: t('quotations:table.status'),
        value: (q) => xlabel(QUOTATION_STATUS_LABELS, q.status),
        width: 12,
      },
      { header: t('quotations:table.deadline'), value: (q) => q.prazoResposta, type: 'date' },
      {
        header: t('quotations:table.answers'),
        value: (q) => `${q.respondidos}/${q.convidados}`,
        width: 10,
      },
      { header: t('quotations:table.items'), value: (q) => q.itens, type: 'integer', width: 8 },
      { header: t('quotations:report.createdBy'), value: (q) => q.createdByName, width: 20 },
      { header: t('quotations:report.createdAt'), value: (q) => q.createdAt, type: 'dateTime' },
    ],
  };
}
