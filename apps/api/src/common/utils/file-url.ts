import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Links temporários dos arquivos enviados (anexos, notas fiscais, documentos,
 * fotos). A API só devolve o link a quem passou pela regra de acesso do
 * registro; o link carrega validade e assinatura e é conferido em `/files`.
 * Sem isso, qualquer pessoa com a URL baixava o arquivo para sempre.
 *
 * A validade é arredondada para blocos de 30 min: o mesmo arquivo gera o mesmo
 * link durante um tempo (o navegador reaproveita a imagem) e vale de 2h a 2h30.
 */
export const FILE_URL_TTL_SECONDS = 2 * 60 * 60;
const BUCKET_SECONDS = 30 * 60;

function key(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado.");
  // Chave própria derivada do segredo: uma assinatura de arquivo não serve para nada além disso.
  return createHmac("sha256", secret).update("file-url:v1").digest("hex");
}

function sign(path: string, expiresAt: number): string {
  return createHmac("sha256", key()).update(`${path}\n${expiresAt}`).digest("base64url");
}

/** `/api/v1/files/<caminho>?e=<validade>&s=<assinatura>` para um caminho relativo da pasta de uploads. */
export function fileUrl(path: string, nowMs: number = Date.now()): string {
  const now = Math.floor(nowMs / 1000);
  const expiresAt = Math.ceil((now + FILE_URL_TTL_SECONDS) / BUCKET_SECONDS) * BUCKET_SECONDS;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `/api/v1/files/${encoded}?e=${expiresAt}&s=${sign(path, expiresAt)}`;
}

export function fileUrlOrNull(path: string | null | undefined): string | null {
  return path ? fileUrl(path) : null;
}

/** Assinatura válida e dentro da validade (o caminho é conferido de novo no storage). */
export function isValidFileSignature(
  path: string,
  expiresAt: string | undefined,
  signature: string | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!expiresAt || !signature || !/^\d{1,12}$/.test(expiresAt)) return false;
  const exp = Number(expiresAt);
  if (exp * 1000 < nowMs) return false;
  const expected = Buffer.from(sign(path, exp));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
