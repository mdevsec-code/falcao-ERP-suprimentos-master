import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Prisma } from "@prisma/client";
import { supplierSearchConditions, wordStartFilters } from "./supplier-search-filters";

/** Avalia um StringFilter (startsWith/contains, sem caixa) como o Postgres faria. */
function matches(value: string, filter: Prisma.StringFilter): boolean {
  const text = value.toLowerCase();
  if (typeof filter.startsWith === "string") return text.startsWith(filter.startsWith.toLowerCase());
  if (typeof filter.contains === "string") return text.includes(filter.contains.toLowerCase());
  return false;
}
const anyMatch = (value: string, term: string) => wordStartFilters(term).some((f) => matches(value, f));

describe("busca de fornecedores — começo de palavra nos textos livres", () => {
  it("'cimento' não acha 'fornecimento' nem 'fibrocimento'", () => {
    assert.equal(anyMatch("Fornecimento de madeira para formas", "cimento"), false);
    assert.equal(anyMatch("Telha de fibrocimento 6mm", "cimento"), false);
  });

  it("'cimento' acha a palavra no começo, no meio, após pontuação e no plural", () => {
    assert.equal(anyMatch("Cimento CP-II 50kg", "cimento"), true);
    assert.equal(anyMatch("Saco de cimento", "cimento"), true);
    assert.equal(anyMatch("Agregados/cimento", "cimento"), true);
    assert.equal(anyMatch("Material (cimentos e areia)", "cimento"), true);
  });

  it("ideogramas valem em qualquer posição", () => {
    assert.equal(anyMatch("硅酸盐水泥", "水泥"), true);
  });
});

describe("busca de fornecedores — histórico de cotações", () => {
  it("só conta item cotado de fato (disponível e com preço)", () => {
    const [group] = supplierSearchConditions("cimento");
    const json = JSON.stringify(group);
    assert.match(json, /"quotations":\{"some":\{"prices":\{"some":\{"disponivel":true,"precoUnitario":\{"not":null\}/);
  });

  it("nenhum filtro de texto livre usa 'contém' solto (sem separador antes)", () => {
    const json = JSON.stringify(supplierSearchConditions("cimento"));
    assert.equal(json.includes('"contains":"cimento"'), false);
  });
});
