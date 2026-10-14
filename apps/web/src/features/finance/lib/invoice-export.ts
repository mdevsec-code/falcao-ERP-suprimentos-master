import type { PayableDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { API_ORIGIN } from '@/config/env';
import { PAYABLE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/constants/enums';
import { downloadBlob } from '@/utils/csv';
import { parseDateOnly } from '@/utils/format';

const BRL = '"R$" #,##0.00';

const asDate = (value: string | null) => (value ? parseDateOnly(value) : null);

/**
 * Planilha de notas fiscais (contas com NF informada): número, chave, emissão,
 * fornecedor, valores, situação e links para o PDF e o XML anexados.
 */
export async function exportInvoices(rows: readonly PayableDto[], fileName: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const t = (key: string) => i18n.t(`finance:invoiceExport.${key}`);

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(t('sheet'), { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    { header: t('number'), key: 'numero', width: 12 },
    { header: t('issuedAt'), key: 'emissao', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
    { header: t('supplier'), key: 'fornecedor', width: 28 },
    { header: t('description'), key: 'descricao', width: 36 },
    { header: t('costCenter'), key: 'centro', width: 14 },
    { header: t('amount'), key: 'valor', width: 14, style: { numFmt: BRL } },
    { header: t('due'), key: 'vencimento', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
    { header: t('status'), key: 'situacao', width: 12 },
    { header: t('paidOn'), key: 'pagoEm', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
    { header: t('paidAmount'), key: 'valorPago', width: 14, style: { numFmt: BRL } },
    { header: t('method'), key: 'forma', width: 14 },
    { header: t('key'), key: 'chave', width: 48 },
    { header: t('pdf'), key: 'pdf', width: 12 },
    { header: t('xml'), key: 'xml', width: 12 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  header.alignment = { vertical: 'middle' };

  for (const p of rows) {
    const row = sheet.addRow({
      numero: p.notaFiscal,
      emissao: asDate(p.notaFiscalEmissao),
      fornecedor: p.supplierName,
      descricao: p.descricao,
      centro: p.costCenter,
      valor: Number(p.valor),
      vencimento: asDate(p.vencimento),
      situacao: p.vencida ? i18n.t('finance:table.overdue') : PAYABLE_STATUS_LABELS[p.status],
      pagoEm: asDate(p.pagoEm),
      valorPago: p.valorPago ? Number(p.valorPago) : null,
      forma: p.formaPagamento ? PAYMENT_METHOD_LABELS[p.formaPagamento] : null,
      chave: p.notaFiscalChave,
      pdf: p.notaFiscalPdfUrl
        ? { text: t('open'), hyperlink: `${API_ORIGIN}${p.notaFiscalPdfUrl}` }
        : null,
      xml: p.notaFiscalXmlUrl
        ? { text: t('open'), hyperlink: `${API_ORIGIN}${p.notaFiscalXmlUrl}` }
        : null,
    });
    // Planilha com fórmula injetada por texto vindo de usuário é risco: tudo entra como valor puro.
    row.getCell('chave').numFmt = '@';
    for (const key of ['pdf', 'xml'] as const) {
      if (row.getCell(key).value)
        row.getCell(key).font = { color: { argb: 'FF2563EB' }, underline: true };
    }
  }

  if (rows.length > 0) {
    const total = sheet.addRow({
      descricao: t('total'),
      valor: { formula: `SUM(F2:F${rows.length + 1})` },
    });
    total.font = { bold: true };
  }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 14 } };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
