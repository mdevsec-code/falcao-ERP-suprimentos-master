/**
 * Tema dos gráficos (Recharts) — tudo via tokens CSS, então os gráficos
 * acompanham o tema claro/escuro sem re-render. Eixos e grade recessivos;
 * a série usa `--color-chart-1` (validado para os dois modos em tokens.css).
 */
export const CHART_SERIES = 'rgb(var(--color-chart-1))';
export const AXIS_TICK = { fill: 'rgb(var(--color-text-secondary))', fontSize: 12 };
export const GRID_STROKE = 'rgb(var(--color-border))';
export const CURSOR_FILL = 'rgb(var(--color-hover))';
