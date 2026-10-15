import type { QuotationDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { QUOTATION_STATUS_LABELS, QUOTATION_SUPPLIER_STATUS_LABELS } from '@/constants/enums';
import { EXPORT_COLORS, exportFileName, rgb } from '@/utils/export/brand';
import { displayValue } from '@/utils/export/report';
import { formatDateOnly } from '@/utils/format';

const n = (value: string | null | undefined) =>
  value === null || value === undefined ? null : Number(value);

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`quotations:export.${key}`, options);

/** Origem da cotação (solicitação ou plano) e linha de situação/prazo/obra — iguais no Excel e no PDF. */
function context(quotation: QuotationDetailDto) {
  const origin = quotation.purchaseRequest
    ? t('request', { title: quotation.purchaseRequest.title })
    : quotation.plan
      ? t('plan', { numero: quotation.plan.numero, titulo: quotation.plan.titulo })
      : null;
  const meta = t('meta', {
    status: QUOTATION_STATUS_LABELS[quotation.status],
    prazo: formatDateOnly(quotation.prazoResposta),
    centro: quotation.purchaseRequest?.costCenter ?? quotation.plan?.obra ?? '—',
  });
  return {
    title: t('title', { numero: quotation.numero, titulo: quotation.titulo }),
    origin,
    meta,
  };
}

function supplierSummary(quotation: QuotationDetailDto) {
  return quotation.suppliers.map((supplier) => {
    const analysis = quotation.analysis.suppliers.find(
      (s) => s.quotationSupplierId === supplier.id,
    );
    return {
      name: supplier.supplierName,
      frete: n(supplier.frete),
      total: n(analysis?.total),
      ranking: analysis?.ranking ?? null,
      prazo:
        supplier.prazoEntregaDias === null ? null : t('days', { count: supplier.prazoEntregaDias }),
      pagamento: supplier.condicaoPagamento,
      validade: formatDateOnly(supplier.validadeProposta),
      status: QUOTATION_SUPPLIER_STATUS_LABELS[supplier.status],
    };
  });
}

/**
 * Mapa de cotação: itens nas linhas, fornecedores lado a lado, menor preço
 * destacado e o escolhido de cada item marcado — em Excel ou PDF, no padrão
 * visual de exportação do sistema.
 */
export async function exportQuotationMap(
  quotation: QuotationDetailDto,
  format: 'xlsx' | 'pdf',
): Promise<void> {
  if (format === 'pdf') return exportPdf(quotation);
  return exportXlsx(quotation);
}

