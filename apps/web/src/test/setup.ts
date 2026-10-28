import '@testing-library/jest-dom/vitest';
import '@/i18n';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * No teste não há servidor para os arquivos de `src/assets`: a fonte do PDF
 * (`/src/assets/fonts/…?url`) é lida do disco, e o resto segue para o fetch normal.
 */
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('/src/assets/')) {
    const bytes = await readFile(resolve(__dirname, '..', '..', url.slice(1).split('?')[0]!));
    return new Response(bytes);
  }
  return realFetch(input, init);
}) as typeof fetch;
