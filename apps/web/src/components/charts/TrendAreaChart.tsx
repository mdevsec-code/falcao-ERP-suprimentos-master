import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, CHART_SERIES, GRID_STROKE } from './chartTheme';
import { ChartTooltip } from './ChartTooltip';

export interface TrendAreaChartProps {
  data: { label: string; value: number }[];
  formatValue: (value: number) => string;
  /** Formato curto para os ticks do eixo Y. */
  formatTick?: (value: number) => string;
  height?: number;
}

/** Evolução no tempo: linha de 2px com preenchimento suave, marcadores ≥ 8px e crosshair. */
export function TrendAreaChart({
  data,
  formatValue,
  formatTick,
  height = 240,
}: TrendAreaChartProps) {
  const gradientId = useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_SERIES} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_SERIES} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          axisLine={{ stroke: GRID_STROKE }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={72}
          tickFormatter={formatTick}
        />
        <Tooltip
          cursor={{ stroke: GRID_STROKE, strokeWidth: 1 }}
          content={<ChartTooltip formatValue={formatValue} />}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART_SERIES}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 4, fill: CHART_SERIES, stroke: 'rgb(var(--color-surface))', strokeWidth: 2 }}
          activeDot={{
            r: 5,
            fill: CHART_SERIES,
            stroke: 'rgb(var(--color-surface))',
            strokeWidth: 2,
          }}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
