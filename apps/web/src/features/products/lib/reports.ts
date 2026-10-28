import type { ProductSummaryDto } from '@falcao-erp/shared-types';

import { fileT, xlabel, xt } from '@/utils/export/language';
import { PRODUCT_CATEGORY_LABELS } from '@/constants/enums';
import type { ReportDefinition } from '@/utils/export/report';

const t = (key: string) => xt(key);

/** Produtos do filtro atual, com o último preço pago — relatório padrão. */
export function productsReport(
  rows: readonly ProductSummaryDto[],
  meta: string[],
): ReportDefinition<ProductSummaryDto> {
  return {
    title: t('products:page.title'),
    subtitle: t('products:page.eyebrow'),
    meta,
    fileBase: fileT('products:report.fileBase'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('products:report.code'), value: (p) => p.codigo, width: 12 },
      { header: t('products:report.name'), value: (p) => p.nome, width: 36 },
      {
        header: t('products:report.category'),
        value: (p) => xlabel(PRODUCT_CATEGORY_LABELS, p.categoria),
        width: 18,
      },
      { header: t('products:report.discipline'), value: (p) => p.discipline?.nome, width: 16 },
      {
        header: t('products:report.brand'),
        value: (p) => [p.marca, p.referencia].filter(Boolean).join(' · ') || null,
        width: 22,
      },
      { header: t('products:report.unit'), value: (p) => p.unidade, width: 8 },
      {
        header: t('products:report.supplier'),
        value: (p) => p.primarySupplier?.nomeFantasia,
        width: 22,
      },
      { header: t('products:report.lastPrice'), value: (p) => p.lastPrice, type: 'money' },
      { header: t('products:report.lastPriceAt'), value: (p) => p.lastPriceAt, type: 'dateTime' },
      { header: t('products:report.lastSupplier'), value: (p) => p.lastSupplierName, width: 22 },
    ],
  };
}
