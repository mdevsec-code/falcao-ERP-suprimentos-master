import { getIntlLocale } from '@/utils/locale';
import { cn } from '@/utils/cn';

export interface RankingBarChartProps {
  data: { label: string; value: number }[];
  /** Texto completo do valor (aparece no hover e para leitores de tela). Ex.: "7 solicitações". */
  formatValue: (value: number) => string;
  /** Formato curto do número na ponta da barra (ex.: "70 mil"). Padrão: inteiro no idioma ativo. */
  formatTick?: (value: number) => string;
}

/**
 * Barras horizontais de magnitude por categoria, em HTML: rótulo acima da
 * barra (sem quebra apertada de eixo), valor direto na ponta, um único matiz
 * (é "quanto", não identidade). As barras crescem em sequência ao montar; no
 * hover a linha em foco acende e as demais recuam.
 */
export function RankingBarChart({ data, formatValue, formatTick }: RankingBarChartProps) {
  const max = Math.max(1, ...data.map((row) => row.value));
  const short = formatTick ?? ((v: number) => new Intl.NumberFormat(getIntlLocale()).format(v));

  return (
    <ol className="group/chart space-y-3.5">
      {data.map((row, idx) => {
        const pct = (row.value / max) * 100;
        return (
          <li
            key={row.label}
            className="group/row transition-opacity duration-base hover:!opacity-100 group-hover/chart:opacity-45"
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink-soft group-hover/row:text-ink">
                {row.label}
              </span>
              <span className="shrink-0 font-display text-base font-semibold tabular-nums text-ink">
                <span className="sr-only">{formatValue(row.value)}</span>
                <span aria-hidden="true">{short(row.value)}</span>
              </span>
            </div>
            <div
              aria-hidden="true"
              title={formatValue(row.value)}
              className="relative h-2.5 overflow-hidden rounded-r-[4px] bg-hover"
            >
              {/* Régua: marcas a cada quarto, como numa escala de prancha. */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_calc(25%-1px),rgb(var(--color-border))_calc(25%-1px),rgb(var(--color-border))_25%,transparent_25%)] bg-[length:25%_100%] opacity-60" />
              {row.value > 0 && (
                <div
                  className={cn(
                    'relative h-full origin-left animate-grow-x rounded-r-[4px]',
                    // Cor validada da série (≥ 3:1 nos dois temas); o brilho só no hover.
                    'bg-[rgb(var(--color-chart-1))]',
                    'transition-[filter,box-shadow] duration-base group-hover/row:shadow-glow group-hover/row:brightness-110',
                  )}
                  style={{ width: `${pct}%`, animationDelay: `${idx * 70}ms` }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
