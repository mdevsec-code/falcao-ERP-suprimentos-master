import i18n from '@/i18n';

/**
 * Cria um objeto que se comporta como um `Record<K, string>` fixo (mesma API
 * usada há tempos pelos consumidores — `LABELS[key]`), mas cada leitura
 * busca a tradução atual em `enums:<namespace>.<key>` via i18next. Assim o
 * rótulo acompanha a troca de idioma (`LanguageSwitcher`) sem precisar
 * alterar os componentes que já fazem `LABELS[key]` — o valor é resolvido
 * de novo a cada acesso, não fica congelado no idioma de quando o módulo
 * carregou.
 */
export function createTranslatedLabels<K extends string>(namespace: string): Record<K, string> {
  return new Proxy({} as Record<K, string>, {
    get(_target, prop): string {
      return i18n.t(`enums:${namespace}.${String(prop)}`);
    },
  });
}
