import { describe, expect, it } from 'vitest';

import type { ExerciseSessionHistory } from './exercise-history';
import {
  buildExerciseChartPoints,
  buildMeasurementChartPoints,
  buildWeightChartPoints,
  calculateRmProgressPercentage,
  filterHealthDataByPeriod,
  filterSessionsByPeriod,
  getPeriodCutoffDate,
} from './progress-charts';

describe('progress-charts model (D-127, D-129)', () => {
  const dummySession = (
    workoutId: string,
    sessionNumber: number,
    date: string,
    maxRm: number | null,
    maxWeightKg: number | null,
    volumeKg: number,
    totalReps: number,
  ): ExerciseSessionHistory => ({
    workoutId,
    sessionNumber,
    label: `DIA ${sessionNumber}`,
    performedOn: date,
    setsText: '45×8(1)',
    fullText: `DIA ${sessionNumber}: 45×8(1)`,
    dayNote: null,
    hasNote: false,
    maxWeightKg,
    maxRm,
    volumeKg,
    totalReps,
  });

  describe('getPeriodCutoffDate y filterSessionsByPeriod', () => {
    it('para "all" devuelve null y no filtra sesiones', () => {
      expect(getPeriodCutoffDate('all')).toBeNull();
      const sessions = [
        dummySession('w1', 1, '2026-08-01', 50, 40, 400, 10),
        dummySession('w2', 2, '2026-11-15', 60, 50, 500, 10),
      ];
      expect(filterSessionsByPeriod(sessions, 'all')).toHaveLength(2);
    });

    it('para "4w" filtra a los últimos 28 días', () => {
      const refDate = '2026-11-17';
      const cutoff = getPeriodCutoffDate('4w', refDate);
      expect(cutoff).toBe('2026-10-20');

      const sessions = [
        dummySession('w1', 1, '2026-10-01', 50, 40, 400, 10), // fuera
        dummySession('w2', 2, '2026-10-25', 55, 45, 450, 10), // dentro
        dummySession('w3', 3, '2026-11-15', 60, 50, 500, 10), // dentro
      ];

      const filtered = filterSessionsByPeriod(sessions, '4w', refDate);
      expect(filtered).toHaveLength(2);
      expect(filtered[0]!.performedOn).toBe('2026-10-25');
      expect(filtered[1]!.performedOn).toBe('2026-11-15');
    });

    it('para "3m" filtra a los últimos 90 días', () => {
      const refDate = '2026-11-17';
      const cutoff = getPeriodCutoffDate('3m', refDate);
      expect(cutoff).toBe('2026-08-19');

      const sessions = [
        dummySession('w1', 1, '2026-07-01', 50, 40, 400, 10), // fuera
        dummySession('w2', 2, '2026-09-01', 55, 45, 450, 10), // dentro
      ];
      expect(filterSessionsByPeriod(sessions, '3m', refDate)).toHaveLength(1);
    });
  });

  describe('calculateRmProgressPercentage (D-129)', () => {
    it('devuelve null si hay menos de 2 sesiones con RM', () => {
      expect(calculateRmProgressPercentage([])).toBeNull();
      expect(
        calculateRmProgressPercentage([dummySession('w1', 1, '2026-11-01', 60, 50, 500, 10)]),
      ).toBeNull();
      expect(
        calculateRmProgressPercentage([
          dummySession('w1', 1, '2026-11-01', null, 50, 500, 10),
          dummySession('w2', 2, '2026-11-05', 60, 50, 500, 10),
        ]),
      ).toBeNull();
    });

    it('calcula porcentaje positivo (+20%)', () => {
      const sessions = [
        dummySession('w1', 1, '2026-10-01', 50, 40, 400, 10),
        dummySession('w2', 2, '2026-10-15', 55, 45, 450, 10),
        dummySession('w3', 3, '2026-11-01', 60, 50, 500, 10),
      ];
      expect(calculateRmProgressPercentage(sessions)).toBe(20);
    });

    it('calcula porcentaje negativo (-10%)', () => {
      const sessions = [
        dummySession('w1', 1, '2026-10-01', 60, 50, 500, 10),
        dummySession('w2', 2, '2026-11-01', 54, 45, 450, 10),
      ];
      expect(calculateRmProgressPercentage(sessions)).toBe(-10);
    });

    it('el % de progreso cambia al pasar de "4 semanas" a "Todo" (Criterio 2)', () => {
      const refDate = '2026-11-17';
      const allSessions = [
        dummySession('w1', 1, '2026-09-01', 50, 40, 400, 10), // hace 2.5 meses
        dummySession('w2', 2, '2026-10-25', 55, 45, 450, 10), // hace 3 semanas
        dummySession('w3', 3, '2026-11-15', 60, 50, 500, 10), // hace 2 días
      ];

      const allProgress = calculateRmProgressPercentage(allSessions);
      // De 50 a 60 = +20%
      expect(allProgress).toBe(20);

      const fourWeeksSessions = filterSessionsByPeriod(allSessions, '4w', refDate);
      const fourWeeksProgress = calculateRmProgressPercentage(fourWeeksSessions);
      // De 55 a 60 = +9.1%
      expect(fourWeeksProgress).toBe(9.1);

      // Criterio 2: el % de progreso cambia entre 4 semanas y Todo
      expect(fourWeeksProgress).not.toBe(allProgress);
    });
  });

  describe('buildExerciseChartPoints', () => {
    const formatReps = (count: number) => `${count} rep`;
    const sessions = [
      dummySession('w1', 1, '2026-10-01', 60, 50, 500, 12),
      dummySession('w2', 2, '2026-10-10', 70, 60, 600, 10),
    ];

    it('construye puntos para RM estimado', () => {
      const pts = buildExerciseChartPoints(sessions, 'estimated_rm', 'kg', 'es', formatReps);
      expect(pts).toHaveLength(2);
      expect(pts[0]!.value).toBe(60);
      expect(pts[0]!.formattedValue).toBe('60 kg');
      expect(pts[1]!.value).toBe(70);
      expect(pts[1]!.formattedValue).toBe('70 kg');
    });

    it('construye puntos para peso máximo', () => {
      const pts = buildExerciseChartPoints(sessions, 'max_weight', 'kg', 'es', formatReps);
      expect(pts[0]!.value).toBe(50);
      expect(pts[1]!.value).toBe(60);
    });

    it('construye puntos para volumen', () => {
      const pts = buildExerciseChartPoints(sessions, 'volume', 'kg', 'es', formatReps);
      expect(pts[0]!.value).toBe(500);
      expect(pts[1]!.value).toBe(600);
    });

    it('construye puntos para repeticiones', () => {
      const pts = buildExerciseChartPoints(sessions, 'reps', 'kg', 'es', formatReps);
      expect(pts[0]!.value).toBe(12);
      expect(pts[0]!.formattedValue).toBe('12 rep');
      expect(pts[1]!.value).toBe(10);
    });
  });

  describe('Salud: buildWeightChartPoints y buildMeasurementChartPoints', () => {
    it('construye puntos de peso corporal y los ordena por fecha asc', () => {
      const weights = [
        { id: 'w2', measured_on: '2026-10-15', weight_kg: 81.5 },
        { id: 'w1', measured_on: '2026-10-01', weight_kg: 80.0 },
      ];
      const pts = buildWeightChartPoints(weights, 'kg', 'es');
      expect(pts).toHaveLength(2);
      expect(pts[0]!.date).toBe('2026-10-01');
      expect(pts[0]!.value).toBe(80);
      expect(pts[1]!.date).toBe('2026-10-15');
      expect(pts[1]!.value).toBe(81.5);
    });

    it('construye puntos de medidas corporales en cm y pulgadas', () => {
      const measurements = [
        { id: 'm1', measured_on: '2026-10-01', kind: 'waist', side: null, value_cm: 72 },
      ];
      const ptsCm = buildMeasurementChartPoints(measurements, 'kg', 'es');
      expect(ptsCm[0]!.value).toBe(72);
      expect(ptsCm[0]!.formattedValue).toBe('72 cm');

      const ptsIn = buildMeasurementChartPoints(measurements, 'lb', 'en');
      expect(ptsIn[0]!.value).toBe(28.3);
      expect(ptsIn[0]!.formattedValue).toBe('28.3 in');
    });

    it('filtra datos de salud con filterHealthDataByPeriod', () => {
      const weights = [
        { id: 'w1', measured_on: '2026-09-01', weight_kg: 80 },
        { id: 'w2', measured_on: '2026-11-10', weight_kg: 82 },
      ];
      const filtered = filterHealthDataByPeriod(weights, '4w', '2026-11-17');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.id).toBe('w2');
    });
  });
});
