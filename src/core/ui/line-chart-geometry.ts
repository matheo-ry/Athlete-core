// Cálculos de la gráfica de línea, sin React, para poder probarlos aparte.
// Las coordenadas están en píxeles reales: el viewBox del SVG mide lo mismo
// que su contenedor, así el texto y las zonas táctiles no encogen en el móvil.

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const CHART_PADDING: ChartPadding = { top: 32, right: 16, bottom: 32, left: 48 };

export interface PlottedPoint {
  x: number;
  y: number;
}

export interface YTick {
  value: number;
  y: number;
}

export interface ChartGeometry {
  points: PlottedPoint[];
  yTicks: YTick[];
  linePath: string;
  areaPath: string;
  plotTop: number;
  plotBottom: number;
}

/** Margen arriba y abajo del rango de valores para que la línea no toque los bordes. */
function valueRange(values: readonly number[]): { min: number; max: number } {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    return min > 0 ? { min: min * 0.9, max: max * 1.1 } : { min: min - 1, max: max + 1 };
  }
  const padding = (max - min) * 0.12;
  // Un peso o unas repeticiones nunca bajan de 0: el eje tampoco.
  min = min >= 0 ? Math.max(0, min - padding) : min - padding;
  max = max + padding;
  return { min, max };
}

export function computeChartGeometry(
  values: readonly number[],
  width: number,
  height: number,
  padding: ChartPadding = CHART_PADDING,
): ChartGeometry {
  const plotTop = padding.top;
  const plotBottom = height - padding.bottom;
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = Math.max(0, plotBottom - plotTop);

  if (values.length === 0) {
    return { points: [], yTicks: [], linePath: '', areaPath: '', plotTop, plotBottom };
  }

  const { min, max } = valueRange(values);
  const toY = (value: number) => plotBottom - ((value - min) / (max - min)) * plotHeight;

  const points = values.map((value, index) => ({
    x:
      values.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (values.length - 1)) * plotWidth,
    y: toY(value),
  }));

  const mid = (min + max) / 2;
  const yTicks = [min, mid, max].map((value) => ({ value, y: toY(value) }));

  if (points.length < 2) {
    return { points, yTicks, linePath: '', areaPath: '', plotTop, plotBottom };
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const areaPath = `${linePath} L ${last.x} ${plotBottom} L ${first.x} ${plotBottom} Z`;

  return { points, yTicks, linePath, areaPath, plotTop, plotBottom };
}

/** Índice del punto más cercano en horizontal: sirve para tocar o arrastrar en cualquier sitio. */
export function nearestPointIndex(points: readonly PlottedPoint[], x: number): number {
  let closest = 0;
  let closestDistance = Infinity;
  points.forEach((point, index) => {
    const distance = Math.abs(point.x - x);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = index;
    }
  });
  return closest;
}

/** Qué puntos llevan fecha en el eje X: el primero, el último y, con 4 o más, el del medio. */
export function xLabelIndices(count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [0];
  if (count < 4) return [0, count - 1];
  return [0, Math.floor(count / 2), count - 1];
}

/** Índice al pulsar una tecla de flecha, Inicio o Fin; null si la tecla no mueve. */
export function keyboardTargetIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return Math.max(0, current - 1);
    case 'ArrowRight':
    case 'ArrowUp':
      return Math.min(count - 1, current + 1);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** Ancho aproximado del tooltip según su texto, para que no se corte. */
export function tooltipWidth(text: string): number {
  return Math.max(96, Math.round(text.length * 7 + 24));
}
