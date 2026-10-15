import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyzeQuotation,
  type QuotationDetailDto,
  type QuotationItemDto,
  type QuotationPriceDto,
  type QuotationSupplierDto,
} from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import type * as CsvModule from '@/utils/csv';
import type * as BrandModule from '@/utils/export/brand';

// Gerar planilha/PDF carrega o ExcelJS e o jsPDF: com a máquina ocupada passa dos 5 s padrão.
vi.setConfig({ testTimeout: 20_000 });

const downloads: Array<{ fileName: string; blob: Blob }> = [];

vi.mock('@/utils/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof CsvModule>()),
  downloadBlob: (blob: Blob, fileName: string) => downloads.push({ fileName, blob }),
}));
vi.mock('@/utils/export/brand', async (importOriginal) => ({
  ...(await importOriginal<typeof BrandModule>()),
  loadLogoDataUrl: async () => null,
}));

import { exportQuotationMap } from '../export';

function bytesOf(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

function dump(fileName: string, bytes: ArrayBuffer) {
  const dir = process.env.EXPORT_DUMP_DIR;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, fileName), Buffer.from(bytes));
}

const item = (
  id: string,
  descricao: string,
  quantidade: string,
  extra: Partial<QuotationItemDto> = {},
) =>
  ({
    id,
    purchaseRequestItemId: null,
    productId: null,
    productCodigo: null,
    descricao,
    quantidade,
    unidade: 'UN',
    marca: null,
    referencia: null,
    vencedorId: null,
    ultimoPreco: null,
    ultimoPrecoEm: null,
    ultimoFornecedor: null,
    origens: [],
    ...extra,
  }) satisfies QuotationItemDto;

const supplier = (id: string, name: string, extra: Partial<QuotationSupplierDto> = {}) =>
  ({
    id,
    supplierId: `s-${id}`,
    supplierName: name,
    supplierCnpj: '11.222.333/0001-81',
    contatoNome: null,
    contatoEmail: null,
    contatoTelefone: null,
    status: 'RESPONDIDO',
    origem: 'CONVITE',
    cadastroPendente: false,
    respondidoEm: null,
    respondidoPor: null,
    prazoEntregaDias: 5,
    condicaoPagamento: '28 dias',
    validadeProposta: '2026-11-30',
    frete: null,
    observacoes: null,
    linkToken: null,
    ...extra,
  }) satisfies QuotationSupplierDto;

const price = (s: string, i: string, value: string | null): QuotationPriceDto => ({
  quotationSupplierId: s,
  quotationItemId: i,
  precoUnitario: value,
  marca: null,
  referencia: null,
  disponivel: value !== null,
  observacao: null,
});

const items = [
  item('cimento', 'Cimento CP-II 50 kg', '120', {
    ultimoPreco: '41.00',
    marca: 'Votoran',
    vencedorId: 'b',
  }),
  item('vergalhao', 'Vergalhão CA-50 10 mm (barra 12 m)', '300', { vencedorId: 'a' }),
  item('areia', 'Areia média lavada', '18', { unidade: 'M3' }),
];
const suppliers = [
  supplier('a', 'Depósito Central', { frete: '250.00' }),
  supplier('b', 'Casa do Construtor', { origem: 'LINK_ABERTO' }),
  supplier('c', 'Ferro & Aço Ltda', {
    status: 'CONVIDADO',
    prazoEntregaDias: null,
    condicaoPagamento: null,
    validadeProposta: null,
  }),
];
const prices = [
  price('a', 'cimento', '39.90'),
  price('a', 'vergalhao', '52.10'),
  price('a', 'areia', '135.00'),
  price('b', 'cimento', '38.70'),
  price('b', 'vergalhao', '54.00'),
  price('b', 'areia', null),
];

const quotation: QuotationDetailDto = {
  id: 'q1',
  numero: 42,
  titulo: 'Estrutura bloco B',
  status: 'ABERTA',
  prazoResposta: '2026-10-30',
  purchaseRequestId: null,
  purchaseRequestTitle: null,
  plan: { id: 'p1', numero: 7, titulo: 'Estrutura bloco B — outubro', obra: 'Residencial Falcão' },
  itens: items.length,
  convidados: suppliers.length,
  respondidos: 2,
  createdByName: 'Compras',
  createdAt: '2026-10-15T10:00:00.000Z',
  observacoes: null,
  encerradaEm: null,
  purchaseRequest: null,
  linkAbertoToken: null,
  items,
  suppliers,
  prices,
  analysis: analyzeQuotation({ items, suppliers, prices }),
};

beforeAll(async () => {
  await i18n.changeLanguage('pt-BR');
});

describe('exportQuotationMap', () => {
  beforeEach(() => {
    downloads.length = 0;
  });

  it('Excel do mapa de um plano: fornecedores lado a lado e total no menor preço', async () => {
    await exportQuotationMap(quotation, 'xlsx');
    const [file] = downloads;
    expect(file?.fileName).toMatch(/^falcao-mapa-cotacao-42-\d{4}-\d{2}-\d{2}\.xlsx$/);
    const bytes = await bytesOf(file!.blob);
    dump(file!.fileName, bytes);

    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    const sheet = workbook.worksheets[0]!;
    expect(String(sheet.getCell('A5').value)).toContain('Plano de requisição nº 7');
    const values = sheet
      .getSheetValues()
      .flat()
      .filter((v) => typeof v === 'string');
    expect(values).toContain('Depósito Central');
    expect(values).toContain('Total no menor preço');
  });

  it('PDF do mapa: gera documento válido', async () => {
    await exportQuotationMap(quotation, 'pdf');
    const [file] = downloads;
    expect(file?.fileName).toMatch(/^falcao-mapa-cotacao-42-\d{4}-\d{2}-\d{2}\.pdf$/);
    const bytes = await bytesOf(file!.blob);
    dump(file!.fileName, bytes);
    expect(new TextDecoder('latin1').decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});
