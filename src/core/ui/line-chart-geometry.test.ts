import { describe, expect, it } from 'vitest';

import {
  CHART_PADDING,
  computeChartGeometry,
  keyboardTargetIndex,
  nearestPointIndex,
  tooltipWidth,
  xLabelIndices,
} from './line-chart-geometry';

describe('computeChartGeometry', () => {
  it('sin valores no hay puntos ni trazo', () => {
    const g = computeChartGeometry([], 400, 220);
    expect(g.points).toEqual([]);
    expect(g.linePath).toBe('');
  });

  it('un solo valor va centrado y sin línea', () => {
    const g = computeChartGeometry([80], 400, 220);
    const plotWidth = 400 - CHART_PADDING.left - CHART_PADDING.right;
    expect(g.points[0]!.x).toBe(CHART_PADDING.left + plotWidth / 2);
    expect(g.linePath).toBe('');
  });

  it('reparte los puntos a lo ancho y el mayor queda más arriba', () => {
    const g = computeChartGeometry([70, 90], 400, 220);
    expect(g.points[0]!.x).toBe(CHART_PADDING.left);
    expect(g.points[1]!.x).toBe(400 - CHART_PADDING.right);
    expect(g.points[1]!.y).toBeLessThan(g.points[0]!.y);
    expect(g.linePath.startsWith('M')).toBe(true);
    expect(g.areaPath.endsWith('Z')).toBe(true);
  });

  it('con valores positivos el eje no baja de 0', () => {
    const g = computeChartGeometry([1, 100], 400, 220);
    expect(g.yTicks[0]!.value).toBe(0);
  });
});

describe('nearestPointIndex', () => {
  it('elige el punto más cercano en horizontal', () => {
    const points = [
      { x: 10, y: 0 },
      { x: 100, y: 0 },
      { x: 200, y: 0 },
    ];
    expect(nearestPointIndex(points, 140)).toBe(1);
    expect(nearestPointIndex(points, 190)).toBe(2);
  });
});

describe('xLabelIndices', () => {
  it('primero y último, más el del medio con 4 o más', () => {
    expect(xLabelIndices(0)).toEqual([]);
    expect(xLabelIndices(1)).toEqual([0]);
    expect(xLabelIndices(3)).toEqual([0, 2]);
    expect(xLabelIndices(5)).toEqual([0, 2, 4]);
  });
});

describe('keyboardTargetIndex', () => {
  it('las flechas se mueven sin salirse y Inicio/Fin van a los extremos', () => {
    expect(keyboardTargetIndex('ArrowLeft', 0, 3)).toBe(0);
    expect(keyboardTargetIndex('ArrowRight', 1, 3)).toBe(2);
    expect(keyboardTargetIndex('ArrowRight', 2, 3)).toBe(2);
    expect(keyboardTargetIndex('Home', 2, 3)).toBe(0);
    expect(keyboardTargetIndex('End', 0, 3)).toBe(2);
    expect(keyboardTargetIndex('a', 0, 3)).toBeNull();
  });
});

describe('tooltipWidth', () => {
  it('crece con el texto para que no se corte', () => {
    expect(tooltipWidth('80 kg')).toBe(96);
    expect(tooltipWidth('106,7 kg · 17 nov 2026')).toBeGreaterThan(150);
  });
});
