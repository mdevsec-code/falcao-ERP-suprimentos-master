import type { PaginatedResult } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { xt } from './language';
import { csvNumber, downloadText, toCsv } from '@/utils/csv';
import { formatCurrencyBRL, formatDateOnly, formatDateTime, parseDateOnly } from '@/utils/format';
import { exportFileName } from './brand';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

/**
 * - `money`: R$ (número ou texto decimal da API)
 * - `number`: 2 casas · `integer`: sem casas
 * - `date`: `AAAA-MM-DD` · `dateTime`: ISO com hora
 */
export type ReportColumnType = 'text' | 'money' | 'number' | 'integer' | 'date' | 'dateTime';

type CellValue = string | number | null | undefined;

export interface ReportColumn<T> {
  header: string;
  value: (row: T) => CellValue;
  type?: ReportColumnType;
  /** Largura no Excel, em caracteres. */
  width?: number;
  /** Soma a coluna na linha de total (money/number/integer). */
  total?: boolean;
  /** Endereço do arquivo: vira hiperlink no Excel e o próprio endereço no CSV. */
  link?: (row: T) => string | null;
}

export interface ReportDefinition<T> {
  title: string;
  subtitle?: string;
  /** Filtros aplicados e outros contextos, uma linha cada. */
  meta?: string[];
  /** Base do nome do arquivo (vira `falcao-<base>-<data>.<ext>`). */
  fileBase: string;
  columns: ReportColumn<T>[];
  rows: readonly T[];
  orientation?: 'portrait' | 'landscape';
}

const NUMERIC: readonly ReportColumnType[] = ['money', 'number', 'integer'];

const toNumber = (value: CellValue): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

/** Texto da célula como aparece no PDF. */
export function displayValue(value: CellValue, type: ReportColumnType = 'text'): string {
  if (value === null || value === undefined || value === '') return '';
  switch (type) {
    case 'money':
      return formatCurrencyBRL(value);
    case 'number': {
      const numeric = toNumber(value);
      return numeric === null
        ? ''
        : numeric.toLocaleString(i18n.language, { maximumFractionDigits: 2 });
    }
    case 'integer':
      return String(value);
    case 'date':
      return formatDateOnly(String(value)) ?? '';
    case 'dateTime':
      return formatDateTime(String(value)) ?? '';
    default:
      return String(value);
  }
}

/** Valor da célula no CSV: decimal com vírgula, data dd/mm/aaaa. */
function csvValue(
  value: CellValue,
  type: ReportColumnType = 'text',
): string | number | null | undefined {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'money' || type === 'number') return csvNumber(value);
  if (type === 'date' || type === 'dateTime') return displayValue(value, type);
  return value;
}

function totals<T>(definition: ReportDefinition<T>): (number | null)[] | null {
  if (!definition.columns.some((column) => column.total)) return null;
  return definition.columns.map((column) => {
    if (!column.total) return null;
    // Em centavos, para não acumular erro de ponto flutuante.
    const cents = definition.rows.reduce(
      (sum, row) => sum + Math.round((toNumber(column.value(row)) ?? 0) * 100),
      0,
    );
    return cents / 100;
  });
}

async function exportCsv<T>(definition: ReportDefinition<T>): Promise<void> {
  const header = definition.columns.map((column) => column.header);
  const body = definition.rows.map((row) =>
    definition.columns.map((column) =>
      column.link ? (column.link(row) ?? '') : csvValue(column.value(row), column.type),
    ),
  );
  downloadText(toCsv([header, ...body]), exportFileName(definition.fileBase, 'csv'));
}

