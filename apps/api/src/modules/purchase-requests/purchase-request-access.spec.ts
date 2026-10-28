import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role, type ApprovalStep } from "@falcao-erp/shared-types";
import {
  canRemovePurchaseRequestAttachment,
  canViewPurchaseRequest,
  type PurchaseRequestAccessFacts,
} from "./purchase-request-access";

const ALL_ROLES = Object.values(Role);
const SEE_ALL_ROLES = ALL_ROLES.filter((role) => role !== "REQUESTER");

const me = (role: string) => ({ userId: "eu", role });

/** Solicitação de um colega, aguardando a etapa de compras. */
const colleagues = (overrides: Partial<PurchaseRequestAccessFacts> = {}): PurchaseRequestAccessFacts => ({
  requesterId: "colega",
  status: "AGUARDANDO_APROVACAO",
  currentStep: "COMPRAS",
  signerIds: [],
  ...overrides,
});
const none: ApprovalStep[] = [];

describe("canViewPurchaseRequest", () => {
  it("cobre todos os perfis do sistema", () => {
    assert.deepEqual([...ALL_ROLES].sort(), [...SEE_ALL_ROLES, "REQUESTER"].sort());
    assert.equal(ALL_ROLES.length, 7);
  });

  for (const role of SEE_ALL_ROLES) {
    it(`${role} vê a solicitação de outra pessoa, em qualquer situação`, () => {
      assert.equal(canViewPurchaseRequest(me(role), colleagues(), none), true);
      assert.equal(canViewPurchaseRequest(me(role), colleagues({ status: "CONCLUIDO", currentStep: null }), none), true);
    });
  }

  it("REQUESTER vê a própria solicitação", () => {
    assert.equal(canViewPurchaseRequest(me("REQUESTER"), colleagues({ requesterId: "eu" }), none), true);
    assert.equal(
      canViewPurchaseRequest(me("REQUESTER"), colleagues({ requesterId: "eu", status: "REJEITADO", currentStep: null }), none),
      true,
    );
  });

  it("REQUESTER não vê a de um colega trocando o id", () => {
    assert.equal(canViewPurchaseRequest(me("REQUESTER"), colleagues(), none), false);
    assert.equal(canViewPurchaseRequest(me("REQUESTER"), colleagues({ status: "EM_COMPRAS", currentStep: null }), none), false);
  });

  it("REQUESTER aprovador vê a de um colega que espera a assinatura dele", () => {
    assert.equal(canViewPurchaseRequest(me("REQUESTER"), colleagues(), ["COMPRAS"]), true);
  });

  it("REQUESTER aprovador de outra etapa não vê", () => {
    assert.equal(canViewPurchaseRequest(me("REQUESTER"), colleagues(), ["TECNICO", "CUSTOS"]), false);
  });

  it("a etapa só vale enquanto a solicitação aguarda assinatura", () => {
    assert.equal(
      canViewPurchaseRequest(me("REQUESTER"), colleagues({ status: "EM_COMPRAS", currentStep: "COMPRAS" }), ["COMPRAS"]),
      false,
    );
    assert.equal(
      canViewPurchaseRequest(me("REQUESTER"), colleagues({ currentStep: null }), ["COMPRAS"]),
      false,
    );
  });

  it("REQUESTER continua vendo a que já assinou, depois que ela avança", () => {
    const signed = colleagues({ status: "EM_COMPRAS", currentStep: null, signerIds: ["outro", "eu"] });
    assert.equal(canViewPurchaseRequest(me("REQUESTER"), signed, none), true);
  });
});

describe("canRemovePurchaseRequestAttachment", () => {
  const request = { requesterId: "colega" };
  const theirs = { uploadedById: "colega" };

  for (const role of ["ADMIN", "MANAGER", "BUYER"]) {
    it(`${role} remove anexo de qualquer pessoa`, () => {
      assert.equal(canRemovePurchaseRequestAttachment(me(role), request, theirs), true);
    });
  }

  for (const role of ["FINANCE", "WAREHOUSE", "AUDITOR", "REQUESTER"]) {
    it(`${role} só remove o que enviou ou o da própria solicitação`, () => {
      assert.equal(canRemovePurchaseRequestAttachment(me(role), request, theirs), false);
      assert.equal(canRemovePurchaseRequestAttachment(me(role), request, { uploadedById: "eu" }), true);
      assert.equal(canRemovePurchaseRequestAttachment(me(role), { requesterId: "eu" }, theirs), true);
    });
  }
});