async function exportXlsx(quotation: QuotationDetailDto): Promise<void> {
  const xlsx = await import('@/utils/export/xlsx');
  const { title, origin, meta } = context(quotation);
  const workbook = await xlsx.createWorkbook();
  const sheet = workbook.addWorksheet(t('sheet'));

  const suppliers = quotation.suppliers;
  const fixedCols = 6;
  const lastCol = fixedCols + suppliers.length * 2 + 2;
  const headerTop = await xlsx.addLetterhead(workbook, sheet, {
    title,
    subtitle: origin ?? undefined,
    meta: [meta],
    lastColumn: lastCol,
    orientation: 'landscape',
  });
  const headerBottom = headerTop + 1;

  // Cabeçalho em duas linhas: nome do fornecedor sobre "Unitário | Total".
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
  xlsx.styleHeaderRow(sheet, headerTop, 1, lastCol);
  xlsx.styleHeaderRow(sheet, headerBottom, 1, lastCol);
  sheet.getRow(headerBottom).height = 18;

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
    const rowNumber = headerBottom + 1 + index;
    sheet.getRow(rowNumber).values = values;
    const row = sheet.getRow(rowNumber);

    row.getCell(3).numFmt = xlsx.XLSX_FORMATS.number;
    row.getCell(6).numFmt = xlsx.XLSX_FORMATS.money;
    suppliers.forEach((supplier, sIndex) => {
      const col = fixedCols + 1 + sIndex * 2;
      row.getCell(col).numFmt = xlsx.XLSX_FORMATS.money;
      row.getCell(col + 1).numFmt = xlsx.XLSX_FORMATS.money;
      if (analysis?.melhorFornecedorIds.includes(supplier.id)) {
        row.getCell(col).fill = xlsx.xlsxFill(EXPORT_COLORS.best);
      }
      if (supplier.id === item.vencedorId) {
        row.getCell(col).font = { bold: true };
        row.getCell(col + 1).font = { bold: true };
        row.getCell(col + 1).fill = xlsx.xlsxFill(EXPORT_COLORS.goldSoft);
      }
    });
    row.getCell(bestCol).numFmt = xlsx.XLSX_FORMATS.money;
    xlsx.styleBodyRow(sheet, rowNumber, lastCol, index % 2 === 1);
  });

  // Resumo por fornecedor: frete, total, ranking, prazo, condição, validade e situação.
  const summary = supplierSummary(quotation);
  let rowNumber = headerBottom + quotation.items.length + 2;
  const summaryRows: Array<[string, (index: number) => string | number | null, boolean?]> = [
    [t('summary.freight'), (i) => summary[i]?.frete ?? null, true],
    [t('summary.total'), (i) => summary[i]?.total ?? null, true],
    [t('summary.ranking'), (i) => summary[i]?.ranking ?? null],
    [t('summary.delivery'), (i) => summary[i]?.prazo ?? null],
    [t('summary.payment'), (i) => summary[i]?.pagamento ?? null],
    [t('summary.validity'), (i) => summary[i]?.validade ?? null],
    [t('summary.status'), (i) => summary[i]?.status ?? null],
  ];
  for (const [label, valueAt, money] of summaryRows) {
    const row = sheet.getRow(rowNumber);
    row.getCell(2).value = label;
    row.getCell(2).font = { bold: true };
    suppliers.forEach((_, index) => {
      const cell = row.getCell(fixedCols + 2 + index * 2);
      cell.value = valueAt(index);
      if (money) cell.numFmt = xlsx.XLSX_FORMATS.money;
    });
    rowNumber += 1;
  }

  rowNumber += 1;
  const totalLine = (label: string, value: string | null) => {
    const row = sheet.getRow(rowNumber);
    row.getCell(2).value = label;
    row.getCell(bestCol).value = n(value);
    row.getCell(bestCol).numFmt = xlsx.XLSX_FORMATS.money;
    xlsx.styleTotalRow(sheet, rowNumber, lastCol);
    rowNumber += 1;
  };
  totalLine(t('summary.bestTotal'), quotation.analysis.totalMelhorPreco);
  if (quotation.analysis.totalVencedores !== null) {
    totalLine(t('summary.winnersTotal'), quotation.analysis.totalVencedores);
  }
  if (quotation.analysis.economiaVsUltimo !== null) {
    totalLine(t('summary.savings'), quotation.analysis.economiaVsUltimo);
  }

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 42;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 8;
  sheet.getColumn(5).width = 22;
  sheet.getColumn(6).width = 14;
  for (let col = fixedCols + 1; col <= lastCol; col += 1) sheet.getColumn(col).width = 15;
  sheet.getColumn(lastCol).width = 22;
  xlsx.freezeAndRepeatHeader(sheet, headerBottom, 2);
  sheet.pageSetup.printTitlesRow = `${headerTop}:${headerBottom}`;

  await xlsx.saveWorkbook(
    workbook,
    exportFileName(t('fileName', { numero: quotation.numero }), 'xlsx'),
  );
}

