import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
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

const SURFACE = 'rgb(var(--color-surface))';

/**
 * Evolução no tempo: linha de 2px sobre preenchimento em degradê, crosshair
 * tracejado, marcadores de 8px e o último ponto destacado (anel dourado +
 * valor escrito) — o "onde estamos agora" da série.
 */
export function TrendAreaChart({
  data,
  formatValue,
  formatTick,
  height = 240,
}: TrendAreaChartProps) {
  const id = useId().replace(/:/g, '');
  const lastIndex = data.length - 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 28, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_SERIES} stopOpacity={0.32} />
            <stop offset="70%" stopColor={CHART_SERIES} stopOpacity={0.06} />
            <stop offset="100%" stopColor={CHART_SERIES} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="2 4" />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          axisLine={{ stroke: GRID_STROKE }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
          tickMargin={8}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={72}
          tickFormatter={formatTick}
        />
        <Tooltip
          cursor={{ stroke: CHART_SERIES, strokeWidth: 1, strokeDasharray: '3 3' }}
          content={<ChartTooltip formatValue={formatValue} />}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART_SERIES}
          strokeWidth={2}
          fill={`url(#${id}-fill)`}
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            const { cx, cy, index } = props;
            if (cx === undefined || cy === undefined) return <g key={`d-${index}`} />;
            const last = index === lastIndex;
            return (
              <g key={`d-${index}`}>
                {last && <circle cx={cx} cy={cy} r={9} fill={CHART_SERIES} opacity={0.18} />}
                <circle
                  cx={cx}
                  cy={cy}
                  r={last ? 5 : 4}
                  fill={CHART_SERIES}
                  stroke={SURFACE}
                  strokeWidth={2}
                />
              </g>
            );
          }}
          activeDot={{ r: 6, fill: CHART_SERIES, stroke: SURFACE, strokeWidth: 2 }}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {/* Rótulo direto só no último ponto (nunca um número em cada ponto). */}
          <LabelList
            dataKey="value"
            content={(props: {
              x?: number | string;
              y?: number | string;
              index?: number;
              value?: number | string;
            }) =>
              props.index === lastIndex && props.value !== undefined ? (
                <text
                  x={Number(props.x)}
                  y={Number(props.y) - 14}
                  textAnchor="end"
                  fill="rgb(var(--color-text-primary))"
                  fontSize={12}
                  fontWeight={600}
                >
                  {formatValue(Number(props.value))}
                </text>
              ) : null
            }
          />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}
