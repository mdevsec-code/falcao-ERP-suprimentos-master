import type { QuotationDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { QUOTATION_STATUS_LABELS, QUOTATION_SUPPLIER_STATUS_LABELS } from '@/constants/enums';
import { downloadBlob } from '@/utils/csv';
import { formatDateOnly } from '@/utils/format';

const BRL = '"R$" #,##0.00';
const GOLD = 'FFF6E7C1';
const BEST = 'FFDCF3E4';
const HEADER = 'FF1F2937';

const n = (value: string | null | undefined) =>
  value === null || value === undefined ? null : Number(value);

/**
 * Mapa de cotação em Excel: itens nas linhas, fornecedores lado a lado nas
 * colunas, menor preço destacado e o vencedor de cada item marcado.
 * O `exceljs` só é carregado quando alguém exporta.
 */
export async function exportQuotationMap(quotation: QuotationDetailDto): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const t = (key: string, options?: Record<string, unknown>) =>
    i18n.t(`quotations:export.${key}`, options);

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(t('sheet'), {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 6 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const suppliers = quotation.suppliers;
  const fixedCols = 6;
  const lastCol = fixedCols + suppliers.length * 2 + 2;

  sheet.mergeCells(1, 1, 1, lastCol);
  sheet.getCell(1, 1).value = t('title', { numero: quotation.numero, titulo: quotation.titulo });
  sheet.getCell(1, 1).font = { bold: true, size: 14 };
  sheet.getCell(2, 1).value = t('request', { title: quotation.purchaseRequest.title });
  sheet.getCell(3, 1).value = t('meta', {
    status: QUOTATION_STATUS_LABELS[quotation.status],
    prazo: formatDateOnly(quotation.prazoResposta),
    centro: quotation.purchaseRequest.costCenter ?? '—',
  });
  sheet.getCell(4, 1).value = t('generatedAt', { date: new Date().toLocaleString(i18n.language) });
  sheet.getCell(4, 1).font = { italic: true, color: { argb: 'FF6B7280' } };

  // Cabeçalho em duas linhas: nome do fornecedor sobre "Unitário | Total".
  const headerTop = 5;
  const headerBottom = 6;
  const fixedHeaders = [
    t('col.item'),
    t('col.description'),
    t('col.quantity'),
    t('col.unit'),
    t('col.requested'),
    t('col.lastPrice'),
  ];
  fixedHeaders.forEach((label, index) => {
    sheet.mergeCells(headerTop, index + 1, headerBottom, index + 1);
    sheet.getCell(headerTop, index + 1).value = label;
  });
  suppliers.forEach((supplier, index) => {
    const col = fixedCols + 1 + index * 2;
    sheet.mergeCells(headerTop, col, headerTop, col + 1);
    sheet.getCell(headerTop, col).value = supplier.supplierName;
    sheet.getCell(headerBottom, col).value = t('col.unitPrice');
    sheet.getCell(headerBottom, col + 1).value = t('col.total');
  });
  const bestCol = fixedCols + suppliers.length * 2 + 1;
  sheet.mergeCells(headerTop, bestCol, headerBottom, bestCol);
  sheet.getCell(headerTop, bestCol).value = t('col.best');
  sheet.mergeCells(headerTop, bestCol + 1, headerBottom, bestCol + 1);
  sheet.getCell(headerTop, bestCol + 1).value = t('col.winner');

  for (let row = headerTop; row <= headerBottom; row += 1) {
    for (let col = 1; col <= lastCol; col += 1) {
      const cell = sheet.getCell(row, col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }
  }

  const priceOf = (supplierId: string, itemId: string) =>
    quotation.prices.find(
      (p) => p.quotationSupplierId === supplierId && p.quotationItemId === itemId,
    );

  quotation.items.forEach((item, index) => {
    const analysis = quotation.analysis.items.find((a) => a.itemId === item.id);
    const winner = suppliers.find((s) => s.id === item.vencedorId);
    const requested = [item.marca, item.referencia].filter(Boolean).join(' · ');
    const values: (string | number | null)[] = [
      index + 1,
      item.descricao,
      Number(item.quantidade),
      item.unidade,
      requested || null,
      n(item.ultimoPreco),
    ];
    suppliers.forEach((supplier) => {
      const price = priceOf(supplier.id, item.id);
      const unit = price?.disponivel ? n(price.precoUnitario) : null;
      values.push(
        unit,
        unit === null
          ? price && !price.disponivel
            ? t('unavailable')
            : null
          : unit * Number(item.quantidade),
      );
    });
    values.push(n(analysis?.menorPreco), winner?.supplierName ?? null);
    const row = sheet.addRow(values);

    row.getCell(6).numFmt = BRL;
    suppliers.forEach((supplier, sIndex) => {
      const col = fixedCols + 1 + sIndex * 2;
      row.getCell(col).numFmt = BRL;
      row.getCell(col + 1).numFmt = BRL;
      if (analysis?.melhorFornecedorIds.includes(supplier.id)) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BEST } };
      }
      if (supplier.id === item.vencedorId) {
        row.getCell(col).font = { bold: true };
        row.getCell(col + 1).font = { bold: true };
        row.getCell(col + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
      }
    });
    row.getCell(bestCol).numFmt = BRL;
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  });

  // Resumo por fornecedor: frete, total, prazo, condição, validade e ranking.
  sheet.addRow([]);
  const summaryRows: Array<[string, (index: number) => string | number | null, boolean?]> = [
    [t('summary.freight'), (i) => n(suppliers[i]?.frete), true],
    [
      t('summary.total'),
      (i) =>
        n(
          quotation.analysis.suppliers.find((s) => s.quotationSupplierId === suppliers[i]?.id)
            ?.total,
        ),
      true,
    ],
    [
      t('summary.ranking'),
      (i) =>
        quotation.analysis.suppliers.find((s) => s.quotationSupplierId === suppliers[i]?.id)
          ?.ranking ?? null,
    ],
    [
      t('summary.delivery'),
      (i) =>
        (suppliers[i]?.prazoEntregaDias ?? null) === null
          ? null
          : t('days', { count: suppliers[i]?.prazoEntregaDias ?? 0 }),
    ],
    [t('summary.payment'), (i) => suppliers[i]?.condicaoPagamento ?? null],
    [t('summary.validity'), (i) => formatDateOnly(suppliers[i]?.validadeProposta ?? null)],
    [
      t('summary.status'),
      (i) => (suppliers[i] ? QUOTATION_SUPPLIER_STATUS_LABELS[suppliers[i].status] : null),
    ],
  ];
  for (const [label, valueAt, money] of summaryRows) {
    const values: (string | number | null)[] = [null, label, null, null, null, null];
    suppliers.forEach((_, index) => values.push(null, valueAt(index)));
    const row = sheet.addRow(values);
    row.getCell(2).font = { bold: true };
    if (money) {
      suppliers.forEach((_, index) => {
        row.getCell(fixedCols + 2 + index * 2).numFmt = BRL;
      });
    }
  }

  sheet.addRow([]);
  const totals = sheet.addRow([null, t('summary.bestTotal'), null, null, null, null]);
  totals.getCell(bestCol).value = n(quotation.analysis.totalMelhorPreco);
  totals.getCell(bestCol).numFmt = BRL;
  totals.font = { bold: true };
  if (quotation.analysis.totalVencedores !== null) {
    const winners = sheet.addRow([null, t('summary.winnersTotal'), null, null, null, null]);
    winners.getCell(bestCol).value = n(quotation.analysis.totalVencedores);
    winners.getCell(bestCol).numFmt = BRL;
    winners.font = { bold: true };
  }
  if (quotation.analysis.economiaVsUltimo !== null) {
    const savings = sheet.addRow([null, t('summary.savings'), null, null, null, null]);
    savings.getCell(bestCol).value = n(quotation.analysis.economiaVsUltimo);
    savings.getCell(bestCol).numFmt = BRL;
  }

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 42;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 8;
  sheet.getColumn(5).width = 22;
  sheet.getColumn(6).width = 14;
  for (let col = fixedCols + 1; col <= lastCol; col += 1) sheet.getColumn(col).width = 15;
  sheet.getColumn(lastCol).width = 22;

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${t('fileName', { numero: quotation.numero })}.xlsx`,
  );
}
