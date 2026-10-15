import { MAX_CATALOG_ITEMS, type CatalogTemplateColumn } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { exportFileName } from '@/utils/export/brand';

/** Linha lida da planilha, já no formato do envio (ou com o problema encontrado). */
export interface CatalogRow {
  linha: number;
  codigoFornecedor?: string;
  descricao: string;
  unidade: string;
  marca?: string;
  referencia?: string;
  preco?: number;
  observacao?: string;
  erro: string | null;
}

/**
 * Cabeçalhos da planilha modelo, em português (o arquivo circula entre
 * fornecedores brasileiros). A leitura reconhece pelas palavras-chave, então
 * aceita também a planilha do próprio fornecedor com cabeçalhos parecidos.
 */
const HEADERS: Record<CatalogTemplateColumn, string> = {
  codigoFornecedor: 'Código no fornecedor',
  descricao: 'Descrição *',
  unidade: 'Unidade *',
  marca: 'Marca',
  referencia: 'Referência / part number',
  preco: 'Preço unitário (R$)',
  observacao: 'Observação',
};

const KEYWORDS: Array<[CatalogTemplateColumn, RegExp]> = [
  ['codigoFornecedor', /^(cod|codigo|sku|item)/],
  ['descricao', /^(descr|produto|nome|material)/],
  ['unidade', /^(un|unid|medida)/],
  ['marca', /^(marca|fabricante)/],
  ['referencia', /^(ref|part|modelo)/],
  ['preco', /^(preco|valor|price)/],
  ['observacao', /^(obs|nota|coment)/],
];

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

/** "1.234,56", "1234.56", "R$ 12,90" ou número da célula → número; `NaN` se não der. */
export function parsePrice(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (typeof raw === 'number') return Math.round(raw * 100) / 100;
  let text = String(raw).replace(/[^\d,.-]/g, '');
  if (!text) return undefined;
  // Com vírgula, ela é o decimal (padrão brasileiro) e os pontos são milhar.
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  const value = Number(text);
  return Number.isNaN(value) ? Number.NaN : Math.round(value * 100) / 100;
}

/** Texto da célula do ExcelJS (rich text, hiperlink, fórmula com resultado…). */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const v = value as { text?: string; result?: unknown; richText?: Array<{ text: string }> };
    if (v.richText) return v.richText.map((part) => part.text).join('');
    if (v.text !== undefined) return String(v.text);
    if (v.result !== undefined) return String(v.result);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

/** Planilha modelo no padrão de exportação, com uma aba de instruções. */
export async function downloadCatalogTemplate(empresa: string): Promise<void> {
  const xlsx = await import('@/utils/export/xlsx');
  const t = (key: string) => i18n.t(`supplierPortal:template.${key}`, { empresa });
  const workbook = await xlsx.createWorkbook();
  const sheet = workbook.addWorksheet('Itens');
  const columns = Object.keys(HEADERS) as CatalogTemplateColumn[];
  const headerRow = await xlsx.addLetterhead(workbook, sheet, {
    title: t('title'),
    subtitle: t('subtitle'),
    meta: [t('meta')],
    lastColumn: columns.length,
  });
  columns.forEach((column, index) => {
    sheet.getCell(headerRow, index + 1).value = HEADERS[column];
    sheet.getColumn(index + 1).width = column === 'descricao' ? 48 : column === 'unidade' ? 10 : 20;
  });
  xlsx.styleHeaderRow(sheet, headerRow, 1, columns.length);
  // Exemplo em cinza, para o fornecedor ver o formato (pode apagar).
  const example = [
    'CP2-50',
    'Cimento CP-II 50 kg',
    'SC',
    'Votoran',
    'CPII-E-32',
    38.9,
    'Palete com 40 sacos',
  ];
  example.forEach((value, index) => {
    const cell = sheet.getCell(headerRow + 1, index + 1);
    cell.value = value;
    cell.font = { italic: true, color: { argb: 'FF8A8A82' } };
  });
  sheet.getCell(headerRow + 1, 6).numFmt = xlsx.XLSX_FORMATS.money;
  for (let row = headerRow + 2; row <= headerRow + 200; row += 1) {
    sheet.getCell(row, 6).numFmt = xlsx.XLSX_FORMATS.money;
  }
  xlsx.freezeAndRepeatHeader(sheet, headerRow);

  const help = workbook.addWorksheet(t('helpSheet'));
  help.getColumn(1).width = 110;
  [t('help1'), t('help2'), t('help3'), t('help4'), t('help5')].forEach((line, index) => {
    help.getCell(index + 1, 1).value = line;
    help.getCell(index + 1, 1).alignment = { wrapText: true };
  });

  await xlsx.saveWorkbook(
    workbook,
    exportFileName(i18n.t('supplierPortal:template.fileBase'), 'xlsx'),
  );
}

