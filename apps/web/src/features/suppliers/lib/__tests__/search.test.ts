import { describe, expect, it } from 'vitest';
import {
  buildSupplierSearchGroups,
  buildSupplierSearchText,
  isCjkSearchTerm,
  normalizeSearchText,
} from '@falcao-erp/shared-types';

/** Mesma regra da API: ideograma por trecho, letras pelo começo da palavra. */
function matches(searchText: string, query: string): boolean {
  return buildSupplierSearchGroups(query).every((group) =>
    group.some((term) => {
      const normal = normalizeSearchText(term);
      return isCjkSearchTerm(normal)
        ? searchText.includes(normal)
        : searchText.includes(` ${normal}`);
    }),
  );
}

const cimentoSo = buildSupplierSearchText({
  razaoSocial: 'Casa do Construtor Sorriso Ltda',
  nomeFantasia: 'Casa do Construtor',
  cnpj: '12.345.678/0001-90',
  categoria: 'MATERIAIS_CONSTRUCAO',
  cidade: 'Sorriso',
  estado: 'MT',
  atividades: 'Revenda de materiais básicos para obra',
  produtosServicos: 'Cimento CP-II, tijolos de cimento, blocos estruturais, areia e brita',
});

const soChines = buildSupplierSearchText({
  razaoSocial: 'Hua Xing Importação Ltda',
  nomeFantasia: 'Hua Xing',
  cnpj: '98.765.432/0001-10',
  categoria: 'EQUIPAMENTOS',
  cidade: 'Cuiabá',
  estado: 'MT',
  produtosServicosZh: '电缆、配电箱、变压器',
});

describe('busca de fornecedores por palavra-chave', () => {
  it('acha pelo produto, com várias palavras e plural', () => {
    expect(matches(cimentoSo, 'cimento')).toBe(true);
    expect(matches(cimentoSo, 'tijolo de cimento')).toBe(true);
    expect(matches(cimentoSo, 'Tijolos')).toBe(true);
    expect(matches(cimentoSo, 'BLOCO')).toBe(true);
  });

  it('busca em chinês e inglês acha quem escreveu em português (glossário)', () => {
    expect(matches(cimentoSo, '水泥')).toBe(true);
    expect(matches(cimentoSo, '水泥砖')).toBe(true);
    expect(matches(cimentoSo, 'cement brick')).toBe(true);
    expect(matches(cimentoSo, 'sand')).toBe(true);
  });

  it('busca em português acha quem escreveu só em chinês', () => {
    expect(matches(soChines, 'cabo')).toBe(true);
    expect(matches(soChines, 'transformador')).toBe(true);
    expect(matches(soChines, 'quadro elétrico')).toBe(true);
    expect(matches(soChines, '变压器')).toBe(true);
  });

  it('ignora acento, maiúscula e palavras vazias', () => {
    expect(matches(cimentoSo, 'Básicos para OBRA')).toBe(true);
    expect(matches(soChines, 'equipamentos')).toBe(true);
    expect(matches(soChines, 'cuiaba')).toBe(true);
  });

  it('não acha o que não tem nem pedaço de outra palavra', () => {
    expect(matches(cimentoSo, 'cabo')).toBe(false);
    expect(matches(soChines, 'cimento')).toBe(false);
    expect(matches(cimentoSo, 'cal')).toBe(false); // não confunde com "materiais"/"local"
    expect(matches(cimentoSo, 'tijolo de vidro')).toBe(false);
  });

  it('acha pelo CNPJ com ou sem máscara', () => {
    expect(matches(cimentoSo, '12345678000190')).toBe(true);
    expect(matches(cimentoSo, '12.345.678')).toBe(true);
  });
});
