import writeXlsxFile from 'write-excel-file/universal';

import type { WeightUnit } from '@/core/lib';
import { fromKg } from '@/core/lib';
import { shareOrDownloadFile, type FileShareOutcome } from '@/core/native';

import type { RawWorkout } from './exercise-history';
import {
  buildExcelFileName,
  deduplicateSheetNames,
  formatWorkoutExerciseSets,
  type ExcelHealthData,
  type ExcelRow,
  type ExcelSheet,
  type ExcelTranslations,
} from './excel-format';

// Re-export types and helpers for callers
export * from './excel-format';

export interface ExcelExportOptions {
  workouts: RawWorkout[];
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>;
  healthData: ExcelHealthData | null;
  translations: ExcelTranslations;
  unit: WeightUnit;
  clientName?: string;
}

/**
 * Construye la hoja "Día a día": fecha · rutina · día; cada ejercicio con sus series y nota (D-131, D-149).
 * Orden cronológico inverso (de más reciente a más antiguo, D-149).
 */
export function buildDailySheet(
  workouts: RawWorkout[],
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>,
  translations: ExcelTranslations,
  unit: WeightUnit,
): ExcelSheet {
  const sheetTitle = translations.daily;
  const headers: ExcelRow = [
    { value: translations.date, fontWeight: 'bold' as const },
    { value: translations.routine, fontWeight: 'bold' as const },
    { value: translations.day, fontWeight: 'bold' as const },
    { value: translations.exercise, fontWeight: 'bold' as const },
    { value: translations.sets, fontWeight: 'bold' as const },
    { value: translations.note, fontWeight: 'bold' as const },
  ];

  const rows: ExcelRow[] = [headers];

  // Orden cronológico inverso (más reciente primero, D-149)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateDiff = b.performed_on.localeCompare(a.performed_on);
    if (dateDiff !== 0) return dateDiff;
    return (b.started_at ?? '').localeCompare(a.started_at ?? '');
  });

  for (const w of sortedWorkouts) {
    const routineName = w.programs?.name ?? translations.noRoutine;
    const dayLabel = w.day_number != null ? translations.dayLabel(w.day_number) : '';
    const sortedExercises = [...w.workout_exercises].sort((a, b) => a.position - b.position);

    for (const ex of sortedExercises) {
      const opt = exerciseOptionsById.get(ex.exercise_id);
      const exName = opt?.name ?? ex.exercise_id;
      const measurement = opt?.measurement ?? 'weight_reps';
      const isUnilateral = opt?.isUnilateral ?? false;

      const setsStr = formatWorkoutExerciseSets(ex, measurement, isUnilateral, translations, unit);

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
 * Construye una hoja por rutina: cada ejercicio con sus entrenos (día, fecha, series y nota) (D-131, D-149).
 */
export function buildRoutineSheets(
  workouts: RawWorkout[],
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>,
  translations: ExcelTranslations,
  unit: WeightUnit,
): ExcelSheet[] {
  // Agrupar entrenos por rutina (program_id)
  const routineGroups = new Map<string, { programName: string; workouts: RawWorkout[] }>();

  for (const w of workouts) {
    const key = w.program_id ?? 'no-program';
    let group = routineGroups.get(key);
    if (!group) {
      const programName = w.programs?.name ?? translations.otherRoutines;
      group = { programName, workouts: [] };
      routineGroups.set(key, group);
    }
    group.workouts.push(w);
  }

  const rawSheetNames = Array.from(routineGroups.values()).map((g) => g.programName);
  const deduplicatedNames = deduplicateSheetNames(rawSheetNames);

  const sheets: ExcelSheet[] = [];
  let nameIndex = 0;

  for (const { workouts: routineWorkouts } of routineGroups.values()) {
    const sheetName = deduplicatedNames[nameIndex++] ?? 'Rutina';

    const headers: ExcelRow = [
      { value: translations.exercise, fontWeight: 'bold' as const },
      { value: translations.day, fontWeight: 'bold' as const },
      { value: translations.date, fontWeight: 'bold' as const },
      { value: translations.sets, fontWeight: 'bold' as const },
      { value: translations.note, fontWeight: 'bold' as const },
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
      const dayLabel = w.day_number != null ? translations.dayLabel(w.day_number) : '';

      for (const ex of w.workout_exercises) {
        let list = exerciseSessions.get(ex.exercise_id);
        if (!list) {
          list = [];
          exerciseSessions.set(ex.exercise_id, list);
        }

        const opt = exerciseOptionsById.get(ex.exercise_id);
        const measurement = opt?.measurement ?? 'weight_reps';
        const isUnilateral = opt?.isUnilateral ?? false;

        const setsStr = formatWorkoutExerciseSets(
          ex,
          measurement,
          isUnilateral,
          translations,
          unit,
        );

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
      sheet: sheetName,
      columns: [{ width: 28 }, { width: 12 }, { width: 14 }, { width: 32 }, { width: 35 }],
      data: rows,
    });
  }

  return sheets;
}

/**
 * Construye la hoja "Peso corporal" SOLO si hay consentimiento de salud y registros de peso (D-126, D-149).
 */
export function buildWeightSheet(
  healthData: ExcelHealthData | null,
  translations: ExcelTranslations,
  unit: WeightUnit,
): ExcelSheet | null {
  if (healthData?.hasConsent !== true || !healthData.weights || healthData.weights.length === 0) {
    return null;
  }

  const sheetTitle = translations.bodyWeight;
  const headers: ExcelRow = [
    { value: translations.date, fontWeight: 'bold' as const },
    {
      value: translations.weightColumn(unit),
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
  const { workouts, exerciseOptionsById, healthData, translations, unit } = options;

  const sheets: ExcelSheet[] = [];

  // 1. Hoja "Día a día" (orden cronológico inverso)
  sheets.push(buildDailySheet(workouts, exerciseOptionsById, translations, unit));

  // 2. Una hoja por rutina
  const routineSheets = buildRoutineSheets(workouts, exerciseOptionsById, translations, unit);
  sheets.push(...routineSheets);

  // 3. Hoja "Peso corporal" si hay consentimiento y registros de peso
  const weightSheet = buildWeightSheet(healthData, translations, unit);
  if (weightSheet) {
    sheets.push(weightSheet);
  }

  return sheets;
}

/**
 * Convierte las hojas a un Blob de Excel compatible con navegadores y tests.
 */
export async function generateExcelBlob(sheets: ExcelSheet[]): Promise<Blob> {
  const result = writeXlsxFile(sheets);
  return await result.toBlob();
}

/**
 * Descarga o comparte el archivo Excel de entrenos (D-131, D-149).
 */
export async function exportWorkoutsToExcel(
  options: ExcelExportOptions,
): Promise<FileShareOutcome> {
  const sheets = buildWorkoutSheets(options);
  const blob = await generateExcelBlob(sheets);
  const fileName = buildExcelFileName(options.clientName, options.translations);

  return await shareOrDownloadFile(blob, fileName);
}
