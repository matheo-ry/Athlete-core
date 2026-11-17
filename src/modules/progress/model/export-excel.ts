import writeXlsxFile from 'write-excel-file/universal';

import type { Language } from '@/core/i18n';
import type { WeightUnit } from '@/core/lib';
import { fromKg } from '@/core/lib';
import { shareOrDownloadFile } from '@/core/native';
import type { FileShareOutcome } from '@/core/native';

import type { RawWorkout, RawWorkoutSet } from './exercise-history';

export interface ExcelHealthData {
  hasConsent: boolean;
  weights: Array<{
    id?: string;
    measured_on: string;
    weight_kg: number;
  }>;
}

export type ExcelCellValue = string | number | boolean | Date | null | undefined;

export interface ExcelCellObject {
  value?: ExcelCellValue;
  type?: StringConstructor | NumberConstructor | BooleanConstructor | DateConstructor;
  fontWeight?: 'bold';
  align?: 'left' | 'center' | 'right';
  format?: string;
}

export type ExcelCell = ExcelCellObject | ExcelCellValue;
export type ExcelRow = ExcelCell[];

export interface ExcelSheetColumn {
  width?: number;
}

export interface ExcelSheet {
  sheet?: string;
  columns?: ExcelSheetColumn[];
  data: ExcelRow[];
}

export interface ExcelExportOptions {
  workouts: RawWorkout[];
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>;
  healthData: ExcelHealthData | null;
  language: Language;
  unit: WeightUnit;
  clientName?: string;
}

/**
 * Formatea una serie para Excel con el formato "45X8(1)" (D-131).
 */
