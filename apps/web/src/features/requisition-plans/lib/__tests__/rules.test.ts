import { describe, expect, it } from 'vitest';
import {
  consolidatePlanItems,
  isValidCnpj,
  type ConsolidationInput,
} from '@falcao-erp/shared-types';

import { parsePrice } from '@/features/supplier-portal/lib/catalog-template';

const item = (
  id: string,
  description: string,
  quantity: string,
  extra: Partial<ConsolidationInput['items'][number]> = {},
): ConsolidationInput['items'][number] => ({
  id,
  productId: null,
  productCodigo: null,
  description,
  quantity,
  unit: 'UN',
  marca: null,
  referencia: null,
  ...extra,
});

describe('consolidatePlanItems', () => {
  const requests: ConsolidationInput[] = [
    {
      purchaseRequestId: 'r1',
      purchaseRequestTitle: 'Bloco A',
      items: [
        item('a1', 'Cimento CP-II 50kg', '10', { productId: 'p-cimento', unit: 'SC' }),
        item('a2', 'Luva de raspa', '5.5'),
      ],
    },
    {
      purchaseRequestId: 'r2',
      purchaseRequestTitle: 'Bloco B',
      items: [
        item('b1', 'Cimento CP II (outra descrição)', '20.25', {
          productId: 'p-cimento',
          unit: 'SC',
        }),
        // Mesmo texto com acento/caixa/espaços diferentes: soma.
        item('b2', '  LUVA  de  RASPA ', '4.5'),
        // Marca diferente pedida: fica em linha separada.
        item('b3', 'Luva de raspa', '1', { marca: '3M' }),
      ],
    },
  ];
  const result = consolidatePlanItems(requests);

  it('soma o mesmo produto e a mesma descrição, mantendo a ordem da primeira aparição', () => {
    expect(result.map((i) => [i.descricao, i.quantidade])).toEqual([
      ['Cimento CP-II 50kg', '30.25'],
      ['Luva de raspa', '10.00'],
      ['Luva de raspa', '1.00'],
    ]);
  });

  it('guarda de qual solicitação veio cada parte', () => {
    expect(result[0]?.origens.map((o) => [o.purchaseRequestTitle, o.quantidade])).toEqual([
      ['Bloco A', '10'],
      ['Bloco B', '20.25'],
    ]);
  });
});

describe('isValidCnpj', () => {
  it('aceita CNPJ válido com ou sem máscara', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  it('recusa dígito verificador errado, tamanho errado e sequências repetidas', () => {
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
    expect(isValidCnpj('1122233300018')).toBe(false);
    expect(isValidCnpj('00.000.000/0000-00')).toBe(false);
  });
});

describe('parsePrice (planilha do fornecedor)', () => {
  it('entende o formato brasileiro, o americano e o número da célula', () => {
    expect(parsePrice('1.234,56')).toBe(1234.56);
    expect(parsePrice('R$ 12,90')).toBe(12.9);
    expect(parsePrice('1234.5')).toBe(1234.5);
    expect(parsePrice(38.899)).toBe(38.9);
  });

  it('vazio fica sem preço; texto sem número vira inválido', () => {
    expect(parsePrice('')).toBeUndefined();
    expect(parsePrice(null)).toBeUndefined();
    expect(parsePrice('sob consulta')).toBeUndefined();
    expect(Number.isNaN(parsePrice('1,2,3') as number)).toBe(true);
  });
});
