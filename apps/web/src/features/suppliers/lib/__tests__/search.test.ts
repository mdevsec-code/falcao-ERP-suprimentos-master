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

describe('compostos que citam cimento sem ser cimento', () => {
  const base = {
    cnpj: '04.432.419/0001-73',
    categoria: 'MATERIAIS_CONSTRUCAO' as const,
    cidade: 'Camaçari',
    estado: 'BA',
  };
  // Trechos reais de produção (cadastro feito pelo próprio fornecedor).
  const madeireira = buildSupplierSearchText({
    ...base,
    razaoSocial: 'JV Ind. e Com. de Madeiras EIRELI',
    nomeFantasia: 'Madeireira Victória',
    produtosServicos: 'Telhas de fibrocimento, ferragens, fechaduras',
    produtosServicosZh: '配套材料 各类辅助产品 包括纤维水泥屋面瓦 五金件 锁具',
  });
  const residuos = buildSupplierSearchText({
    ...base,
    razaoSocial: 'MR Soluções Ambientais',
    nomeFantasia: 'MR Soluções Ambientais',
    categoria: 'MANUTENCAO',
    produtosServicos:
      'CDRI destinado ao coprocessamento em fornos de cimento; resíduos em forno de cimento',
    produtosServicosZh: '在水泥窑中协同处置',
  });

  it('"cimento" e "水泥" não acham fibrocimento (纤维水泥) nem forno de cimento (水泥窑)', () => {
    for (const query of ['cimento', '水泥', 'cement']) {
      expect(matches(madeireira, query)).toBe(false);
      expect(matches(residuos, query)).toBe(false);
    }
  });

  it('os compostos continuam encontráveis pelo próprio nome, nos dois idiomas', () => {
    expect(matches(madeireira, 'fibrocimento')).toBe(true);
    expect(matches(madeireira, '纤维水泥')).toBe(true);
    expect(matches(residuos, 'forno de cimento')).toBe(true);
    expect(matches(residuos, '水泥窑')).toBe(true);
  });

  it('quem vende cimento continua aparecendo', () => {
    expect(matches(cimentoSo, 'cimento')).toBe(true);
    expect(matches(cimentoSo, '水泥')).toBe(true);
  });
});
