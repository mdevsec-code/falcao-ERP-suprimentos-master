import { addDays, toDateOnly } from '@falcao-erp/shared-types';

/** Primeiro dia (`YYYY-MM-DD`) do mês de `date`. */
export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/** Mesmo dia 1 deslocado `delta` meses. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return toDateOnly(new Date(y, m - 1 + delta, 1));
}

/**
 * Grade do mês em 6 semanas completas (42 dias), começando no domingo —
 * altura estável ao navegar entre meses.
 */
export function monthGrid(month: string): string[] {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const first = new Date(y, m - 1, 1);
  const start = addDays(toDateOnly(first), -first.getDay());
  return Array.from({ length: 42 }, (_, idx) => addDays(start, idx));
}

/** Rótulos curtos dos dias da semana (dom → sáb) no idioma ativo. */
export function weekdayLabels(locale: string): string[] {
  // 2026-10-04 é um domingo.
  return Array.from({ length: 7 }, (_, idx) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' })
      .format(new Date(2026, 9, 4 + idx))
      .replace('.', ''),
  );
}

export function monthTitle(month: string, locale: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const text = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  );
  return text.charAt(0).toUpperCase() + text.slice(1);
}