async function exportXlsx<T>(definition: ReportDefinition<T>): Promise<void> {
  const xlsx = await import('./xlsx');
  const workbook = await xlsx.createWorkbook();
  const sheet = workbook.addWorksheet(definition.title.slice(0, 31));
  const lastColumn = definition.columns.length;
  const headerRow = await xlsx.addLetterhead(workbook, sheet, {
    title: definition.title,
    subtitle: definition.subtitle,
    meta: [
      ...(definition.meta ?? []),
      xt('common:export.records', { count: definition.rows.length }),
    ],
    lastColumn,
    orientation: definition.orientation,
  });

  definition.columns.forEach((column, index) => {
    const col = sheet.getColumn(index + 1);
    col.width = column.width ?? (NUMERIC.includes(column.type ?? 'text') ? 14 : 22);
    sheet.getCell(headerRow, index + 1).value = column.header;
  });
  xlsx.styleHeaderRow(sheet, headerRow, 1, lastColumn);

  const format = (type: ReportColumnType = 'text') =>
    type === 'money'
      ? xlsx.XLSX_FORMATS.money
      : type === 'number'
        ? xlsx.XLSX_FORMATS.number
        : type === 'integer'
          ? xlsx.XLSX_FORMATS.integer
          : type === 'date'
            ? xlsx.XLSX_FORMATS.date
            : type === 'dateTime'
              ? xlsx.XLSX_FORMATS.dateTime
              : undefined;

  definition.rows.forEach((row, rowIndex) => {
    const rowNumber = headerRow + 1 + rowIndex;
    definition.columns.forEach((column, index) => {
      const cell = sheet.getCell(rowNumber, index + 1);
      const raw = column.value(row);
      const type = column.type ?? 'text';
      // Texto do usuário entra sempre como valor puro — nunca como fórmula.
      if (NUMERIC.includes(type)) cell.value = toNumber(raw);
      else if (type === 'date') cell.value = raw ? parseDateOnly(String(raw)) : null;
      else if (type === 'dateTime') cell.value = raw ? new Date(String(raw)) : null;
      else cell.value = raw === null || raw === undefined ? null : String(raw);
      const href = column.link?.(row);
      if (href) {
        cell.value = { text: String(raw ?? href), hyperlink: href };
        cell.font = { color: { argb: 'FF2563EB' }, underline: true };
      }
      const numFmt = format(type);
      if (numFmt) cell.numFmt = numFmt;
      if (NUMERIC.includes(type)) cell.alignment = { horizontal: 'right' };
    });
    xlsx.styleBodyRow(sheet, rowNumber, lastColumn, rowIndex % 2 === 1);
  });

  const sums = totals(definition);
  if (sums && definition.rows.length > 0) {
    const rowNumber = headerRow + definition.rows.length + 1;
    sheet.getCell(rowNumber, 1).value = xt('common:export.total');
    sums.forEach((sum, index) => {
      if (sum === null) return;
      const cell = sheet.getCell(rowNumber, index + 1);
      cell.value = sum;
      const numFmt = format(definition.columns[index]?.type);
      if (numFmt) cell.numFmt = numFmt;
    });
    xlsx.styleTotalRow(sheet, rowNumber, lastColumn);
  }

  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: lastColumn },
  };
  xlsx.freezeAndRepeatHeader(sheet, headerRow);
  await xlsx.saveWorkbook(workbook, exportFileName(definition.fileBase, 'xlsx'));
}

async function exportPdf<T>(definition: ReportDefinition<T>): Promise<void> {
  const { createPdfReport } = await import('./pdf');
  const orientation =
    definition.orientation ?? (definition.columns.length > 6 ? 'landscape' : 'portrait');
  const pdf = await createPdfReport({
    title: definition.title,
    subtitle: definition.subtitle,
    orientation,
  });
  pdf.meta([
    ...(definition.meta ?? []),
    xt('common:export.records', { count: definition.rows.length }),
  ]);
  const sums = totals(definition);
  pdf.table({
    columns: definition.columns.map((column) => ({
      header: column.header,
      align: NUMERIC.includes(column.type ?? 'text') ? 'right' : 'left',
    })),
    rows: definition.rows.map((row) =>
      definition.columns.map((column) => displayValue(column.value(row), column.type)),
    ),
    foot: sums
      ? [
          sums.map((sum, index) =>
            index === 0 && sum === null
              ? xt('common:export.total')
              : sum === null
                ? ''
                : displayValue(sum, definition.columns[index]?.type),
          ),
        ]
      : undefined,
  });
  pdf.save(exportFileName(definition.fileBase, 'pdf'));
}

/** Gera o arquivo no formato pedido, sempre com o mesmo padrão visual e de nome. */
export async function exportReport<T>(
  definition: ReportDefinition<T>,
  format: ExportFormat,
): Promise<void> {
  if (format === 'csv') return exportCsv(definition);
  if (format === 'xlsx') return exportXlsx(definition);
  return exportPdf(definition);
}

/**
 * "Filtros: Status: Aberto · Origem: Pedido · Só vencidas" — só os filtros
 * preenchidos (rótulo `null` = filtro liga/desliga, mostra só o texto); `[]` sem filtro.
 */
export function describeFilters(
  pairs: ReadonlyArray<[string | null, string | null | undefined | false]>,
): string[] {
  const parts = pairs
    .filter(
      (pair): pair is [string | null, string] =>
        typeof pair[1] === 'string' && pair[1].trim() !== '',
    )
    .map(([label, value]) => (label ? `${label}: ${value}` : value));
  return parts.length > 0 ? [xt('common:export.filters', { filters: parts.join(' · ') })] : [];
}

/**
 * Busca todas as páginas de uma listagem (a API entrega no máximo 100 por vez)
 * para exportar o que está filtrado na tela, não só a página visível.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResult<T>>,
  maxRows = 5000,
): Promise<T[]> {
  const pageSize = 100;
  const first = await fetchPage(1, pageSize);
  const rows = [...first.data];
  const lastPage = Math.min(first.meta.totalPages, Math.ceil(maxRows / pageSize));
  for (let page = 2; page <= lastPage; page += 1) {
    rows.push(...(await fetchPage(page, pageSize)).data);
  }
  return rows.slice(0, maxRows);
}