async function exportPdf(quotation: QuotationDetailDto): Promise<void> {
  const { createPdfReport } = await import('@/utils/export/pdf');
  const { title, origin, meta } = context(quotation);
  const pdf = await createPdfReport({
    title,
    subtitle: origin ?? undefined,
    orientation: 'landscape',
  });
  pdf.meta([meta]);

  const suppliers = quotation.suppliers;
  const money = (value: string | number | null | undefined) => displayValue(value ?? null, 'money');
  const priceOf = (supplierId: string, itemId: string) =>
    quotation.prices.find(
      (p) => p.quotationSupplierId === supplierId && p.quotationItemId === itemId,
    );
  const fixed = 5;
  const supplierStart = fixed;

  pdf.section(t('itemsTitle'));
  pdf.table({
    fontSize: suppliers.length > 5 ? 6.5 : 7.5,
    columns: [
      { header: t('col.item'), align: 'center', width: 9 },
      { header: t('col.description') },
      { header: t('col.quantity'), align: 'right', width: 15 },
      { header: t('col.unit'), align: 'center', width: 11 },
      { header: t('col.lastPrice'), align: 'right', width: 20 },
      ...suppliers.map((supplier) => ({ header: supplier.supplierName, align: 'right' as const })),
      { header: t('col.best'), align: 'right', width: 20 },
      { header: t('col.winner') },
    ],
    rows: quotation.items.map((item, index) => {
      const analysis = quotation.analysis.items.find((a) => a.itemId === item.id);
      const requested = [item.marca, item.referencia].filter(Boolean).join(' · ');
      return [
        String(index + 1),
        requested ? `${item.descricao}\n${requested}` : item.descricao,
        displayValue(item.quantidade, 'number'),
        item.unidade,
        money(item.ultimoPreco),
        ...suppliers.map((supplier) => {
          const price = priceOf(supplier.id, item.id);
          if (price && !price.disponivel) return t('unavailable');
          return money(price?.precoUnitario);
        }),
        money(analysis?.menorPreco),
        suppliers.find((s) => s.id === item.vencedorId)?.supplierName ?? '',
      ];
    }),
    // Total de cada fornecedor (com frete) no rodapé da tabela.
    foot: [
      [
        '',
        t('summary.total'),
        '',
        '',
        '',
        ...supplierSummary(quotation).map((s) => money(s.total)),
        // O total no menor preço não tem frete — aparece nos totais abaixo da tabela.
        '',
        '',
      ],
    ],
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const supplierIndex = data.column.index - supplierStart;
      const supplier = suppliers[supplierIndex];
      const item = quotation.items[data.row.index];
      if (!supplier || !item) return;
      const analysis = quotation.analysis.items.find((a) => a.itemId === item.id);
      if (analysis?.melhorFornecedorIds.includes(supplier.id)) {
        data.cell.styles.fillColor = rgb(EXPORT_COLORS.best);
      }
      if (supplier.id === item.vencedorId) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = rgb(EXPORT_COLORS.gold);
      }
    },
  });

  pdf.section(t('summaryTitle'));
  pdf.table({
    columns: [
      { header: t('supplier') },
      { header: t('summary.freight'), align: 'right' },
      { header: t('summary.total'), align: 'right' },
      { header: t('summary.ranking'), align: 'center' },
      { header: t('summary.delivery') },
      { header: t('summary.payment') },
      { header: t('summary.validity') },
      { header: t('summary.status') },
    ],
    rows: supplierSummary(quotation).map((s) => [
      s.name,
      money(s.frete),
      money(s.total),
      s.ranking === null ? '' : `${s.ranking}º`,
      s.prazo ?? '',
      s.pagamento ?? '',
      s.validade ?? '',
      s.status,
    ]),
  });

  pdf.fields(
    [
      [t('summary.bestTotal'), money(quotation.analysis.totalMelhorPreco)],
      [t('summary.winnersTotal'), money(quotation.analysis.totalVencedores)],
      [t('summary.savings'), money(quotation.analysis.economiaVsUltimo)],
    ],
    3,
  );
  pdf.meta([t('legend')]);
  pdf.save(exportFileName(t('fileName', { numero: quotation.numero }), 'pdf'));
}
