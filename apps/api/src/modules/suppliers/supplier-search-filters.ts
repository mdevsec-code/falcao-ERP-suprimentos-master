import type { Prisma } from "@prisma/client";
import { buildSupplierSearchGroups, isCjkSearchTerm, normalizeSearchText } from "@falcao-erp/shared-types";

/**
 * O que pode vir logo antes de uma palavra num texto livre (descrição de
 * contrato, conta, item de cotação, nome de produto). Comparar só pelo começo
 * da palavra evita que "cimento" ache "forneCIMENTO" ou "fibroCIMENTO".
 */
const WORD_SEPARATORS = [" ", "\n", "\t", "(", "[", "/", "-", ",", ".", ";", ":", '"', "'"];

/**
 * Filtros de texto que acham `term` no começo de alguma palavra (o plural vem
 * junto: "cimento" acha "cimentos"). Ideogramas não separam palavras, então
 * em chinês vale o trecho em qualquer posição.
 */
export function wordStartFilters(term: string): Prisma.StringFilter[] {
  const mode = "insensitive" as const;
  if (isCjkSearchTerm(term)) return [{ contains: term, mode }];
  return [{ startsWith: term, mode }, ...WORD_SEPARATORS.map((sep) => ({ contains: `${sep}${term}`, mode }))];
}

/** `{ OR: [{ campo: filtro }, …] }` para cada campo × cada começo de palavra. */
function anyFieldStartsWord<K extends string>(fields: readonly K[], term: string) {
  return { OR: fields.flatMap((field) => wordStartFilters(term).map((filter) => ({ [field]: filter }))) };
}

/**
 * Cada grupo de termos da busca precisa aparecer em algum lugar do fornecedor:
 * no texto de busca (nome, CNPJ, categoria, cidade, atividades e produtos nos
 * dois idiomas), nos produtos do catálogo ligados a ele (principal,
 * alternativo ou com preço registrado), nos itens dos catálogos que enviou ou
 * no histórico (cotações respondidas com preço, contratos e contas a pagar).
 */
export function supplierSearchConditions(search: string): Prisma.SupplierWhereInput[] {
  return buildSupplierSearchGroups(search).map((variants) => ({
    OR: variants.flatMap((variant): Prisma.SupplierWhereInput[] => {
      const normal = normalizeSearchText(variant);
      const cjk = isCjkSearchTerm(normal);
      const inText: Prisma.SupplierWhereInput = { searchText: { contains: cjk ? normal : ` ${normal}` } };
      // Nos textos livres (não normalizados) termos muito curtos achariam pedaço de tudo.
      if (!cjk && variant.length < 3) return [inText];
      const product = anyFieldStartsWord(["nome", "marca"] as const, variant) as Prisma.ProductWhereInput;
      return [
        inText,
        { primaryForProducts: { some: product } },
        { alternativeProducts: { some: { product } } },
        { priceEntries: { some: { product } } },
        {
          catalogs: {
            some: { items: { some: anyFieldStartsWord(["descricao"] as const, variant) as Prisma.SupplierCatalogItemWhereInput } },
          },
        },
        // Histórico: só itens que o fornecedor cotou de fato (disponível e com
        // preço). Quem respondeu "não tenho" a um link aberto não fornece o item.
        {
          quotations: {
            some: {
              prices: {
                some: {
                  disponivel: true,
                  precoUnitario: { not: null },
                  quotationItem: anyFieldStartsWord(["descricao"] as const, variant) as Prisma.QuotationItemWhereInput,
                },
              },
            },
          },
        },
        { contracts: { some: anyFieldStartsWord(["objeto", "descricao"] as const, variant) as Prisma.ContractWhereInput } },
        { payables: { some: anyFieldStartsWord(["descricao"] as const, variant) as Prisma.PayableWhereInput } },
      ];
    }),
  }));
}
