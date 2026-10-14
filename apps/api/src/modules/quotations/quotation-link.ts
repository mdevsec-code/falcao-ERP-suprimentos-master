import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Link de resposta do fornecedor: `<idDoConvite>.<assinatura>`.
 *
 * A assinatura é um HMAC do id + nonce com o segredo da API — o banco guarda só
 * o nonce, então um vazamento do banco não revela links válidos. Trocar o nonce
 * invalida o link anterior.
 */
const TOKEN_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/;

export const newLinkNonce = () => randomBytes(16).toString("hex");

function signature(secret: string, quotationSupplierId: string, nonce: string): string {
  return createHmac("sha256", secret).update(`quotation-link:v1:${quotationSupplierId}:${nonce}`).digest("base64url");
}

export function buildLinkToken(secret: string, quotationSupplierId: string, nonce: string): string {
  return `${quotationSupplierId}.${signature(secret, quotationSupplierId, nonce)}`;
}

/** Só confere o formato; a assinatura é validada depois, com o nonce do banco. */
export function parseLinkToken(token: string): { quotationSupplierId: string; signature: string } | null {
  const match = TOKEN_PATTERN.exec(token);
  return match ? { quotationSupplierId: match[1], signature: match[2] } : null;
}

export function isValidLinkSignature(secret: string, quotationSupplierId: string, nonce: string, received: string): boolean {
  const expected = Buffer.from(signature(secret, quotationSupplierId, nonce));
  const actual = Buffer.from(received);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
