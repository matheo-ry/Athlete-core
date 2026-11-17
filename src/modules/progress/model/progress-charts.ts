import type { Language } from '@/core/i18n';
import type { WeightUnit } from '@/core/lib';
import { formatLength, formatWeight, fromCm, fromKg } from '@/core/lib';
import type { ChartPoint } from '@/core/ui';

import type { ExerciseSessionHistory } from './exercise-history';

export type ProgressPeriod = '4w' | '3m' | 'all';
export type ExerciseChartMetric = 'estimated_rm' | 'max_weight' | 'volume' | 'reps';

/**
 * Devuelve la fecha límite inferior (YYYY-MM-DD) para el periodo seleccionado,
 * o null si el periodo es 'all'.
 */
export function getPeriodCutoffDate(period: ProgressPeriod, referenceDate?: string): string | null {
  if (period === 'all') {
    return null;
  }

  const baseDate = referenceDate ? new Date(`${referenceDate}T00:00:00Z`) : new Date();
  const daysAgo = period === '4w' ? 28 : 90;
  const targetDate = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  return targetDate.toISOString().slice(0, 10);
}

/**
 * Filtra sesiones de entreno según el periodo temporal indicado (D-129).
 */
export function filterSessionsByPeriod(
  sessions: readonly ExerciseSessionHistory[],
  period: ProgressPeriod,
  referenceDate?: string,
): ExerciseSessionHistory[] {
  const cutoff = getPeriodCutoffDate(period, referenceDate);
  if (cutoff === null) {
    return [...sessions];
  }
  return sessions.filter((s) => s.performedOn >= cutoff);
}

/**
 * D-129: "El % de progreso compara el RM estimado, no el peso suelto,
 * del primer al último entreno del periodo."
 * Devuelve null si no hay al menos dos sesiones con RM estimado en el periodo,
 * o el porcentaje redondeado a 1 decimal (ej. 10.5 para +10.5%).
 */
export function calculateRmProgressPercentage(
  sessions: readonly ExerciseSessionHistory[],
): number | null {
  const sessionsWithRm = sessions.filter((s) => s.maxRm != null && s.maxRm > 0);
  if (sessionsWithRm.length < 2) {
    return null;
  }

  const firstRm = sessionsWithRm[0]!.maxRm!;
  const lastRm = sessionsWithRm[sessionsWithRm.length - 1]!.maxRm!;

  if (firstRm <= 0) {
    return null;
  }

  const pct = ((lastRm - firstRm) / firstRm) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Construye los puntos para la gráfica de línea de un ejercicio según la métrica elegida.
 * `formatReps` llega traducido desde la pantalla: `model/` no usa i18n.
 */
export function buildExerciseChartPoints(
  sessions: readonly ExerciseSessionHistory[],
  metric: ExerciseChartMetric,
  unit: WeightUnit,
  language: Language,
  formatReps: (count: number) => string,
): ChartPoint<ExerciseSessionHistory>[] {
  return sessions.map((s) => {
    let value = 0;
    let formattedValue = '';

    switch (metric) {
      case 'estimated_rm': {
        const kg = s.maxRm ?? 0;
        value = Math.round(fromKg(kg, unit) * 10) / 10;
        formattedValue = formatWeight(kg, unit, language);
        break;
      }
      case 'max_weight': {
        const kg = s.maxWeightKg ?? 0;
        value = Math.round(fromKg(kg, unit) * 10) / 10;
        formattedValue = formatWeight(kg, unit, language);
        break;
      }
      case 'volume': {
        const kg = s.volumeKg;
        value = Math.round(fromKg(kg, unit) * 10) / 10;
        formattedValue = formatWeight(kg, unit, language);
        break;
      }
      case 'reps': {
        value = s.totalReps;
        formattedValue = formatReps(s.totalReps);
        break;
      }
    }

    return {
      id: `${s.workoutId}-${s.sessionNumber}`,
      date: s.performedOn,
      label: s.label,
      value,
      formattedValue,
      raw: s,
    };
  });
}

/**
 * Filtra registros de salud por periodo temporal.
 */
export function filterHealthDataByPeriod<T extends { measured_on: string }>(
  items: readonly T[],
  period: ProgressPeriod,
  referenceDate?: string,
): T[] {
  const cutoff = getPeriodCutoffDate(period, referenceDate);
  if (cutoff === null) {
    return [...items];
  }
  return items.filter((item) => item.measured_on >= cutoff);
}

export interface WeightRecordInput {
  id: string;
  measured_on: string;
  weight_kg: number;
}

/**
 * Construye puntos para la gráfica de peso corporal.
 */
export function buildWeightChartPoints(
  weights: readonly WeightRecordInput[],
  unit: WeightUnit,
  language: Language,
): ChartPoint<WeightRecordInput>[] {
  // Orden ascendente por fecha
  const sorted = [...weights].sort((a, b) => a.measured_on.localeCompare(b.measured_on));

  return sorted.map((w) => {
    const val = Math.round(fromKg(w.weight_kg, unit) * 10) / 10;
    return {
      id: w.id,
      date: w.measured_on,
      value: val,
      formattedValue: formatWeight(w.weight_kg, unit, language),
      raw: w,
    };
  });
}

export interface MeasurementRecordInput {
  id: string;
  measured_on: string;
  kind: string;
  side: string | null;
  value_cm: number;
}

/**
 * Construye puntos para la gráfica de una medida corporal específica.
 */
export function buildMeasurementChartPoints(
  measurements: readonly MeasurementRecordInput[],
  unit: WeightUnit,
  language: Language,
): ChartPoint<MeasurementRecordInput>[] {
  const sorted = [...measurements].sort((a, b) => a.measured_on.localeCompare(b.measured_on));

  return sorted.map((m) => ({
    id: m.id,
    date: m.measured_on,
    value: Math.round(fromCm(m.value_cm, unit) * 10) / 10,
    formattedValue: formatLength(m.value_cm, unit, language),
    raw: m,
  }));
}
