import { CHART_PADDING, xLabelIndices } from './line-chart-geometry';
import type { ChartGeometry, PlottedPoint } from './line-chart-geometry';

interface ChartBackdropProps {
  geometry: ChartGeometry;
  width: number;
  height: number;
  gradientId: string;
  activePlot: PlottedPoint | undefined;
  dates: readonly string[];
  formatValue: (value: number) => string;
  formatDateLabel: (date: string) => string;
}

/**
 * Lo que solo se mira (guías, ejes, línea y área): oculto al lector de
 * pantalla, que ya tiene el resumen y los puntos. Colores solo del tema.
 */
export function ChartBackdrop({
  geometry,
  width,
  height,
  gradientId,
  activePlot,
  dates,
  formatValue,
  formatDateLabel,
}: ChartBackdropProps) {
  const labels = xLabelIndices(dates.length);
  const anchorOf = (i: number) => {
    if (labels.length === 1) return 'middle';
    if (i === 0) return 'start';
    return i === labels.length - 1 ? 'end' : 'middle';
  };

  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {geometry.yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={CHART_PADDING.left}
            y1={tick.y}
            x2={width - CHART_PADDING.right}
            y2={tick.y}
            className="stroke-border"
            strokeDasharray="3 3"
          />
          <text
            x={CHART_PADDING.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            className="fill-muted font-mono text-xs"
          >
            {formatValue(Math.round(tick.value * 10) / 10)}
          </text>
        </g>
      ))}

      {geometry.areaPath ? <path d={geometry.areaPath} fill={`url(#${gradientId})`} /> : null}
      {geometry.linePath ? (
        <path
          d={geometry.linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {activePlot ? (
        <line
          x1={activePlot.x}
          y1={geometry.plotTop}
          x2={activePlot.x}
          y2={geometry.plotBottom}
          className="stroke-primary"
          strokeWidth={1.5}
          strokeDasharray="2 2"
          strokeOpacity={0.5}
        />
      ) : null}

      {labels.map((index, i) => (
        <text
          key={index}
          x={geometry.points[index]!.x}
          y={height - 10}
          textAnchor={anchorOf(i)}
          className="fill-muted text-xs"
        >
          {formatDateLabel(dates[index]!)}
        </text>
      ))}
    </g>
  );
}
