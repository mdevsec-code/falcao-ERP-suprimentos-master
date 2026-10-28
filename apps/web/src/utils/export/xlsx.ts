import type { Font, Workbook, Worksheet } from 'exceljs';

import { xt } from './language';
import { downloadBlob } from '@/utils/csv';
import { EXPORT_COLORS, exportIssuer, generatedLine, loadLogoDataUrl } from './brand';

export const XLSX_FORMATS = {
  money: '"R$" #,##0.00',
  number: '#,##0.00',
  integer: '0',
  date: 'dd/mm/yyyy',
  dateTime: 'dd/mm/yyyy hh:mm',
  text: '@',
} as const;

const solid = (hex: string) => ({
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: `FF${hex}` },
});
const thin = { style: 'thin' as const, color: { argb: `FF${EXPORT_COLORS.border}` } };
export const XLSX_BORDER = { top: thin, left: thin, bottom: thin, right: thin };

export const xlsxFill = solid;

export interface LetterheadOptions {
  title: string;
  subtitle?: string;
  /** Linhas de contexto (filtros, obra, prazo…). */
  meta?: string[];
  /** Última coluna usada pela tabela — o título se estende até ela. */
  lastColumn: number;
  orientation?: 'portrait' | 'landscape';
}

/** O ExcelJS só é carregado quando alguém exporta. */
export async function createWorkbook(): Promise<Workbook> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = exportIssuer();
  workbook.created = new Date();
  return workbook;
}

/**
 * Timbre padrão no topo da planilha: logo, título, subtítulo, linhas de
 * contexto, "gerado em/por" e um filete dourado. Também ajusta impressão
 * (página inteira na largura, cabeçalho/rodapé com número de página).
 * Devolve o número da linha onde a tabela deve começar.
 */
export async function addLetterhead(
  workbook: Workbook,
  sheet: Worksheet,
  options: LetterheadOptions,
): Promise<number> {
  const lastColumn = Math.max(options.lastColumn, 4);
  const logo = await loadLogoDataUrl();
  sheet.getRow(1).height = 22;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 22;
  if (logo) {
    const imageId = workbook.addImage({ base64: logo, extension: 'png' });
    sheet.addImage(imageId, { tl: { col: 0.15, row: 0.2 }, ext: { width: 124, height: 63 } });
  }

  let row = 4;
  const line = (text: string, font: Partial<Font>, height?: number) => {
    sheet.mergeCells(row, 1, row, lastColumn);
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = font;
    cell.alignment = { vertical: 'middle', wrapText: false };
    if (height) sheet.getRow(row).height = height;
    row += 1;
  };
  line(options.title, { bold: true, size: 15, color: { argb: `FF${EXPORT_COLORS.ink}` } }, 24);
  if (options.subtitle)
    line(options.subtitle, { size: 11, color: { argb: `FF${EXPORT_COLORS.ink}` } });
  for (const meta of options.meta ?? []) {
    line(meta, { size: 10, color: { argb: `FF${EXPORT_COLORS.muted}` } });
  }
  line(generatedLine(), { italic: true, size: 9, color: { argb: `FF${EXPORT_COLORS.muted}` } });

  // Filete dourado separando o timbre da tabela.
  sheet.getRow(row).height = 4;
  for (let col = 1; col <= lastColumn; col += 1)
    sheet.getCell(row, col).fill = solid(EXPORT_COLORS.gold);
  row += 2;

  sheet.pageSetup = {
    ...sheet.pageSetup,
    paperSize: 9, // A4
    orientation: options.orientation ?? 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
  };
  const escape = (text: string) => text.replace(/&/g, '&&');
  sheet.headerFooter = {
    oddHeader: `&L&8${escape(exportIssuer())}&R&8${escape(options.title)}`,
    oddFooter: `&L&8${escape(generatedLine())}&R&8${escape(
      xt('common:export.page', { page: '&P', total: '&N' }),
    )}`,
  };
  return row;
}

/** Cabeçalho da tabela: fundo preto da marca, texto branco em negrito. */
export function styleHeaderRow(
  sheet: Worksheet,
  rowNumber: number,
  fromColumn: number,
  toColumn: number,
) {
  const row = sheet.getRow(rowNumber);
  row.height = 30;
  for (let col = fromColumn; col <= toColumn; col += 1) {
    const cell = row.getCell(col);
    cell.font = { bold: true, color: { argb: `FF${EXPORT_COLORS.white}` }, size: 10 };
    cell.fill = solid(EXPORT_COLORS.ink);
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = XLSX_BORDER;
  }
}

/** Corpo: borda fina e linhas alternadas. */
export function styleBodyRow(
  sheet: Worksheet,
  rowNumber: number,
  toColumn: number,
  zebra: boolean,
) {
  const row = sheet.getRow(rowNumber);
  for (let col = 1; col <= toColumn; col += 1) {
    const cell = row.getCell(col);
    cell.border = XLSX_BORDER;
    if (zebra && !cell.fill) cell.fill = solid(EXPORT_COLORS.zebra);
    cell.alignment = { vertical: 'top', wrapText: true, ...cell.alignment };
  }
}

/** Linha de totais: negrito sobre o dourado suave. */
export function styleTotalRow(sheet: Worksheet, rowNumber: number, toColumn: number) {
  const row = sheet.getRow(rowNumber);
  for (let col = 1; col <= toColumn; col += 1) {
    const cell = row.getCell(col);
    cell.font = { bold: true, color: { argb: `FF${EXPORT_COLORS.ink}` } };
    cell.fill = solid(EXPORT_COLORS.goldSoft);
    cell.border = {
      ...XLSX_BORDER,
      top: { style: 'medium', color: { argb: `FF${EXPORT_COLORS.goldDark}` } },
    };
  }
}

/** Repete o cabeçalho da tabela em cada página impressa e congela o rolamento nele. */
export function freezeAndRepeatHeader(sheet: Worksheet, headerRow: number, xSplit = 0) {
  sheet.views = [{ state: 'frozen', xSplit, ySplit: headerRow }];
  sheet.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
}

export async function saveWorkbook(workbook: Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
