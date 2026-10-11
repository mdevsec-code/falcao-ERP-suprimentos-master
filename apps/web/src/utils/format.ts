import { getIntlLocale } from './locale';

/**
 * Utilitários de formatação. Datas/números seguem o idioma ativo da UI
 * (`getIntlLocale()`) — reconstroem o `Intl.*` a cada chamada em vez de
 * cachear uma instância fixa em `pt-BR`, para acompanhar a troca de idioma
 * pelo `LanguageSwitcher` sem precisar recarregar a página.
 */

/**
 * Extrai as iniciais (até 2) de um nome completo.
 *
 * @example
 *   getInitials('Maria Silva Santos') // 'MS'
 *   getInitials('  joão  ')           // 'J'
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Formata data no padrão `dd/MM/yyyy`. Aceita `Date` ou string ISO.
 * Retorna `null` quando o input é inválido.
 */
export function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(getIntlLocale(), { dateStyle: 'short' }).format(d);
}

export function formatTime(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(getIntlLocale(), { hour: '2-digit', minute: '2-digit' }).format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(getIntlLocale(), {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

/** Moeda sempre em Reais (BRL) — a operação é no Brasil — mas o agrupamento
 * de dígitos/posição do símbolo seguem o idioma ativo da UI. Aceita string
 * porque a API serializa colunas `Decimal` do Prisma como texto (`"12.50"`). */
export function formatCurrencyBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat(getIntlLocale(), { style: 'currency', currency: 'BRL' }).format(
    numeric,
  );
}

/** Tamanho de arquivo legível: `512 B`, `34 KB`, `2,1 MB`. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'] as const;
  let value = bytes / 1024;
  let unit: (typeof units)[number] = 'KB';
  for (const next of units.slice(1)) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  const digits = value < 10 && unit !== 'KB' ? 1 : 0;
  return `${new Intl.NumberFormat(getIntlLocale(), { maximumFractionDigits: digits }).format(value)} ${unit}`;
}

/** Máscara de CPF: `000.000.000-00`. Remove caracteres não-numéricos antes. */
export function formatCPF(value: string | null | undefined): string {
  if (!value) return '';
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Máscara de CNPJ: `00.000.000/0000-00`. */
export function formatCNPJ(value: string | null | undefined): string {
  if (!value) return '';
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Máscara de telefone BR: `(00) 0000-0000` ou `(00) 0 0000-0000`. */
export function formatPhoneBR(value: string | null | undefined): string {
  if (!value) return '';
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Tempo relativo: "há 5 min", "há 2 h", "ontem", "há 3 d". */
export function relativeTime(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(getIntlLocale(), { numeric: 'auto' });
  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return rtf.format(-diffH, 'hour');
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return rtf.format(-diffD, 'day');
  return formatDate(d) ?? '';
}

/** Trunca string longa com reticências. */
export function truncate(value: string, maxLength = 50): string {
  if (!value) return '';
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}
