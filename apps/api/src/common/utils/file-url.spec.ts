import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { FILE_URL_TTL_SECONDS, fileUrl, isValidFileSignature } from "./file-url";

const parse = (url: string) => {
  const parsed = new URL(url, "http://x");
  return {
    path: decodeURIComponent(parsed.pathname.replace("/api/v1/files/", "")),
    e: parsed.searchParams.get("e") ?? undefined,
    s: parsed.searchParams.get("s") ?? undefined,
  };
};

describe("links temporários de arquivo (SEC-002)", () => {
  before(() => {
    process.env.JWT_SECRET = "segredo-de-teste-1234567890";
  });
  const now = Date.UTC(2026, 9, 28, 12, 0, 0);
  const path = "purchase-requests/0b8e/arquivo.pdf";

  it("o link gerado abre o próprio arquivo", () => {
    const { path: p, e, s } = parse(fileUrl(path, now));
    assert.equal(p, path);
    assert.equal(isValidFileSignature(p, e, s, now), true);
  });

  it("vale entre 2h e 2h30 e expira depois", () => {
    const { e, s } = parse(fileUrl(path, now));
    const exp = Number(e) * 1000;
    assert.ok(exp - now >= FILE_URL_TTL_SECONDS * 1000 && exp - now <= (FILE_URL_TTL_SECONDS + 1800) * 1000);
    assert.equal(isValidFileSignature(path, e, s, exp + 1000), false);
  });

  it("o mesmo arquivo gera o mesmo link durante a janela (o navegador reaproveita)", () => {
    const midBucket = now + 10 * 60_000; // 12:10 — o link só muda na virada do bloco de 30 min
    assert.equal(fileUrl(path, midBucket), fileUrl(path, midBucket + 60_000));
  });

  it("assinatura não serve para outro arquivo, outra validade nem outro segredo", () => {
    const { e, s } = parse(fileUrl(path, now));
    assert.equal(isValidFileSignature("documents/outro.pdf", e, s, now), false);
    assert.equal(isValidFileSignature("purchase-requests/0b8e/../../.env", e, s, now), false);
    assert.equal(isValidFileSignature(path, String(Number(e) + 3600), s, now), false);
    assert.equal(isValidFileSignature(path, e, `${s}x`, now), false);
    assert.equal(isValidFileSignature(path, undefined, s, now), false);
    assert.equal(isValidFileSignature(path, "1e99", s, now), false);
    process.env.JWT_SECRET = "outro-segredo-0987654321";
    assert.equal(isValidFileSignature(path, e, s, now), false);
    process.env.JWT_SECRET = "segredo-de-teste-1234567890";
  });
});
