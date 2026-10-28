import i18n from '@/i18n';
import { LOCALES, type Locale } from '@/constants/i18n';
import { labelNamespace } from '@/utils/i18nLabels';

/**
 * Idioma dos arquivos exportados (PDF, Excel, CSV), independente do idioma da
 * tela: um idioma só, ou dois lado a lado ("Fornecedores / 供应商"). A escolha
 * fica no navegador e vale para todos os relatórios.
 */
export interface ExportLanguages {
  primary: Locale;
  /** `null` = arquivo em um idioma só. */
  secondary: Locale | null;
}

export const DEFAULT_EXPORT_LANGUAGES: ExportLanguages = { primary: 'pt-BR', secondary: 'zh-CN' };

const STORAGE_KEY = 'falcao:export-languages';
const SEPARATOR = ' / ';

const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

export function loadExportLanguages(): ExportLanguages {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<
      Record<keyof ExportLanguages, unknown>
    > | null;
    if (saved && isLocale(saved.primary)) {
      const secondary =
        isLocale(saved.secondary) && saved.secondary !== saved.primary ? saved.secondary : null;
      return { primary: saved.primary, secondary };
    }
  } catch {
    // Sem acesso ao armazenamento: fica o padrão.
  }
  return DEFAULT_EXPORT_LANGUAGES;
}

export function saveExportLanguages(value: ExportLanguages): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // A escolha só não fica lembrada.
  }
}

/** Idiomas do arquivo sendo gerado agora; `null` fora de uma exportação. */
let active: Locale[] | null = null;

/** Roda a exportação com os idiomas escolhidos (`xt` e `xlabel` passam a usá-los). */
export async function withExportLanguages<T>(
  languages: ExportLanguages,
  run: () => Promise<T>,
): Promise<T> {
  const previous = active;
  active = languages.secondary ? [languages.primary, languages.secondary] : [languages.primary];
  try {
    return await run();
  } finally {
    active = previous;
  }
}

/** Idiomas do arquivo; fora de uma exportação, o idioma da tela. */
export function exportLocales(): Locale[] {
  return active ?? [isLocale(i18n.language) ? i18n.language : 'pt-BR'];
}

/** Há chinês no arquivo (o PDF precisa da fonte com ideogramas). */
export const exportHasChinese = () => exportLocales().includes('zh-CN');

/** Tradução nos idiomas do arquivo: "Fornecedores / 供应商" (repetida só uma vez se igual). */
export function xt(key: string, options?: Record<string, unknown>): string {
  const texts = exportLocales().map((lng) => i18n.t(key, { ...options, lng }));
  return [...new Set(texts)].join(SEPARATOR);
}

/** Rótulo de enum (`SUPPLIER_CATEGORY_LABELS` etc.) nos idiomas do arquivo. */
export function xlabel<K extends string>(labels: Record<K, string>, value: K): string {
  const namespace = labelNamespace(labels);
  return namespace ? xt(`enums:${namespace}.${value}`) : labels[value];
}

/**
 * Texto para o nome do arquivo: o primeiro idioma com letras latinas (o nome
 * vira `falcao-fornecedores-…`; ideogramas sumiriam na conversão).
 */
export function fileT(key: string, options?: Record<string, unknown>): string {
  const lng = exportLocales().find((locale) => locale !== 'zh-CN') ?? 'pt-BR';
  return i18n.t(key, { ...options, lng });
}
