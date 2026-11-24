import { describe, expect, it } from 'vitest';

import {
  latestWeight,
  parseWeightEntry,
  sortWeightsNewestFirst,
  totalWithBallast,
} from './body-weight';
import type { BodyWeightRecord } from './workout-types';

const record = (n: number, day: string, kg: number): BodyWeightRecord => ({
  id: `00000000-0000-4000-8000-00000000000${String(n)}`,
  measured_on: day,
  weight_kg: kg,
});

describe('parseWeightEntry', () => {
  it('en kg se guarda tal cual', () => {
    expect(parseWeightEntry('85', 'kg')).toEqual({ ok: true, weightKg: 85 });
    expect(parseWeightEntry('84,55', 'kg')).toEqual({ ok: true, weightKg: 84.55 });
  });

  it('en lb pasa a kg con dos decimales', () => {
    expect(parseWeightEntry('187', 'lb')).toEqual({ ok: true, weightKg: 84.82 });
  });

  it('respeta los límites de la base de datos: 20 a 400 kg', () => {
    expect(parseWeightEntry('20', 'kg').ok).toBe(true);
    expect(parseWeightEntry('400', 'kg').ok).toBe(true);
    expect(parseWeightEntry('19,9', 'kg')).toEqual({ ok: false, reason: 'range' });
    expect(parseWeightEntry('401', 'kg')).toEqual({ ok: false, reason: 'range' });
    expect(parseWeightEntry('44', 'lb')).toEqual({ ok: false, reason: 'range' });
  });

  it('rechaza lo que no es un número', () => {
    expect(parseWeightEntry('', 'kg')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseWeightEntry('mucho', 'kg')).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('latestWeight / sortWeightsNewestFirst', () => {
  const weights = [
    record(1, '2026-11-01', 86),
    record(2, '2026-11-16', 85),
    record(3, '2026-11-08', 85.5),
  ];

  it('el último es el del día más reciente, venga como venga', () => {
    expect(latestWeight(weights)?.weight_kg).toBe(85);
    expect(latestWeight([...weights].reverse())?.weight_kg).toBe(85);
  });

  it('sin pesos no hay último', () => {
    expect(latestWeight([])).toBeNull();
  });

  it('ordena sin cambiar la lista original', () => {
    const copy = [...weights];
    const sorted = sortWeightsNewestFirst(weights);
    expect(weights).toEqual(copy);
    expect(sorted.map((w) => w.measured_on)).toEqual(['2026-11-16', '2026-11-08', '2026-11-01']);
  });
});

describe('totalWithBallast', () => {
  it('suma el peso corporal y el lastre (D-127)', () => {
    expect(totalWithBallast(85, 10)).toBe(95);
    expect(totalWithBallast(84.82, 2.5)).toBe(87.32);
    expect(totalWithBallast(85, 0)).toBe(85);
  });

  it('sin peso o sin lastre no hay total', () => {
    expect(totalWithBallast(null, 10)).toBeNull();
    expect(totalWithBallast(85, null)).toBeNull();
  });
});
