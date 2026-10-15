import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { PurchaseRequestDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import type * as CsvModule from '@/utils/csv';
import type * as BrandModule from '@/utils/export/brand';

// Gerar o PDF carrega o jsPDF: com a máquina ocupada passa dos 5 s padrão.
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

import { exportPurchaseRequestPdf } from '../reports';

function bytesOf(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

const request: PurchaseRequestDetailDto = {
  id: 'r1',
  title: 'Materiais para a laje do bloco B',
  status: 'EM_COTACAO',
  costCenter: 'Residencial Falcão',
  requesterId: 'u1',
  requesterName: 'Ana Engenheira',
  itemCount: 2,
  estimatedTotal: '5400.00',
  createdAt: '2026-10-10T12:00:00.000Z',
  justification: 'Concretagem prevista para a próxima semana.',
  updatedAt: '2026-10-11T12:00:00.000Z',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      productName: 'CIM-01 · Cimento CP-II 50 kg',
      description: 'Cimento CP-II 50 kg',
      quantity: '120',
      unit: 'SC',
      estimatedPrice: '40.00',
      marca: 'Votoran',
      referencia: null,
    },
    {
      id: 'i2',
      productId: null,
      productName: null,
      description: 'Espaçador plástico para laje',
      quantity: '600',
      unit: 'UN',
      estimatedPrice: '1.00',
      marca: null,
      referencia: 'EP-25',
    },
  ],
  approvals: [
    {
      id: 'a1',
      action: 'APPROVE',
      fromStatus: 'AGUARDANDO_APROVACAO',
      toStatus: 'EM_COMPRAS',
      comment: 'Aprovado dentro do orçamento.',
      approverId: 'u2',
      approverName: 'Gestor da obra',
      createdAt: '2026-10-10T15:00:00.000Z',
    },
  ],
  comments: [],
  attachments: [],
};

beforeAll(async () => {
  await i18n.changeLanguage('pt-BR');
});

describe('exportPurchaseRequestPdf', () => {
  it('gera a ficha da solicitação em PDF com o nome padrão', async () => {
    await exportPurchaseRequestPdf(request);
    const [file] = downloads;
    expect(file?.fileName).toMatch(
      /^falcao-solicitacao-materiais-para-a-laje-do-bloco-b-\d{4}-\d{2}-\d{2}\.pdf$/,
    );
    const bytes = await bytesOf(file!.blob);
    expect(new TextDecoder('latin1').decode(bytes.slice(0, 5))).toBe('%PDF-');
    const dir = process.env.EXPORT_DUMP_DIR;
    if (dir) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, file!.fileName), Buffer.from(bytes));
    }
  });
});
