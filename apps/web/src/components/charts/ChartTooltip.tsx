import { type ReactNode } from 'react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  /** Formata o valor exibido (moeda, contagem…). */
  formatValue: (value: number) => string;
}

/** Moldura dos tooltips: vidro sobre a superfície, fio dourado à esquerda. */
export function ChartTooltipFrame({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-surface/90 py-2 pl-3.5 pr-3 text-xs shadow-lg backdrop-blur-md">
      <span
        aria-hidden="true"
        className="absolute inset-y-1.5 left-1 w-[3px] rounded-full bg-[rgb(var(--color-chart-1))]"
      />
      {title && (
        <p className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-soft">{title}</p>
      )}
      <div className="mt-0.5 space-y-0.5">{children}</div>
    </div>
  );
}

/** Tooltip padrão dos gráficos: rótulo + valor em texto (nunca na cor da série). */
export function ChartTooltip({ active, payload, label, formatValue }: ChartTooltipProps) {
  const first = payload?.[0];
  if (!active || !first) return null;
  return (
    <ChartTooltipFrame title={label}>
      <p className="font-display text-sm font-semibold tabular-nums text-ink">
        {formatValue(first.value)}
      </p>
    </ChartTooltipFrame>
  );
}
