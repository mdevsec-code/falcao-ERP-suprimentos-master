import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Links públicos (sem login): `<id>.<assinatura>`.
 *
 * A assinatura é um HMAC do escopo + id + nonce com o segredo da API — o banco
 * guarda só o nonce, então um vazamento do banco não revela links válidos.
 * Trocar o nonce invalida o link anterior. O escopo impede que o token de um
 * tipo de link (ex.: convite) seja aceito em outro (ex.: catálogo).
 */
export type LinkScope =
  /** Convite de um fornecedor para responder uma cotação (id = QuotationSupplier). */
  | "quotation-link"
  /** Link aberto da cotação: qualquer fornecedor entra com o CNPJ (id = Quotation). */
  | "quotation-open"
  /** Link para fornecedores enviarem catálogo de produtos (id = Company). */
  | "catalog-link"
  /** Link para o fornecedor fazer o próprio cadastro (id = Company). */
  | "supplier-signup";

const TOKEN_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/;

export const newLinkNonce = () => randomBytes(16).toString("hex");

function signature(secret: string, scope: LinkScope, id: string, nonce: string): string {
  return createHmac("sha256", secret).update(`${scope}:v1:${id}:${nonce}`).digest("base64url");
}

export function buildLinkToken(secret: string, scope: LinkScope, id: string, nonce: string): string {
  return `${id}.${signature(secret, scope, id, nonce)}`;
}

/** Só confere o formato; a assinatura é validada depois, com o nonce do banco. */
export function parseLinkToken(token: string): { id: string; signature: string } | null {
  const match = TOKEN_PATTERN.exec(token);
  return match ? { id: match[1], signature: match[2] } : null;
}

export function isValidLinkSignature(
  secret: string,
  scope: LinkScope,
  id: string,
  nonce: string,
  received: string,
): boolean {
  const expected = Buffer.from(signature(secret, scope, id, nonce));
  const actual = Buffer.from(received);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
