/**
 * Colunas `@db.Date` chegam do Prisma como `Date` à meia-noite UTC. A API
 * troca essas datas com o Web como `YYYY-MM-DD` — estas funções fazem a
 * ida e a volta sem depender do fuso do servidor.
 */

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` → `Date` (meia-noite UTC), no formato que o Prisma grava em `@db.Date`. */
export function fromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** `Date` de uma coluna `@db.Date` → `YYYY-MM-DD`. */
export function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toDateOnlyOrNull(value: Date | null | undefined): string | null {
  return value ? toDateOnlyString(value) : null;
}

/** Decimal do Prisma (ou soma nula de um aggregate) → string com 2 casas. */
export function money(value: { toString(): string } | number | null | undefined): string {
  if (value === null || value === undefined) return "0.00";
  return Number(value.toString()).toFixed(2);
}
