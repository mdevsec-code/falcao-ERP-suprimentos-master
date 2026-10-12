import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toDateOnly } from '@falcao-erp/shared-types';
import { AXIS_TICK, CHART_SERIES, CURSOR_FILL, GRID_STROKE } from '@/components/charts';
import { formatCurrencyBRL } from '@/utils/format';
import { getIntlLocale } from '@/utils/locale';
import { monthLabel } from '../lib/status';
import type { CashFlowPointDto } from '../types';

interface CashFlowChartProps {
  data: readonly CashFlowPointDto[];
  height?: number;
}

const compact = (value: number) =>
  new Intl.NumberFormat(getIntlLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );

/**
 * Previsto × pago por mês num único matiz: o previsto é a barra "em projeto"
 * (contorno tracejado e preenchimento claro), o pago é a barra sólida — a
 * diferença é de forma, não de cor, e a legenda/tooltip dizem o nome.
 */
export function CashFlowChart({ data, height = 260 }: CashFlowChartProps) {
  const { t } = useTranslation('finance');
  const locale = getIntlLocale();
  const currentMonth = toDateOnly().slice(0, 7);
  const rows = data.map((point) => ({
    month: point.month,
    label: monthLabel(point.month, locale),
    previsto: Number(point.previsto),
    pago: Number(point.pago),
  }));
  const current = rows.find((row) => row.month === currentMonth)?.label;

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-4 text-xs text-ink-soft" aria-hidden="true">
        <li className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm border border-dashed"
            style={{ borderColor: CHART_SERIES, background: 'rgb(var(--color-chart-1) / 0.18)' }}
          />
          {t('finance:cashFlow.forecast')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: CHART_SERIES }} />
          {t('finance:cashFlow.paid')}
        </li>
      </ul>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={compact}
          />
          {current && (
            <ReferenceLine
              x={current}
              stroke="rgb(var(--color-text-secondary))"
              strokeDasharray="2 3"
              label={{
                value: t('finance:cashFlow.now'),
                position: 'insideTopRight',
                fill: 'rgb(var(--color-text-secondary))',
                fontSize: 10,
              }}
            />
          )}
          <Tooltip
            cursor={{ fill: CURSOR_FILL }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-md">
                  <p className="font-semibold text-ink">{label}</p>
                  {payload.map((entry) => (
                    <p key={String(entry.dataKey)} className="mt-0.5 tabular-nums text-ink-soft">
                      {entry.dataKey === 'pago'
                        ? t('finance:cashFlow.paid')
                        : t('finance:cashFlow.forecast')}
                      :{' '}
                      <span className="font-semibold text-ink">
                        {formatCurrencyBRL(Number(entry.value))}
                      </span>
                    </p>
                  ))}
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="previsto"
            fill="rgb(var(--color-chart-1) / 0.18)"
            stroke={CHART_SERIES}
            strokeDasharray="4 3"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            animationDuration={600}
          />
          <Bar
            dataKey="pago"
            fill={CHART_SERIES}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