export function formatSetTextForExcel(
  set: RawWorkoutSet,
  measurement: string,
  isUnilateral: boolean,
  language: Language,
  unit: WeightUnit = 'kg',
): string {
  let sidePrefix = '';
  if (isUnilateral) {
    if (set.side === 'right') {
      sidePrefix = language === 'en' ? 'R: ' : 'D: ';
    } else if (set.side === 'left') {
      sidePrefix = language === 'en' ? 'L: ' : 'I: ';
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
 * Limpia y recorta el nombre de una hoja para respetar los límites de Excel (máx 31 caracteres).
 */
export function sanitizeSheetName(name: string): string {
  const clean = name.replace(/[\\/?*[\]:]/g, '-').trim();
  return clean.slice(0, 31) || 'Rutina';
}

/**
 * Construye la hoja "Día a día": fecha · rutina · día; cada ejercicio con sus series y nota (D-131).
 */
export function buildDailySheet(
  workouts: RawWorkout[],
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>,
  language: Language,
  unit: WeightUnit,
): ExcelSheet {
  const sheetTitle = language === 'en' ? 'Daily' : 'Día a día';
  const headers = [
    { value: language === 'en' ? 'Date' : 'Fecha', fontWeight: 'bold' as const },
    { value: language === 'en' ? 'Routine' : 'Rutina', fontWeight: 'bold' as const },
    { value: language === 'en' ? 'Day' : 'Día', fontWeight: 'bold' as const },
    { value: language === 'en' ? 'Exercise' : 'Ejercicio', fontWeight: 'bold' as const },
    { value: language === 'en' ? 'Sets' : 'Series', fontWeight: 'bold' as const },
    { value: language === 'en' ? 'Note' : 'Nota', fontWeight: 'bold' as const },
  ];

  const rows: ExcelRow[] = [headers];

  // Ordenar entrenos por fecha ascendente
  const sortedWorkouts = [...workouts].sort((a, b) => a.performed_on.localeCompare(b.performed_on));

  for (const w of sortedWorkouts) {
    const routineName = w.programs?.name ?? (language === 'en' ? 'No routine' : 'Sin rutina');
    const dayLabel =
      w.day_number != null
        ? language === 'en'
          ? `Day ${w.day_number}`
          : `Día ${w.day_number}`
        : '';

    const sortedExercises = [...w.workout_exercises].sort((a, b) => a.position - b.position);

    for (const ex of sortedExercises) {
      const opt = exerciseOptionsById.get(ex.exercise_id);
      const exName = opt?.name ?? ex.exercise_id;
      const measurement = opt?.measurement ?? 'weight_reps';
      const isUnilateral = opt?.isUnilateral ?? false;

      let setsStr: string;
      if (ex.is_skipped) {
        setsStr = language === 'en' ? 'Skipped' : 'Saltado';
      } else {
        const doneSets = ex.workout_sets
          .filter((s) => s.is_done)
          .sort((a, b) => a.set_number - b.set_number);

        setsStr =
          doneSets.length > 0
            ? doneSets
                .map((s) => formatSetTextForExcel(s, measurement, isUnilateral, language, unit))
                .join(' / ')
            : '-';
      }

      rows.push([
        { value: w.performed_on },
        { value: routineName },
        { value: dayLabel },
        { value: exName },
        { value: setsStr },
        { value: ex.day_note ?? '' },
      ]);
    }
  }

  return {
    sheet: sheetTitle,
    columns: [
      { width: 14 },
      { width: 24 },
      { width: 12 },
      { width: 28 },
      { width: 32 },
      { width: 35 },
    ],
    data: rows,
  };
}

/**
 * Construye una hoja por rutina: cada ejercicio con sus entrenos (día, fecha, series y nota) (D-131).
 */
export function buildRoutineSheets(
  workouts: RawWorkout[],
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>,
  language: Language,
  unit: WeightUnit,
): ExcelSheet[] {
  // Agrupar entrenos por rutina (program_id)
  const routineGroups = new Map<string, { programName: string; workouts: RawWorkout[] }>();

  for (const w of workouts) {
    const key = w.program_id ?? 'no-program';
    let group = routineGroups.get(key);
    if (!group) {
      const programName =
        w.programs?.name ?? (language === 'en' ? 'Other routines' : 'Otras rutinas');
      group = { programName, workouts: [] };
      routineGroups.set(key, group);
    }
    group.workouts.push(w);
  }

  const sheets: ExcelSheet[] = [];
  const usedSheetNames = new Set<string>();

  for (const { programName, workouts: routineWorkouts } of routineGroups.values()) {
    let baseSheetName = sanitizeSheetName(programName);
    if (usedSheetNames.has(baseSheetName)) {
      baseSheetName = `${baseSheetName.slice(0, 28)} 2`;
    }
    usedSheetNames.add(baseSheetName);

    const headers = [
      { value: language === 'en' ? 'Exercise' : 'Ejercicio', fontWeight: 'bold' as const },
      { value: language === 'en' ? 'Day' : 'Día', fontWeight: 'bold' as const },
      { value: language === 'en' ? 'Date' : 'Fecha', fontWeight: 'bold' as const },
      { value: language === 'en' ? 'Sets' : 'Series', fontWeight: 'bold' as const },
      { value: language === 'en' ? 'Note' : 'Nota', fontWeight: 'bold' as const },
    ];

    const rows: ExcelRow[] = [headers];

    // Agrupar por ejercicio dentro de esta rutina
    const exerciseSessions = new Map<
      string,
      Array<{ dayLabel: string; performedOn: string; setsText: string; note: string }>
    >();

    const sortedRoutineWorkouts = [...routineWorkouts].sort((a, b) =>
      a.performed_on.localeCompare(b.performed_on),
    );

    for (const w of sortedRoutineWorkouts) {
      const dayLabel =
        w.day_number != null
          ? language === 'en'
            ? `Day ${w.day_number}`
            : `Día ${w.day_number}`
          : '';

      for (const ex of w.workout_exercises) {
        let list = exerciseSessions.get(ex.exercise_id);
        if (!list) {
          list = [];
          exerciseSessions.set(ex.exercise_id, list);
        }

        const opt = exerciseOptionsById.get(ex.exercise_id);
        const measurement = opt?.measurement ?? 'weight_reps';
        const isUnilateral = opt?.isUnilateral ?? false;

        let setsStr: string;
        if (ex.is_skipped) {
          setsStr = language === 'en' ? 'Skipped' : 'Saltado';
        } else {
          const doneSets = ex.workout_sets
            .filter((s) => s.is_done)
            .sort((a, b) => a.set_number - b.set_number);

          setsStr =
            doneSets.length > 0
              ? doneSets
                  .map((s) => formatSetTextForExcel(s, measurement, isUnilateral, language, unit))
                  .join(' / ')
              : '-';
        }

        list.push({
          dayLabel,
          performedOn: w.performed_on,
          setsText: setsStr,
          note: ex.day_note ?? '',
        });
      }
    }

    // Agregar filas por ejercicio
    for (const [exId, sessions] of exerciseSessions.entries()) {
      const opt = exerciseOptionsById.get(exId);
      const exName = opt?.name ?? exId;

      for (const s of sessions) {
        rows.push([
          { value: exName },
          { value: s.dayLabel },
          { value: s.performedOn },
          { value: s.setsText },
          { value: s.note },
        ]);
      }
    }

    sheets.push({
      sheet: baseSheetName,
      columns: [{ width: 28 }, { width: 12 }, { width: 14 }, { width: 32 }, { width: 35 }],
      data: rows,
    });
  }

  return sheets;
}

/**
 * Construye la hoja "Peso corporal" SOLO si hay consentimiento de salud (D-126, D-131).
 */
export function buildWeightSheet(
  healthData: ExcelHealthData | null,
  language: Language,
  unit: WeightUnit,
): ExcelSheet | null {
  if (healthData?.hasConsent !== true) {
    return null;
  }

  const sheetTitle = language === 'en' ? 'Body weight' : 'Peso corporal';
  const headers = [
    { value: language === 'en' ? 'Date' : 'Fecha', fontWeight: 'bold' as const },
    {
      value: language === 'en' ? `Weight (${unit})` : `Peso (${unit})`,
      fontWeight: 'bold' as const,
    },
  ];

  const sortedWeights = [...healthData.weights].sort((a, b) =>
    a.measured_on.localeCompare(b.measured_on),
  );

  const rows: ExcelRow[] = [headers];

  for (const w of sortedWeights) {
    const converted = fromKg(w.weight_kg, unit);
    const rounded = Math.round(converted * 10) / 10;
    rows.push([{ value: w.measured_on }, { value: rounded }]);
  }

  return {
    sheet: sheetTitle,
    columns: [{ width: 16 }, { width: 16 }],
    data: rows,
  };
}

/**
 * Construye la lista completa de hojas para el archivo Excel.
 */
export function buildWorkoutSheets(options: ExcelExportOptions): ExcelSheet[] {
  const { workouts, exerciseOptionsById, healthData, language, unit } = options;

  const sheets: ExcelSheet[] = [];

  // 1. Hoja "Día a día"
  sheets.push(buildDailySheet(workouts, exerciseOptionsById, language, unit));

  // 2. Una hoja por rutina
  const routineSheets = buildRoutineSheets(workouts, exerciseOptionsById, language, unit);
  sheets.push(...routineSheets);

  // 3. Hoja "Peso corporal" si hay consentimiento
  const weightSheet = buildWeightSheet(healthData, language, unit);
  if (weightSheet) {
    sheets.push(weightSheet);
  }

  return sheets;
}

/**
 * Convierte las hojas a un Blob de Excel compatible con navegadores y tests.
 */
export async function generateExcelBlob(sheets: ExcelSheet[]): Promise<Blob> {
  const writer = writeXlsxFile as unknown as (sheetsData: unknown) => {
    toBlob: () => Promise<Blob>;
  };
  const result = writer(sheets);
  return await result.toBlob();
}

/**
 * Descarga o comparte el archivo Excel de entrenos (D-131).
 */
export async function exportWorkoutsToExcel(
  options: ExcelExportOptions,
): Promise<FileShareOutcome> {
  const sheets = buildWorkoutSheets(options);
  const blob = await generateExcelBlob(sheets);

  const now = new Date().toISOString().split('T')[0];
  const nameSlug = options.clientName
    ? `-${options.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    : '';
  const fileName = `entrenos${nameSlug}-${now}.xlsx`;

  return await shareOrDownloadFile(blob, fileName);
}
