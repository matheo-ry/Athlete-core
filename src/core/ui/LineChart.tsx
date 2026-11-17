import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ChartBackdrop } from './ChartBackdrop';
import { ChartTooltip } from './ChartTooltip';
import {
  computeChartGeometry,
  keyboardTargetIndex,
  nearestPointIndex,
} from './line-chart-geometry';
import { useElementWidth } from './useElementWidth';

export interface ChartPoint<T = unknown> {
  id?: string;
  /** Fecha "YYYY-MM-DD"; se muestra con `formatDateLabel`. */
  date: string;
  value: number;
  /** Etiqueta opcional del punto (por ejemplo, "DÍA 1"). */
  label?: string;
  /** Valor ya formateado ("85 kg"). */
  formattedValue?: string;
  raw?: T;
}

export interface LineChartProps<T = unknown> {
  data: readonly ChartPoint<T>[];
  /** Nombre de la gráfica para el lector de pantalla (obligatorio: viene traducido). */
  ariaLabel: string;
  selectedPointId?: string | null;
  onSelectPoint?: (point: ChartPoint<T>) => void;
  formatValue?: (value: number) => string;
  formatDateLabel?: (date: string) => string;
  emptyMessage?: string;
}

const CHART_HEIGHT = 220;
// Ancho mientras no se ha medido el contenedor (y en los tests, sin ResizeObserver).
const FALLBACK_WIDTH = 500;
// Radio de la zona táctil de cada punto: 22 px reales = 44 px de diámetro (AGENTS §4).
const HIT_RADIUS = 22;

const pointKey = (point: ChartPoint<unknown>, index: number) => point.id ?? `#${index}`;

export function LineChart<T = unknown>({
  data,
  ariaLabel,
  selectedPointId,
  onSelectPoint,
  formatValue = (v) => v.toString(),
  formatDateLabel = (d) => d,
  emptyMessage,
}: LineChartProps<T>) {
  const { t } = useTranslation();
  const gradientId = useId();
  const [containerRef, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [internalSelectedKey, setInternalSelectedKey] = useState<string | null>(null);
  const pointRefs = useRef<Array<SVGGElement | null>>([]);

  const geometry = useMemo(
    () =>
      computeChartGeometry(
        data.map((d) => d.value),
        width,
        CHART_HEIGHT,
      ),
    [data, width],
  );

  if (data.length === 0) {
    return (
      <div
        className="flex h-44 w-full items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted"
        data-testid="chart-empty"
      >
        {emptyMessage ?? t('core.ui.chart.empty')}
      </div>
    );
  }

  const wantedKey = selectedPointId ?? internalSelectedKey;
  const foundIndex = data.findIndex((p, i) => pointKey(p, i) === wantedKey);
  // Sin selección, el último punto (lo más reciente).
  const selectedIndex = foundIndex === -1 ? data.length - 1 : foundIndex;
  const activeIndex = hoveredIndex ?? focusedIndex ?? selectedIndex;
  const activePoint = data[activeIndex];
  const activePlot = geometry.points[activeIndex];

  const valueText = (p: ChartPoint<T>) => p.formattedValue ?? formatValue(p.value);

  const select = (index: number) => {
    const point = data[index];
    if (point === undefined) return;
    setInternalSelectedKey(pointKey(point, index));
    onSelectPoint?.(point);
  };

  const pointerIndex = (e: PointerEvent<SVGSVGElement>): number | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return null;
    return nearestPointIndex(geometry.points, ((e.clientX - rect.left) / rect.width) * width);
  };

  const handlePointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const index = pointerIndex(e);
    if (index !== null) setHoveredIndex(index);
  };

  // Con el dedo, tocar en cualquier parte elige el punto más cercano: así la
  // zona táctil es toda la columna del punto, no solo su círculo.
  const handlePointerUp = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') return;
    const index = pointerIndex(e);
    if (index !== null) select(index);
  };

  // Patrón de grupo de radio: un solo punto en el orden de tabulación y las
  // flechas mueven el foco y la selección (no decenas de paradas de Tab).
  const handleKeyDown = (e: KeyboardEvent<SVGGElement>, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(index);
      return;
    }
    const target = keyboardTargetIndex(e.key, index, data.length);
    if (target === null) return;
    e.preventDefault();
    select(target);
    pointRefs.current[target]?.focus();
  };

  const first = data[0]!;
  const last = data[data.length - 1]!;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      data-testid="line-chart-container"
    >
      <p className="sr-only">
        {t('core.ui.chart.summary', {
          count: data.length,
          first: `${valueText(first)} (${formatDateLabel(first.date)})`,
          last: `${valueText(last)} (${formatDateLabel(last.date)})`,
        })}
      </p>
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        className="block overflow-visible touch-pan-y"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoveredIndex(null)}
        onPointerCancel={() => setHoveredIndex(null)}
        role="radiogroup"
        aria-label={ariaLabel}
      >
        <ChartBackdrop
          geometry={geometry}
          width={width}
          height={CHART_HEIGHT}
          gradientId={gradientId}
          activePlot={activePlot}
          dates={data.map((d) => d.date)}
          formatValue={formatValue}
          formatDateLabel={formatDateLabel}
        />

        {data.map((point, index) => {
          const plot = geometry.points[index]!;
          const isActive = index === activeIndex;
          const isSelected = index === selectedIndex;
          return (
            <g
              key={pointKey(point, index)}
              ref={(node) => {
                pointRefs.current[index] = node;
              }}
              className="cursor-pointer outline-none"
              role="radio"
              aria-checked={isSelected}
              aria-label={[point.label, valueText(point), formatDateLabel(point.date)]
                .filter(Boolean)
                .join(', ')}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              data-testid={`chart-point-${index}`}
            >
              <circle cx={plot.x} cy={plot.y} r={HIT_RADIUS} fill="transparent" />
              {focusedIndex === index ? (
                <circle
                  cx={plot.x}
                  cy={plot.y}
                  r={11}
                  fill="none"
                  className="stroke-primary-readable"
                  strokeWidth={2}
                  data-testid="chart-focus-ring"
                />
              ) : null}
              <circle
                cx={plot.x}
                cy={plot.y}
                r={isActive ? 6 : isSelected ? 5 : 4}
                className={isActive ? 'fill-primary stroke-primary' : 'fill-surface stroke-primary'}
                strokeWidth={isActive ? 3 : 2}
              />
            </g>
          );
        })}

        {activePoint && activePlot ? (
          <ChartTooltip
            x={activePlot.x}
            y={activePlot.y}
            chartWidth={width}
            plotTop={geometry.plotTop}
            value={valueText(activePoint)}
            date={formatDateLabel(activePoint.date)}
          />
        ) : null}
      </svg>
    </div>
  );
}
