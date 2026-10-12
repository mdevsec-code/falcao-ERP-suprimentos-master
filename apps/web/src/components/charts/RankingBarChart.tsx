import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, CHART_SERIES, CURSOR_FILL, GRID_STROKE } from './chartTheme';
import { ChartTooltip } from './ChartTooltip';

export interface RankingBarChartProps {
  data: { label: string; value: number }[];
  formatValue: (value: number) => string;
  /** Largura reservada aos rótulos das categorias (eixo Y). */
  labelWidth?: number;
  /** Formato curto para os ticks do eixo de valores (ex.: "70 mil"). */
  formatTick?: (value: number) => string;
}

/**
 * Barras horizontais de magnitude por categoria — um único matiz (não é
 * identidade, é "quanto"), barras finas com ponta arredondada de 4px.
 */
export function RankingBarChart({
  data,
  formatValue,
  labelWidth = 150,
  formatTick,
}: RankingBarChartProps) {
  const height = Math.max(160, data.length * 34 + 24);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={formatTick}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={labelWidth}
        />
        <Tooltip
          cursor={{ fill: CURSOR_FILL }}
          content={<ChartTooltip formatValue={formatValue} />}
        />
        <Bar
          dataKey="value"
          fill={CHART_SERIES}
          radius={[0, 4, 4, 0]}
          barSize={16}
          isAnimationActive
          animationDuration={600}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
