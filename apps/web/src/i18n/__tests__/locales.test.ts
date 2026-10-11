import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, NAMESPACES } from '@/constants/i18n';

const LOCALES_DIR = path.resolve(__dirname, '../locales');
const SRC_DIR = path.resolve(__dirname, '../..');
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

type Json = { [key: string]: Json } | string | string[];

function load(locale: string, ns: string): Json {
  return JSON.parse(readFileSync(path.join(LOCALES_DIR, locale, `${ns}.json`), 'utf-8')) as Json;
}

/** Achata o JSON em chaves `a.b.c`, colapsando sufixos de plural (idiomas têm formas diferentes). */
function flatten(value: Json, prefix = ''): string[] {
  if (typeof value === 'string' || Array.isArray(value)) return [prefix.replace(PLURAL_SUFFIX, '')];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

function keySet(locale: string, ns: string): Set<string> {
  return new Set(flatten(load(locale, ns)));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

describe('i18n locales', () => {
  for (const locale of LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
    for (const ns of NAMESPACES) {
      it(`${locale}/${ns} tem exatamente as chaves de ${DEFAULT_LOCALE}`, () => {
        const reference = [...keySet(DEFAULT_LOCALE, ns)].sort();
        const translated = [...keySet(locale, ns)].sort();
        expect(translated).toEqual(reference);
      });
    }
  }

  it('toda chave estática `ns:caminho` usada no código existe em pt-BR', () => {
    const keyPattern = /['"`]((?:[a-zA-Z]+)):([a-zA-Z0-9_.]+)['"`]/g;
    const known = new Map<string, Set<string>>(
      NAMESPACES.map((ns) => [ns, keySet(DEFAULT_LOCALE, ns)]),
    );
    const missing: string[] = [];

    // Valores de permissão (`users:manage`, `audit:read`) têm o mesmo formato
    // `ns:chave` e colidiriam com os namespaces homônimos.
    const ignored = new Set([path.join(SRC_DIR, 'constants', 'permissions.ts')]);

    for (const file of sourceFiles(SRC_DIR).filter((f) => !ignored.has(f))) {
      const content = readFileSync(file, 'utf-8');
      for (const match of content.matchAll(keyPattern)) {
        const [, ns, key] = match;
        const keys = known.get(ns as (typeof NAMESPACES)[number]);
        if (!keys || !key) continue; // não é uma chave de tradução (ex.: 'http:', 'node:fs')
        if (!keys.has(key)) missing.push(`${ns}:${key} (${path.relative(SRC_DIR, file)})`);
      }
    }

    expect(missing).toEqual([]);
  });
});
