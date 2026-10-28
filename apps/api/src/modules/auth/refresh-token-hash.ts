import { createHash } from "node:crypto";

/**
 * Hash do refresh token guardado no banco: SHA-256 do token inteiro.
 *
 * Não use bcrypt aqui: ele só considera os primeiros 72 bytes, e num JWT esse
 * trecho (cabeçalho + começo do payload com o id do usuário) é igual em todos
 * os tokens da mesma pessoa — qualquer token antigo "batia" com a sessão ativa.
 * O token já é longo e aleatório, então um hash rápido basta e permite buscar
 * direto pelo valor.
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
