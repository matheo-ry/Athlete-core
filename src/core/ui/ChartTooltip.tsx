import { tooltipWidth } from './line-chart-geometry';

interface ChartTooltipProps {
  x: number;
  y: number;
  chartWidth: number;
  plotTop: number;
  value: string;
  date: string;
}

const TOOLTIP_HEIGHT = 28;

/** Cartel con el valor y la fecha del punto activo, sin salirse de la gráfica. */
export function ChartTooltip({ x, y, chartWidth, plotTop, value, date }: ChartTooltipProps) {
  const width = tooltipWidth(`${value} · ${date}`);
  const half = width / 2;
  const left = Math.max(half + 4, Math.min(chartWidth - half - 4, x));
  // Si no cabe encima del punto, va debajo.
  const top = y - TOOLTIP_HEIGHT - 8 < plotTop - 24 ? y + 12 : y - TOOLTIP_HEIGHT - 8;

  return (
    <g
      transform={`translate(${left}, ${top})`}
      className="pointer-events-none"
      data-testid="chart-tooltip"
      aria-hidden="true"
    >
      <rect
        x={-half}
        y={0}
        width={width}
        height={TOOLTIP_HEIGHT}
        rx={6}
        className="fill-surface stroke-border"
        strokeWidth={1}
      />
      <text x={0} y={TOOLTIP_HEIGHT / 2 + 4} textAnchor="middle" className="text-xs">
        <tspan className="fill-foreground font-bold">{value}</tspan>
        <tspan className="fill-muted"> · {date}</tspan>
      </text>
    </g>
  );
}
