import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@falcao-erp/shared-types";
import { canSeeSensitiveDocuments, documentVisibilityWhere, isSensitiveDocument } from "./document-access";

const SEE_SENSITIVE = ["ADMIN", "MANAGER", "BUYER", "FINANCE", "AUDITOR"];
const HIDDEN = ["WAREHOUSE", "REQUESTER"];

describe("documentos sigilosos (SEC-004)", () => {
  it("cobre todos os perfis do sistema", () => {
    assert.deepEqual([...SEE_SENSITIVE, ...HIDDEN].sort(), Object.values(Role).sort());
  });

  for (const role of SEE_SENSITIVE) {
    it(`${role} vê documentos de contrato e nota fiscal (sem filtro extra)`, () => {
      assert.equal(canSeeSensitiveDocuments(role), true);
      assert.equal(documentVisibilityWhere(role), undefined);
    });
  }

  for (const role of HIDDEN) {
    it(`${role} não vê documentos sigilosos`, () => {
      assert.equal(canSeeSensitiveDocuments(role), false);
      assert.deepEqual(documentVisibilityWhere(role), {
        contractId: null,
        categoria: { notIn: ["CONTRATO", "NOTA_FISCAL"] },
      });
    });
  }

  it("sigiloso: ligado a contrato, ou categoria contrato / nota fiscal", () => {
    assert.equal(isSensitiveDocument({ categoria: "MANUAL", contractId: "c1" }), true);
    assert.equal(isSensitiveDocument({ categoria: "CONTRATO", contractId: null }), true);
    assert.equal(isSensitiveDocument({ categoria: "NOTA_FISCAL", contractId: null }), true);
    assert.equal(isSensitiveDocument({ categoria: "MANUAL", contractId: null }), false);
    assert.equal(isSensitiveDocument({ categoria: "CERTIDAO", contractId: undefined }), false);
  });
});
