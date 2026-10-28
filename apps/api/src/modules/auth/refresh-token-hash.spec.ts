import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as bcrypt from "bcryptjs";
import { hashRefreshToken } from "./refresh-token-hash";

// Dois refresh tokens do mesmo usuário: os primeiros 72 bytes (cabeçalho + começo
// do payload com o id) são iguais; o resto (iat, exp, jti, assinatura) muda.
const prefix = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTEyMzQ".padEnd(72, "x");
const oldToken = `${prefix}.antigo-ja-revogado.assinaturaA`;
const activeToken = `${prefix}.sessao-ativa.assinaturaB`;

describe("hashRefreshToken (SEC-003)", () => {
  it("reproduz a falha antiga: bcrypt aceita um token diferente com o mesmo começo", async () => {
    const stored = await bcrypt.hash(activeToken, 4);
    assert.equal(await bcrypt.compare(oldToken, stored), true);
  });

  it("o hash novo considera o token inteiro", () => {
    assert.notEqual(hashRefreshToken(oldToken), hashRefreshToken(activeToken));
  });

  it("é determinístico (dá para buscar pelo valor no banco)", () => {
    assert.equal(hashRefreshToken(activeToken), hashRefreshToken(activeToken));
    assert.match(hashRefreshToken(activeToken), /^[0-9a-f]{64}$/);
  });
});
