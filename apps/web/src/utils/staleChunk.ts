/**
 * Depois de um deploy, quem estava com o site aberto tem o index antigo, que
 * aponta para arquivos (`/assets/*-hash.js`) que o build novo apagou — abrir
 * uma tela dá "Failed to fetch dynamically imported module". A saída é
 * recarregar a página uma vez para pegar a versão nova.
 */
const STALE_CHUNK_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

const RELOAD_KEY = 'falcao:stale-chunk-reload';
/** Se recarregou há pouco e o erro voltou, não é versão antiga — não entra em laço. */
const RELOAD_WINDOW_MS = 10_000;

export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return STALE_CHUNK_PATTERN.test(message);
}

/** Recarrega a página se o erro for de versão antiga. Devolve `true` quando vai recarregar. */
export function reloadOnStaleChunk(error: unknown): boolean {
  if (!isStaleChunkError(error)) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Sem sessionStorage (aba privada restrita): recarrega mesmo assim.
  }
  window.location.reload();
  return true;
}
