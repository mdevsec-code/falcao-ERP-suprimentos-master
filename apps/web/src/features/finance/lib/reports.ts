import type { PayableDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { API_ORIGIN } from '@/config/env';
import {
  PAYABLE_SOURCE_LABELS,
  PAYABLE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/constants/enums';
import { formatDateOnly } from '@/utils/format';
import { describeFilters, type ReportDefinition } from '@/utils/export/report';
import type { PayableFilters } from '../types';

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

const situation = (p: PayableDto) =>
  p.vencida ? t('finance:table.overdue') : PAYABLE_STATUS_LABELS[p.status];

/** Filtros da tela, como linha de contexto no topo do relatório. */
export function payableFiltersMeta(filters: PayableFilters, search?: string): string[] {
  const period =
    filters.from || filters.to
      ? `${formatDateOnly(filters.from ?? null) ?? '…'} – ${formatDateOnly(filters.to ?? null) ?? '…'}`
      : null;
  return describeFilters([
    [t('finance:filters.search.label'), search],
    [t('finance:filters.status'), filters.status && PAYABLE_STATUS_LABELS[filters.status]],
    [t('finance:filters.source'), filters.origem && PAYABLE_SOURCE_LABELS[filters.origem]],
    [t('finance:filters.costCenter'), filters.costCenter],
    [t('finance:export.due'), period],
    [null, filters.vencidas && t('finance:filters.overdueOnly')],
    [null, filters.semNota && t('finance:filters.noInvoiceOnly')],
  ]);
}

/** Contas a pagar do filtro atual. */
export function payablesReport(
  rows: readonly PayableDto[],
  meta: string[],
): ReportDefinition<PayableDto> {
  return {
    title: t('finance:reports.payablesTitle'),
    subtitle: t('finance:page.eyebrow'),
    meta,
    fileBase: t('finance:reports.payablesFile'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('finance:export.due'), value: (p) => p.vencimento, type: 'date', width: 12 },
      { header: t('finance:export.description'), value: (p) => p.descricao, width: 36 },
      {
        header: t('finance:export.source'),
        value: (p) => PAYABLE_SOURCE_LABELS[p.origem],
        width: 12,
      },
      { header: t('finance:export.supplier'), value: (p) => p.supplierName, width: 26 },
      { header: t('finance:export.costCenter'), value: (p) => p.costCenter, width: 16 },
      { header: t('finance:export.invoice'), value: (p) => p.notaFiscal, width: 12 },
      { header: t('finance:export.amount'), value: (p) => p.valor, type: 'money', total: true },
      { header: t('finance:export.status'), value: situation, width: 12 },
      { header: t('finance:export.paidOn'), value: (p) => p.pagoEm, type: 'date', width: 12 },
      {
        header: t('finance:export.paidAmount'),
        value: (p) => p.valorPago,
        type: 'money',
        total: true,
      },
      {
        header: t('finance:export.method'),
        value: (p) => (p.formaPagamento ? PAYMENT_METHOD_LABELS[p.formaPagamento] : null),
        width: 14,
      },
    ],
  };
}

/** Notas fiscais (contas com NF informada), com links para o PDF e o XML anexados. */
export function invoicesReport(
  rows: readonly PayableDto[],
  meta: string[],
): ReportDefinition<PayableDto> {
  const fileLink = (url: string | null) => (url ? `${API_ORIGIN}${url}` : null);
  return {
    title: t('finance:invoiceExport.sheet'),
    subtitle: t('finance:page.eyebrow'),
    meta,
    fileBase: t('finance:reports.invoicesFile'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('finance:invoiceExport.number'), value: (p) => p.notaFiscal, width: 12 },
      {
        header: t('finance:invoiceExport.issuedAt'),
        value: (p) => p.notaFiscalEmissao,
        type: 'date',
        width: 12,
      },
      { header: t('finance:invoiceExport.supplier'), value: (p) => p.supplierName, width: 26 },
      { header: t('finance:invoiceExport.description'), value: (p) => p.descricao, width: 32 },
      { header: t('finance:invoiceExport.costCenter'), value: (p) => p.costCenter, width: 14 },
      {
        header: t('finance:invoiceExport.amount'),
        value: (p) => p.valor,
        type: 'money',
        total: true,
      },
      {
        header: t('finance:invoiceExport.due'),
        value: (p) => p.vencimento,
        type: 'date',
        width: 12,
      },
      { header: t('finance:invoiceExport.status'), value: situation, width: 12 },
      {
        header: t('finance:invoiceExport.paidOn'),
        value: (p) => p.pagoEm,
        type: 'date',
        width: 12,
      },
      { header: t('finance:invoiceExport.key'), value: (p) => p.notaFiscalChave, width: 48 },
      {
        header: t('finance:invoiceExport.pdf'),
        value: (p) => (p.notaFiscalPdfUrl ? t('finance:invoiceExport.open') : null),
        link: (p) => fileLink(p.notaFiscalPdfUrl),
        width: 10,
      },
      {
        header: t('finance:invoiceExport.xml'),
        value: (p) => (p.notaFiscalXmlUrl ? t('finance:invoiceExport.open') : null),
        link: (p) => fileLink(p.notaFiscalXmlUrl),
        width: 10,
      },
    ],
  };
}
