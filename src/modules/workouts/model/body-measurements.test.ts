import { describe, expect, it } from 'vitest';

import {
  groupMeasurementHistory,
  hasSides,
  measurementTargets,
  parseMeasurementEntry,
  parseTargetKey,
  targetKey,
} from './body-measurements';
import type { BodyMeasurementRecord } from './workout-types';

const record = (
  n: number,
  day: string,
  kind: string,
  side: string | null,
  cm: number,
): BodyMeasurementRecord => ({
  id: `00000000-0000-4000-8000-00000000000${String(n)}`,
  measured_on: day,
  kind,
  side,
  value_cm: cm,
});

describe('la lista de medidas (D-127)', () => {
  it('solo brazo, muslo y gemelo llevan lado', () => {
    expect(hasSides('arm')).toBe(true);
    expect(hasSides('thigh')).toBe(true);
    expect(hasSides('calf')).toBe(true);
    expect(hasSides('waist')).toBe(false);
    expect(hasSides('neck')).toBe(false);
  });

  it('son 11 medidas, con el derecho antes que el izquierdo', () => {
    expect(measurementTargets().map(targetKey)).toEqual([
      'waist',
      'hips',
      'chest',
      'shoulders',
      'neck',
      'arm-right',
      'arm-left',
      'thigh-right',
      'thigh-left',
      'calf-right',
      'calf-left',
    ]);
  });

  it('cada clave se puede volver a leer, y lo desconocido no', () => {
    for (const target of measurementTargets()) {
      expect(parseTargetKey(targetKey(target))).toEqual(target);
    }
    expect(parseTargetKey('arm')).toBeNull();
    expect(parseTargetKey('waist-left')).toBeNull();
    expect(parseTargetKey('')).toBeNull();
  });
});

describe('parseMeasurementEntry', () => {
  it('en cm se guarda con un decimal', () => {
    expect(parseMeasurementEntry('82', 'kg')).toEqual({ ok: true, valueCm: 82 });
    expect(parseMeasurementEntry('38,26', 'kg')).toEqual({ ok: true, valueCm: 38.3 });
  });

  it('en pulgadas pasa a cm', () => {
    expect(parseMeasurementEntry('32', 'lb')).toEqual({ ok: true, valueCm: 81.3 });
  });

  it('rechaza cero, más de 300 cm y lo que no es un número', () => {
    expect(parseMeasurementEntry('0', 'kg')).toEqual({ ok: false, reason: 'range' });
    expect(parseMeasurementEntry('300', 'kg').ok).toBe(true);
    expect(parseMeasurementEntry('300,1', 'kg')).toEqual({ ok: false, reason: 'range' });
    expect(parseMeasurementEntry('', 'kg')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseMeasurementEntry('ancho', 'kg')).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('groupMeasurementHistory', () => {
  const measurements = [
    record(1, '2026-11-01', 'waist', null, 84),
    record(2, '2026-11-16', 'waist', null, 82),
    record(3, '2026-11-16', 'arm', 'right', 38),
    record(4, '2026-11-16', 'arm', 'left', 37.5),
  ];

  it('agrupa por medida y lado en el orden de la lista, solo las apuntadas', () => {
    expect(groupMeasurementHistory(measurements).map((g) => g.key)).toEqual([
      'waist',
      'arm-right',
      'arm-left',
    ]);
  });

  it('cada historial va del día más reciente al más antiguo', () => {
    const waist = groupMeasurementHistory(measurements)[0];
    expect(waist?.records.map((r) => r.value_cm)).toEqual([82, 84]);
  });

  it('sin medidas no hay grupos', () => {
    expect(groupMeasurementHistory([])).toEqual([]);
  });
});