/**
 * Lê a planilha preenchida (.xlsx). Acha a linha de cabeçalho pelas palavras
 * (a do modelo tem o timbre em cima), ignora linhas vazias e o exemplo, e
 * marca o problema de cada linha inválida em vez de recusar tudo.
 */
export async function readCatalogSheet(file: File): Promise<CatalogRow[]> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  let headerRow = 0;
  let map = new Map<CatalogTemplateColumn, number>();
  for (let row = 1; row <= Math.min(sheet.rowCount, 30) && headerRow === 0; row += 1) {
    const found = new Map<CatalogTemplateColumn, number>();
    sheet.getRow(row).eachCell((cell, col) => {
      const text = normalize(cellText(cell.value));
      const match = KEYWORDS.find(([key, pattern]) => !found.has(key) && pattern.test(text));
      if (match) found.set(match[0], col);
    });
    if (found.has('descricao') && found.has('unidade')) {
      headerRow = row;
      map = found;
    }
  }
  if (headerRow === 0) throw new Error(i18n.t('supplierPortal:catalog.errors.noHeader'));

  const rows: CatalogRow[] = [];
  const get = (row: number, key: CatalogTemplateColumn) => {
    const col = map.get(key);
    return col ? sheet.getRow(row).getCell(col).value : null;
  };
  for (let row = headerRow + 1; row <= sheet.rowCount; row += 1) {
    const descricao = cellText(get(row, 'descricao'));
    const unidade = cellText(get(row, 'unidade'));
    const codigo = cellText(get(row, 'codigoFornecedor'));
    if (!descricao && !unidade && !codigo) continue;
    // A linha de exemplo do modelo vem em itálico cinza; se ficou, é ignorada.
    if (descricao === 'Cimento CP-II 50 kg' && codigo === 'CP2-50') continue;

    const precoRaw = get(row, 'preco');
    const preco = parsePrice(
      typeof precoRaw === 'object' && precoRaw ? cellText(precoRaw) : precoRaw,
    );
    let erro: string | null = null;
    if (descricao.length < 2) erro = i18n.t('supplierPortal:catalog.errors.description');
    else if (!unidade) erro = i18n.t('supplierPortal:catalog.errors.unit');
    else if (preco !== undefined && (Number.isNaN(preco) || preco < 0)) {
      erro = i18n.t('supplierPortal:catalog.errors.price');
    }
    const optional = (key: CatalogTemplateColumn, max: number) =>
      cellText(get(row, key)).slice(0, max) || undefined;
    rows.push({
      linha: row,
      codigoFornecedor: codigo.slice(0, 60) || undefined,
      descricao: descricao.slice(0, 300),
      unidade: unidade.slice(0, 20).toUpperCase(),
      marca: optional('marca', 80),
      referencia: optional('referencia', 80),
      preco: preco !== undefined && !Number.isNaN(preco) ? preco : undefined,
      observacao: optional('observacao', 500),
      erro,
    });
    if (rows.length > MAX_CATALOG_ITEMS) break;
  }
  return rows;
}
