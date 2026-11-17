import { useId, useMemo, useState } from 'react';

export interface ChartPoint<T = unknown> {
  id?: string;
  date: string; // "YYYY-MM-DD" o fecha legible
  value: number;
  label?: string; // Etiqueta opcional del punto (ej. "DIA 1")
  formattedValue?: string; // Ej. "85 kg", "106,7 kg"
  raw?: T; // Objeto de origen (ej. ExerciseSessionHistory)
}

export interface LineChartProps<T = unknown> {
  data: readonly ChartPoint<T>[];
  selectedPointId?: string | null;
  onSelectPoint?: (point: ChartPoint<T>) => void;
  formatValue?: (val: number) => string;
  formatDateLabel?: (dateStr: string) => string;
  emptyMessage?: string;
  height?: number;
  ariaLabel?: string;
}

const VIEW_WIDTH = 500;
const VIEW_HEIGHT = 220;
const PADDING = {
  top: 30,
  right: 25,
  bottom: 35,
  left: 50,
};

export function LineChart<T = unknown>({
  data,
  selectedPointId,
  onSelectPoint,
  formatValue = (v) => v.toString(),
  formatDateLabel = (d) => d,
  emptyMessage,
  ariaLabel = 'Gráfica de progreso',
}: LineChartProps<T>) {
  const gradientId = useId();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEW_HEIGHT - PADDING.top - PADDING.bottom;

  // Cálculo de escalas y coordenadas
  const { points, yTicks } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], yTicks: [], minVal: 0, maxVal: 0 };
    }

    const values = data.map((d) => d.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (min === max) {
      min = min > 0 ? min * 0.9 : min - 1;
      max = max > 0 ? max * 1.1 : max + 1;
    } else {
      const padding = (max - min) * 0.12;
      min = Math.max(0, min - padding);
      max = max + padding;
    }

    // 3 marcas en el eje Y (abajo, centro, arriba)
    const mid = (min + max) / 2;
    const ticks = [
      { value: min, y: PADDING.top + plotHeight },
      { value: mid, y: PADDING.top + plotHeight / 2 },
      { value: max, y: PADDING.top },
    ];

    const computedPoints = data.map((item, index) => {
      const x =
        data.length === 1
          ? PADDING.left + plotWidth / 2
          : PADDING.left + (index / (data.length - 1)) * plotWidth;

      const yRatio = (item.value - min) / (max - min);
      const y = PADDING.top + plotHeight - yRatio * plotHeight;

      return {
        ...item,
        originalIndex: index,
        x,
        y,
      };
    });

    return {
      points: computedPoints,
      yTicks: ticks,
      minVal: min,
      maxVal: max,
    };
  }, [data, plotWidth, plotHeight]);

  // Rutas SVG
  const pathD = useMemo(() => {
    if (points.length <= 1) return '';
    return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length <= 1) return '';
    const bottomY = PADDING.top + plotHeight;
    const firstX = points[0]!.x;
    const lastX = points[points.length - 1]!.x;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, points, plotHeight]);

  // Determinar punto activo (hover o seleccionado)
  const activeIndex = useMemo(() => {
    if (hoveredIndex !== null) return hoveredIndex;
    if (selectedPointId) {
      const idx = points.findIndex((p) => (p.id ? p.id === selectedPointId : false));
      if (idx !== -1) return idx;
    }
    // Por defecto, resaltar el último punto
    return points.length - 1;
  }, [hoveredIndex, selectedPointId, points]);

  const activePoint = points[activeIndex] ?? points[points.length - 1];

  // Manejo de deslizamiento / puntero para tocar o arrastrar
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * VIEW_WIDTH;

    // Buscar punto más cercano por coordenada X
    let closestIndex = 0;
    let closestDist = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = idx;
      }
    });

    setHoveredIndex(closestIndex);
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
  };

  const handlePointSelect = (pt: (typeof points)[0]) => {
    if (onSelectPoint) {
      onSelectPoint(pt);
    }
  };

  // Etiquetas del eje X (primer punto, último, y opcionalmente punto medio si hay >= 4)
  const xLabels = useMemo<
    Array<{ x: number; text: string; anchor: 'start' | 'middle' | 'end' }>
  >(() => {
    if (points.length === 0) return [];
    if (points.length === 1) {
      return [{ x: points[0]!.x, text: formatDateLabel(points[0]!.date), anchor: 'middle' }];
    }
    const result: Array<{ x: number; text: string; anchor: 'start' | 'middle' | 'end' }> = [
      { x: points[0]!.x, text: formatDateLabel(points[0]!.date), anchor: 'start' },
      {
        x: points[points.length - 1]!.x,
        text: formatDateLabel(points[points.length - 1]!.date),
        anchor: 'end',
      },
    ];
    if (points.length >= 4) {
      const midIdx = Math.floor(points.length / 2);
      result.splice(1, 0, {
        x: points[midIdx]!.x,
        text: formatDateLabel(points[midIdx]!.date),
        anchor: 'middle',
      });
    }
    return result;
  }, [points, formatDateLabel]);

  if (data.length === 0) {
    return (
      <div
        className="flex h-44 w-full items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted"
        data-testid="chart-empty"
      >
        {emptyMessage ?? 'No hay datos disponibles para mostrar la gráfica'}
      </div>
    );
  }

  // Posición del tooltip asegurando que no se salga de los márgenes
  const tooltipX = activePoint
    ? Math.max(70, Math.min(VIEW_WIDTH - 70, activePoint.x))
    : VIEW_WIDTH / 2;
  const tooltipY = activePoint
    ? activePoint.y - 18 < PADDING.top
      ? activePoint.y + 28
      : activePoint.y - 14
    : PADDING.top;

  return (
    <div className="relative w-full select-none" data-testid="line-chart-container">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full h-auto overflow-visible touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        role="region"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Líneas horizontales de guía y etiquetas Y */}
        {yTicks.map((tick, i) => (
          <g key={i} className="text-xs">
            <line
              x1={PADDING.left}
              y1={tick.y}
              x2={VIEW_WIDTH - PADDING.right}
              y2={tick.y}
              stroke="var(--color-border)"
              strokeDasharray="3 3"
              strokeOpacity="0.6"
            />
            <text
              x={PADDING.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              fill="currentColor"
              className="text-[11px] fill-muted font-mono"
            >
              {formatValue(Math.round(tick.value * 10) / 10)}
            </text>
          </g>
        ))}

        {/* Área rellena bajo la curva */}
        {areaD ? <path d={areaD} fill={`url(#${gradientId})`} /> : null}

        {/* Línea principal trazada */}
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Línea vertical indicadora del punto activo */}
        {activePoint ? (
          <line
            x1={activePoint.x}
            y1={PADDING.top}
            x2={activePoint.x}
            y2={PADDING.top + plotHeight}
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            strokeOpacity="0.5"
          />
        ) : null}

        {/* Puntos y áreas interactivas de toque */}
        {points.map((pt, index) => {
          const isActive = index === activeIndex;
          const isSelected =
            pt.id != null ? pt.id === selectedPointId : index === points.length - 1;

          return (
            <g
              key={pt.id ?? `${pt.date}-${index}`}
              className="cursor-pointer"
              onClick={() => handlePointSelect(pt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePointSelect(pt);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${pt.label ? `${pt.label}: ` : ''}${pt.formattedValue ?? formatValue(pt.value)} (${pt.date})`}
              data-testid={`chart-point-${index}`}
            >
              {/* Área invisible grande para facilitar el toque táctil (diámetro 40px) */}
              <circle cx={pt.x} cy={pt.y} r="20" fill="transparent" />

              {/* Punto visible */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 6 : isSelected ? 5 : 4}
                fill={isActive ? 'var(--color-primary)' : 'var(--color-surface, #ffffff)'}
                stroke="var(--color-primary)"
                strokeWidth={isActive ? 3 : 2}
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {/* Tooltip dentro del SVG que muestra valor y fecha del punto activo */}
        {activePoint ? (
          <g
            transform={`translate(${tooltipX}, ${tooltipY})`}
            className="pointer-events-none transition-all duration-100"
            data-testid="chart-tooltip"
          >
            {/* Fondo del tooltip */}
            <rect
              x="-60"
              y="-12"
              width="120"
              height="24"
              rx="6"
              fill="var(--color-surface, #1e293b)"
              stroke="var(--color-border, #475569)"
              strokeWidth="1"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
            />
            {/* Texto del tooltip */}
            <text
              x="0"
              y="4"
              textAnchor="middle"
              className="text-[11px] font-medium fill-foreground"
            >
              <tspan className="font-bold">
                {activePoint.formattedValue ?? formatValue(activePoint.value)}
              </tspan>
              <tspan fill="var(--color-muted, #94a3b8)">
                {' '}
                · {formatDateLabel(activePoint.date)}
              </tspan>
            </text>
          </g>
        ) : null}

        {/* Eje X: Etiquetas de fechas */}
        {xLabels.map((lbl, i) => (
          <text
            key={i}
            x={lbl.x}
            y={VIEW_HEIGHT - 10}
            textAnchor={lbl.anchor}
            className="text-[11px] fill-muted font-sans"
          >
            {lbl.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
