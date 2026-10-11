import i18n, { type Resource, type ResourceLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { DEFAULT_LOCALE, LOCALES, NAMESPACES } from '@/constants/i18n';

/**
 * Carrega todos os arquivos de tradução automaticamente — evita uma lista
 * manual de imports por locale/namespace (hoje 3 locales × 8 namespaces).
 * Para adicionar um locale novo: criar a pasta `locales/<locale>/` com os
 * mesmos arquivos `.json` de `locales/pt-BR/` e registrar em `LOCALES`.
 */
const modules = import.meta.glob<{ default: ResourceLanguage }>('./locales/*/*.json', {
  eager: true,
});

const resources: Resource = {};

for (const [path, mod] of Object.entries(modules)) {
  const match = /\.\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
  if (!match) continue;
  const locale = match[1] as string;
  const namespace = match[2] as string;
  resources[locale] ??= {};
  (resources[locale] as ResourceLanguage)[namespace] = mod.default;
}

/**
 * Mantém `<html lang>` sincronizado com o idioma ativo — sem isso, leitores
 * de tela e o tradutor do navegador continuam tratando a página como
 * `pt-BR` mesmo depois de trocar para inglês/mandarim pelo `LanguageSwitcher`.
 */
function syncDocumentLang(lng: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES as unknown as string[],
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    react: { useSuspense: false },
  })
  .then(() => syncDocumentLang(i18n.resolvedLanguage ?? i18n.language))
  .catch(() => syncDocumentLang(DEFAULT_LOCALE));

i18n.on('languageChanged', syncDocumentLang);

export default i18n;
