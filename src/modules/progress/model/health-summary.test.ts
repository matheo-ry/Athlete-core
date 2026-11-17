import { describe, expect, it } from 'vitest';

import {
  WEIGHT_METRIC,
  groupMeasurements,
  measurementKey,
  resolveHealthMetric,
  summarizeHealthRecords,
} from './health-summary';

describe('measurementKey y groupMeasurements', () => {
  it('separa por tipo y lado', () => {
    const groups = groupMeasurements([
      { measured_on: '2026-10-01', kind: 'waist', side: null },
      { measured_on: '2026-10-01', kind: 'arm', side: 'right' },
      { measured_on: '2026-10-08', kind: 'waist', side: null },
    ]);
    expect([...groups.keys()]).toEqual(['waist', 'arm-right']);
    expect(groups.get('waist')).toHaveLength(2);
    expect(measurementKey({ kind: 'calf', side: 'left' })).toBe('calf-left');
  });
});

describe('resolveHealthMetric', () => {
  it('con pesos y sin elegir nada, el peso', () => {
    expect(resolveHealthMetric(null, true, ['waist'])).toBe(WEIGHT_METRIC);
  });

  it('con medidas y SIN pesos, la primera medida (no una gráfica vacía)', () => {
    expect(resolveHealthMetric(null, false, ['waist', 'hips'])).toBe('waist');
    expect(resolveHealthMetric(WEIGHT_METRIC, false, ['waist'])).toBe('waist');
  });

  it('respeta la elegida si existe', () => {
    expect(resolveHealthMetric('hips', true, ['waist', 'hips'])).toBe('hips');
  });

  it('sin datos, ninguna', () => {
    expect(resolveHealthMetric(null, false, [])).toBeNull();
  });
});

describe('summarizeHealthRecords', () => {
  const format = (v: number) => `${v} kg`;
  const valueOf = (r: { value: number }) => r.value;

  it('último valor y cambio con signo, ordenando por fecha', () => {
    const summary = summarizeHealthRecords(
      [
        { measured_on: '2026-10-15', value: 81.5 },
        { measured_on: '2026-10-01', value: 80 },
      ],
      valueOf,
      format,
    );
    expect(summary).toEqual({ last: '81.5 kg', change: '+1.5 kg' });
  });

  it('con un solo registro no hay cambio', () => {
    expect(
      summarizeHealthRecords([{ measured_on: '2026-10-01', value: 80 }], valueOf, format),
    ).toEqual({ last: '80 kg', change: null });
  });

  it('una diferencia minúscula sale como 0', () => {
    const summary = summarizeHealthRecords(
      [
        { measured_on: '2026-10-01', value: 80 },
        { measured_on: '2026-10-02', value: 79.98 },
      ],
      valueOf,
      format,
    );
    expect(summary?.change).toBe('0 kg');
  });

  it('sin registros, null', () => {
    expect(summarizeHealthRecords([], valueOf, format)).toBeNull();
  });
});
