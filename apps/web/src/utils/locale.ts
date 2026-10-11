import i18n from '@/i18n';

/**
 * Locale BCP-47 atual da UI (ex.: `pt-BR`, `en-US`, `zh-CN`), para uso em
 * `Intl.*` fora de componentes React (utils puros). Dentro de componentes,
 * prefira `useTranslation().i18n.language` — este helper lê o valor mais
 * recente do singleton do i18next a cada chamada, então funciona bem em
 * funções invocadas durante a renderização.
 */
export function getIntlLocale(): string {
  return i18n.language || 'pt-BR';
}
