import type { Cell, Row, Sheet, SheetData } from 'write-excel-file/universal';

import type { WeightUnit } from '@/core/lib';
import { fromKg } from '@/core/lib';

import type { RawWorkoutExercise, RawWorkoutSet } from './exercise-history';

export type ExcelSheet = Sheet<Blob>;
export type ExcelRow = Row;
export type ExcelCell = Cell;
export type { SheetData as ExcelSheetData };

export interface ExcelHealthData {
  hasConsent: boolean;
  weights: Array<{
    id?: string;
    measured_on: string;
    weight_kg: number;
  }>;
}

export interface ExcelTranslations {
  daily: string;
  date: string;
  routine: string;
  day: string;
  dayLabel: (number: number) => string;
  exercise: string;
  sets: string;
  note: string;
  bodyWeight: string;
  weightColumn: (unit: string) => string;
  skipped: string;
  noRoutine: string;
  otherRoutines: string;
  sideRight: string;
  sideLeft: string;
  fileName: string;
}

/**
 * Obtiene las traducciones requeridas para el Excel desde una función `t` de i18n (regla de oro 7).
 */
export function getExcelTranslations(
  t: (key: string, options?: Record<string, unknown>) => string,
): ExcelTranslations {
  return {
    daily: t('progress.excel.daily'),
    date: t('progress.excel.date'),
    routine: t('progress.excel.routine'),
    day: t('progress.excel.day'),
    dayLabel: (number: number) => t('progress.excel.dayLabel', { number }),
    exercise: t('progress.excel.exercise'),
    sets: t('progress.excel.sets'),
    note: t('progress.excel.note'),
    bodyWeight: t('progress.excel.bodyWeight'),
    weightColumn: (unit: string) => t('progress.excel.weightColumn', { unit }),
    skipped: t('progress.excel.skipped'),
    noRoutine: t('progress.excel.noRoutine'),
    otherRoutines: t('progress.excel.otherRoutines'),
    sideRight: t('progress.excel.sideRight'),
    sideLeft: t('progress.excel.sideLeft'),
    fileName: t('progress.excel.fileName'),
  };
}

/**
 * Formatea una serie individual para Excel con el formato "45X8(1)" (D-131, D-149).
 */
export function formatSetTextForExcel(
  set: RawWorkoutSet,
  measurement: string,
  isUnilateral: boolean,
  translations: ExcelTranslations,
  unit: WeightUnit = 'kg',
): string {
  let sidePrefix = '';
  if (isUnilateral) {
    if (set.side === 'right') {
      sidePrefix = translations.sideRight;
    } else if (set.side === 'left') {
      sidePrefix = translations.sideLeft;
    }
  }

  let intensityText = '';
  if (set.intensity_type === 'failure') {
    intensityText = '(F)';
  } else if (set.intensity_type === 'rir' && set.intensity_value != null) {
    intensityText = `(${set.intensity_value})`;
  } else if (set.intensity_type === 'rpe' && set.intensity_value != null) {
    const rir = Math.max(0, 10 - set.intensity_value);
    intensityText = `(${rir})`;
  } else if (set.intensity_value != null) {
    intensityText = `(${set.intensity_value})`;
  }

  if (measurement === 'time') {
    const dur = set.duration_seconds ?? 0;
    return `${sidePrefix}${dur}s${intensityText}`;
  }

  if (measurement === 'distance') {
    const dist = set.distance_meters ?? 0;
    return `${sidePrefix}${dist}m${intensityText}`;
  }

  const rawWeight = set.weight_kg ?? 0;
  const convertedWeight = fromKg(rawWeight, unit);
  const formattedWeight =
    Math.round(convertedWeight * 10) / 10 === Math.round(convertedWeight)
      ? Math.round(convertedWeight).toString()
      : (Math.round(convertedWeight * 10) / 10).toString();

  const reps = set.reps ?? 0;
  return `${sidePrefix}${formattedWeight}X${reps}${intensityText}`;
}

/**
 * Formatea el conjunto de series de un ejercicio para una sesión dada (D-131, D-149).
 */
export function formatWorkoutExerciseSets(
  ex: RawWorkoutExercise,
  measurement: string,
  isUnilateral: boolean,
  translations: ExcelTranslations,
  unit: WeightUnit = 'kg',
): string {
  if (ex.is_skipped) {
    return translations.skipped;
  }

  const doneSets = ex.workout_sets
    .filter((s) => s.is_done)
    .sort((a, b) => a.set_number - b.set_number);

  if (doneSets.length === 0) {
    return '-';
  }

  return doneSets
    .map((s) => formatSetTextForExcel(s, measurement, isUnilateral, translations, unit))
    .join(' / ');
}

/**
 * Limpia y recorta el nombre de una hoja para respetar los límites de Excel (máx 31 caracteres).
 */
export function sanitizeSheetName(name: string): string {
  const clean = name.replace(/[\\/?*[\]:]/g, '-').trim();
  return clean.slice(0, 31) || 'Rutina';
}

/**
 * Desambigua nombres de hoja para asegurar que sean únicos y no superen 31 caracteres.
 */
export function deduplicateSheetNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of names) {
    const clean = sanitizeSheetName(name);
    let finalName = clean;
    let counter = 2;
    while (seen.has(finalName)) {
      const suffix = ` (${counter})`;
      const maxBaseLen = 31 - suffix.length;
      finalName = `${clean.slice(0, maxBaseLen).trim()}${suffix}`;
      counter++;
    }
    seen.add(finalName);
    result.push(finalName);
  }

  return result;
}

/**
 * Normaliza y limpia un nombre para generar slugs de archivo seguros (p. ej. "José" -> "jose").
 */
export function sanitizeFileNameSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Construye el nombre de archivo Excel con fecha y slug del cliente (D-149).
 */
export function buildExcelFileName(
  clientName: string | undefined,
  translations: ExcelTranslations,
  dateStr = new Date().toISOString().split('T')[0],
): string {
  const base = translations.fileName;
  const nameSlug = clientName ? `-${sanitizeFileNameSlug(clientName)}` : '';
  return `${base}${nameSlug}-${dateStr}.xlsx`;
}
