import { describe, expect, it } from 'vitest';
import { analyzeQuotation, type QuotationPriceDto } from '@falcao-erp/shared-types';

const price = (
  supplier: string,
  item: string,
  value: string | null,
  disponivel = true,
): QuotationPriceDto => ({
  quotationSupplierId: supplier,
  quotationItemId: item,
  precoUnitario: value,
  marca: null,
  referencia: null,
  disponivel,
  observacao: null,
});

const items = [
  { id: 'cimento', quantidade: '80', vencedorId: null, ultimoPreco: '40.00' },
  { id: 'motor', quantidade: '1', vencedorId: null, ultimoPreco: null },
  { id: 'luva', quantidade: '10', vencedorId: null, ultimoPreco: null },
];
const suppliers = [
  { id: 'a', frete: '150.00', status: 'RESPONDIDO' as const },
  { id: 'b', frete: null, status: 'RESPONDIDO' as const },
  { id: 'c', frete: null, status: 'RECUSOU' as const },
];
const prices = [
  price('a', 'cimento', '38.50'),
  price('a', 'motor', '3100.00'),
  price('a', 'luva', null, false),
  price('b', 'cimento', '39.90'),
  price('b', 'motor', '2980.00'),
  price('b', 'luva', '11.20'),
  // Quem recusou não entra na comparação, mesmo com preço antigo gravado.
  price('c', 'cimento', '1.00'),
];

describe('analyzeQuotation', () => {
  const result = analyzeQuotation({ items, suppliers, prices });

  it('acha o menor e o maior preço de cada item, ignorando quem recusou', () => {
    const cimento = result.items.find((i) => i.itemId === 'cimento');
    expect(cimento).toMatchObject({
      propostas: 2,
      menorPreco: '38.50',
      maiorPreco: '39.90',
      melhorFornecedorIds: ['a'],
    });
  });

  it('item sem oferta válida fica sem menor preço', () => {
    const luva = result.items.find((i) => i.itemId === 'luva');
    expect(luva?.melhorFornecedorIds).toEqual(['b']);
    const semOferta = analyzeQuotation({ items, suppliers, prices: [] }).items[0];
    expect(semOferta).toMatchObject({ propostas: 0, menorPreco: null });
  });

  it('variação contra o último preço arredonda como a planilha (−3,75% → −3,8%)', () => {
    expect(result.items.find((i) => i.itemId === 'cimento')?.variacaoUltimoPct).toBe(-3.8);
    expect(result.items.find((i) => i.itemId === 'motor')?.variacaoUltimoPct).toBeNull();
  });

  it('total por fornecedor soma preço × quantidade e o frete, em centavos exatos', () => {
    const a = result.suppliers.find((s) => s.quotationSupplierId === 'a');
    const b = result.suppliers.find((s) => s.quotationSupplierId === 'b');
    expect(a?.total).toBe('6330.00');
    expect(b?.total).toBe('6284.00');
  });

  it('ranking só entre quem cotou todos os itens', () => {
    expect(result.suppliers.find((s) => s.quotationSupplierId === 'b')).toMatchObject({
      ranking: 1,
      cotouTudo: true,
    });
    expect(result.suppliers.find((s) => s.quotationSupplierId === 'a')).toMatchObject({
      ranking: null,
      cotouTudo: false,
    });
  });

  it('total no melhor preço e economia sobre a última compra', () => {
    expect(result.totalMelhorPreco).toBe('6172.00');
    // 80 × (40,00 − 38,50) = 120,00
    expect(result.economiaVsUltimo).toBe('120.00');
    expect(result.totalVencedores).toBeNull();
  });

  it('com vencedores escolhidos, soma os escolhidos e mede a economia pelo escolhido', () => {
    const chosen = analyzeQuotation({
      items: items.map((i) => ({
        ...i,
        vencedorId: i.id === 'cimento' ? 'b' : i.id === 'motor' ? 'b' : 'b',
      })),
      suppliers,
      prices,
    });
    expect(chosen.itensComVencedor).toBe(3);
    expect(chosen.totalVencedores).toBe('6284.00');
    // 80 × (40,00 − 39,90) = 8,00
    expect(chosen.economiaVsUltimo).toBe('8.00');
  });

  it('empate no menor preço aponta todos os empatados', () => {
    const tie = analyzeQuotation({
      items: [{ id: 'x', quantidade: '3', vencedorId: null, ultimoPreco: null }],
      suppliers: [
        { id: 'a', frete: null, status: 'RESPONDIDO' },
        { id: 'b', frete: null, status: 'RESPONDIDO' },
      ],
      prices: [price('a', 'x', '10.00'), price('b', 'x', '10.00')],
    });
    expect(tie.items[0]?.melhorFornecedorIds.sort()).toEqual(['a', 'b']);
  });

  it('não acumula erro de ponto flutuante', () => {
    const r = analyzeQuotation({
      items: [{ id: 'x', quantidade: '3', vencedorId: null, ultimoPreco: null }],
      suppliers: [{ id: 'a', frete: null, status: 'RESPONDIDO' }],
      prices: [price('a', 'x', '0.10')],
    });
    expect(r.suppliers[0]?.total).toBe('0.30');
  });
});
