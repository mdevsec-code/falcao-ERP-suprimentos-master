/**
 * Datas "de calendário" (sem hora) trafegam como `YYYY-MM-DD`. Estas funções
 * comparam strings nesse formato sem passar por `Date`, evitando o clássico
 * deslocamento de um dia causado pelo fuso horário.
 */

/** `YYYY-MM-DD` da data local de `date` (padrão: agora). */
export function toDateOnly(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Soma `days` dias a uma data `YYYY-MM-DD`. */
export function addDays(dateOnly: string, days: number): string {
  const [y, m, d] = dateOnly.split("-").map(Number) as [number, number, number];
  return toDateOnly(new Date(y, m - 1, d + days));
}

/** Diferença em dias inteiros (`to - from`) entre duas datas `YYYY-MM-DD`. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = to.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Situação de um prazo em relação a hoje, com janela de alerta. */
export type DeadlineState = "OK" | "VENCENDO" | "VENCIDO";

export function deadlineState(dueDate: string, alertDays: number, today: string = toDateOnly()): DeadlineState {
  const remaining = daysBetween(today, dueDate);
  if (remaining < 0) return "VENCIDO";
  if (remaining <= alertDays) return "VENCENDO";
  return "OK";
}
