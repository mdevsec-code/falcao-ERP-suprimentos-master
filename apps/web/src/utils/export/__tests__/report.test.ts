import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import type * as CsvModule from '@/utils/csv';
import type * as BrandModule from '@/utils/export/brand';

const downloads: Array<{ fileName: string; blob: Blob }> = [];

vi.mock('@/utils/csv', async (importOriginal) => {
  const actual = await importOriginal<typeof CsvModule>();
  return {
    ...actual,
    downloadBlob: (blob: Blob, fileName: string) => downloads.push({ fileName, blob }),
    downloadText: (content: string, fileName: string) =>
      downloads.push({ fileName, blob: new Blob([content], { type: 'text/csv' }) }),
  };
});

// Sem canvas no jsdom: o documento sai sem logo (o mesmo caminho de quando a imagem falha).
vi.mock('@/utils/export/brand', async (importOriginal) => ({
  ...(await importOriginal<typeof BrandModule>()),
  loadLogoDataUrl: async () => null,
}));

import { describeFilters, exportReport, fetchAllPages, type ReportDefinition } from '../report';

interface Row {
  vencimento: string;
  descricao: string;
  valor: string;
  pago: number | null;
}

const definition: ReportDefinition<Row> = {
  title: 'Contas a pagar',
  subtitle: 'Financeiro',
  meta: ['Filtros: Status: Aberto'],
  fileBase: 'Contas a pagar',
  rows: [
    { vencimento: '2026-10-20', descricao: 'Cimento CP-II; 50 kg', valor: '1234.5', pago: null },
    { vencimento: '2026-11-05', descricao: '=HYPERLINK("http://x")', valor: '99.99', pago: 99.99 },
  ],
  columns: [
    { header: 'Vencimento', value: (r) => r.vencimento, type: 'date' },
    { header: 'Descrição', value: (r) => r.descricao, width: 30 },
    { header: 'Valor', value: (r) => r.valor, type: 'money', total: true },
    { header: 'Pago', value: (r) => r.pago, type: 'money', total: true },
  ],
};

/** O Blob do jsdom não tem `arrayBuffer()`/`text()`; o FileReader tem. */
function bytesOf(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
const text = async (blob: Blob) =>
  new TextDecoder('utf-8', { ignoreBOM: true }).decode(await bytesOf(blob));

/** `EXPORT_DUMP_DIR=... npx vitest run report` grava os arquivos para conferir visualmente. */
function dump(fileName: string, bytes: ArrayBuffer) {
  const dir = process.env.EXPORT_DUMP_DIR;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, fileName), Buffer.from(bytes));
}

beforeAll(async () => {
  await i18n.changeLanguage('pt-BR');
});

describe('exportReport', () => {
  beforeEach(() => {
    downloads.length = 0;
  });

  it('CSV: separador ;, vírgula decimal, data dd/mm/aaaa, BOM e nome padrão', async () => {
    await exportReport(definition, 'csv');
    const [file] = downloads;
    expect(file?.fileName).toMatch(/^falcao-contas-a-pagar-\d{4}-\d{2}-\d{2}\.csv$/);
    const content = await text(file!.blob);
    dump(file!.fileName, await bytesOf(file!.blob));
    // BOM UTF-8 no início: o Excel abre os acentos certos.
    expect(content.charCodeAt(0)).toBe(0xfeff);
    const lines = content.slice(1).split('\r\n');
    expect(lines[0]).toBe('Vencimento;Descrição;Valor;Pago');
    expect(lines[1]).toBe('20/10/2026;"Cimento CP-II; 50 kg";1234,50;');
    // Texto que o Excel executaria como fórmula entra neutralizado.
    expect(lines[2]).toContain(`"'=HYPERLINK(""http://x"")"`);
  });

  it('Excel: timbre, cabeçalho, valores numéricos com formato e linha de total', async () => {
    await exportReport(definition, 'xlsx');
    const [file] = downloads;
    expect(file?.fileName).toMatch(/^falcao-contas-a-pagar-\d{4}-\d{2}-\d{2}\.xlsx$/);
    const bytes = await bytesOf(file!.blob);
    dump(file!.fileName, bytes);

    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    const sheet = workbook.worksheets[0]!;
    expect(sheet.getCell('A4').value).toBe('Contas a pagar');

    const headerRow =
      sheet.views[0] && 'ySplit' in sheet.views[0] ? Number(sheet.views[0].ySplit) : 0;
    expect(sheet.getRow(headerRow).getCell(1).value).toBe('Vencimento');
    const first = sheet.getRow(headerRow + 1);
    expect(first.getCell(1).value).toBeInstanceOf(Date);
    expect(first.getCell(3).value).toBe(1234.5);
    expect(first.getCell(3).numFmt).toBe('"R$" #,##0.00');
    // Fórmula vinda do usuário é texto, nunca fórmula.
    expect(sheet.getRow(headerRow + 2).getCell(2).value).toBe('=HYPERLINK("http://x")');
    const total = sheet.getRow(headerRow + 3);
    expect(total.getCell(1).value).toBe('Total');
    expect(total.getCell(3).value).toBe(1334.49);
    expect(total.getCell(4).value).toBe(99.99);
  });

  it('PDF: gera um documento válido com o nome padrão', async () => {
    await exportReport(definition, 'pdf');
    const [file] = downloads;
    expect(file?.fileName).toMatch(/^falcao-contas-a-pagar-\d{4}-\d{2}-\d{2}\.pdf$/);
    const bytes = await bytesOf(file!.blob);
    dump(file!.fileName, bytes);
    const head = new TextDecoder('latin1').decode(bytes.slice(0, 8));
    expect(head.startsWith('%PDF-')).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(2000);
  });
});

describe('describeFilters', () => {
  it('lista só os filtros preenchidos', () => {
    expect(
      describeFilters([
        ['Status', 'Aberto'],
        ['Origem', ''],
        [null, 'Só vencidas'],
        ['X', false],
      ]),
    ).toEqual(['Filtros: Status: Aberto · Só vencidas']);
    expect(describeFilters([['Status', undefined]])).toEqual([]);
  });
});

describe('fetchAllPages', () => {
  it('busca todas as páginas até o limite', async () => {
    const fetchPage = vi.fn(async (page: number, pageSize: number) => ({
      data: Array.from({ length: page < 3 ? pageSize : 7 }, (_, i) => (page - 1) * pageSize + i),
      meta: { page, pageSize, total: 207, totalPages: 3 },
    }));
    const rows = await fetchAllPages(fetchPage);
    expect(rows).toHaveLength(207);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(await fetchAllPages(fetchPage, 150)).toHaveLength(150);
  });
});
