import { describe, expect, it } from 'vitest';
import type { PurchaseRequestDetailDto } from '@falcao-erp/shared-types';

import '@/i18n';
import { wechatShareMessage } from '../wechatShare';

const request = {
  id: 'r1',
  numero: 12,
  title: 'Materiais para a laje do bloco B',
  status: 'AGUARDANDO_APROVACAO',
  currentStep: 'CUSTOS',
  requesterName: 'Ana Engenheira',
  costCenter: 'Residencial Falcão',
  items: [{}, {}],
} as unknown as PurchaseRequestDetailDto;

describe('wechatShareMessage', () => {
  it('monta a mensagem em português e chinês com a etapa e o link', () => {
    const text = wechatShareMessage(request, 'https://erp.exemplo');
    expect(text).toContain('Plano de aquisição nº 12 · 第12号采购计划');
    expect(text).toContain('Aguardando assinatura: Custos');
    expect(text).toContain('等待签字：成本');
    expect(text).toContain('Solicitante / 申请人: Ana Engenheira');
    expect(text.split('\n').at(-1)).toBe('https://erp.exemplo/solicitacoes/r1');
  });
});
