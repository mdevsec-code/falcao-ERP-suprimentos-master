import type { SupplierSummaryDto } from '@falcao-erp/shared-types';

import { fileT, xlabel, xt } from '@/utils/export/language';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { formatCNPJ } from '@/utils/format';
import type { ReportDefinition } from '@/utils/export/report';

const t = (key: string) => xt(key);

/** Fornecedores do filtro atual, no relatório padrão (PDF, Excel ou CSV). */
export function suppliersReport(
  rows: readonly SupplierSummaryDto[],
  meta: string[],
): ReportDefinition<SupplierSummaryDto> {
  return {
    title: t('suppliers:page.title'),
    subtitle: t('suppliers:page.eyebrow'),
    meta,
    fileBase: fileT('suppliers:report.fileBase'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('suppliers:report.razaoSocial'), value: (s) => s.razaoSocial, width: 34 },
      { header: t('suppliers:report.nomeFantasia'), value: (s) => s.nomeFantasia, width: 26 },
      { header: t('suppliers:report.cnpj'), value: (s) => formatCNPJ(s.cnpj), width: 20 },
      {
        header: t('suppliers:report.categoria'),
        value: (s) => xlabel(SUPPLIER_CATEGORY_LABELS, s.categoria),
        width: 22,
      },
      { header: t('suppliers:report.cidade'), value: (s) => `${s.cidade}/${s.estado}`, width: 20 },
      {
        header: t('suppliers:report.situacao'),
        value: (s) =>
          s.cadastroPendente
            ? t('suppliers:registration.pendingBadge')
            : s.isActive
              ? t('common:status.active')
              : t('common:status.inactive'),
        width: 16,
      },
      {
        header: t('suppliers:report.nota'),
        value: (s) => s.averageScore,
        type: 'number',
        width: 10,
      },
      {
        header: t('suppliers:report.desde'),
        value: (s) => s.createdAt,
        type: 'dateTime',
        width: 16,
      },
    ],
  };
}
