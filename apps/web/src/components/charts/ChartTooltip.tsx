interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  /** Formata o valor exibido (moeda, contagem…). */
  formatValue: (value: number) => string;
}

/** Tooltip padrão dos gráficos: superfície do tema, rótulo + valor em texto (nunca na cor da série). */
export function ChartTooltip({ active, payload, label, formatValue }: ChartTooltipProps) {
  const first = payload?.[0];
  if (!active || !first) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-ink-soft">{formatValue(first.value)}</p>
    </div>
  );
}
