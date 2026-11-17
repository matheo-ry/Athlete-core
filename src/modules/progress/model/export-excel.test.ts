import { describe, expect, it, vi } from 'vitest';

import type { RawWorkout, RawWorkoutSet } from './exercise-history';
import {
  buildDailySheet,
  buildExcelFileName,
  buildRoutineSheets,
  buildWeightSheet,
  buildWorkoutSheets,
  deduplicateSheetNames,
  type ExcelHealthData,
  type ExcelTranslations,
  formatSetTextForExcel,
  formatWorkoutExerciseSets,
  generateExcelBlob,
  getExcelTranslations,
  sanitizeFileNameSlug,
  sanitizeSheetName,
} from './export-excel';

const esTranslations: ExcelTranslations = {
  daily: 'Día a día',
  date: 'Fecha',
  routine: 'Rutina',
  day: 'Día',
  dayLabel: (n: number) => `Día ${n}`,
  exercise: 'Ejercicio',
  sets: 'Series',
  note: 'Nota',
  bodyWeight: 'Peso corporal',
  weightColumn: (u: string) => `Peso (${u})`,
  skipped: 'Saltado',
  noRoutine: 'Sin rutina',
  otherRoutines: 'Otras rutinas',
  sideRight: 'D: ',
  sideLeft: 'I: ',
  fileName: 'entrenos',
};

const enTranslations: ExcelTranslations = {
  daily: 'Day by day',
  date: 'Date',
  routine: 'Routine',
  day: 'Day',
  dayLabel: (n: number) => `Day ${n}`,
  exercise: 'Exercise',
  sets: 'Sets',
  note: 'Note',
  bodyWeight: 'Body weight',
  weightColumn: (u: string) => `Weight (${u})`,
  skipped: 'Skipped',
  noRoutine: 'No routine',
  otherRoutines: 'Other routines',
  sideRight: 'R: ',
  sideLeft: 'L: ',
  fileName: 'workouts',
};

describe('export-excel (D-131, D-149)', () => {
  describe('formatSetTextForExcel', () => {
    it('formatea series con notación X y RIR en paréntesis: 45X8(1)', () => {
      const set: RawWorkoutSet = {
        id: 's-1',
        set_number: 1,
        side: 'none',
        weight_kg: 45,
        reps: 8,
        duration_seconds: null,
        distance_meters: null,
        intensity_type: 'rir',
        intensity_value: 1,
        is_done: true,
        recorded_at: '2026-10-06T18:03:00Z',
      };

      const result = formatSetTextForExcel(set, 'weight_reps', false, esTranslations, 'kg');
      expect(result).toBe('45X8(1)');
    });

    it('formatea fallo con (F)', () => {
      const set: RawWorkoutSet = {
        id: 's-2',
        set_number: 2,
        side: 'none',
        weight_kg: 50,
        reps: 6,
        duration_seconds: null,
        distance_meters: null,
        intensity_type: 'failure',
        intensity_value: null,
        is_done: true,
        recorded_at: '2026-10-06T18:06:00Z',
      };

      const result = formatSetTextForExcel(set, 'weight_reps', false, esTranslations, 'kg');
      expect(result).toBe('50X6(F)');
    });

    it('añade prefijo D:/I: en español y R:/L: en inglés para ejercicios unilaterales', () => {
      const setRight: RawWorkoutSet = {
        id: 's-3',
        set_number: 1,
        side: 'right',
        weight_kg: 30,
        reps: 9,
        duration_seconds: null,
        distance_meters: null,
        intensity_type: 'rir',
        intensity_value: 1,
        is_done: true,
        recorded_at: '2026-10-06T18:06:00Z',
      };

      expect(formatSetTextForExcel(setRight, 'weight_reps', true, esTranslations, 'kg')).toBe(
        'D: 30X9(1)',
      );
      expect(formatSetTextForExcel(setRight, 'weight_reps', true, enTranslations, 'kg')).toBe(
        'R: 30X9(1)',
      );
    });

    it('convierte a libras si la unidad es lb', () => {
      const set: RawWorkoutSet = {
        id: 's-4',
        set_number: 1,
        side: 'none',
        weight_kg: 45,
        reps: 8,
        duration_seconds: null,
        distance_meters: null,
        intensity_type: 'rir',
        intensity_value: 1,
        is_done: true,
        recorded_at: '2026-10-06T18:03:00Z',
      };

      const result = formatSetTextForExcel(set, 'weight_reps', false, esTranslations, 'lb');
      expect(result).toBe('99.2X8(1)');
    });

    it('formatea ejercicios de tiempo con segundos', () => {
      const set: RawWorkoutSet = {
        id: 's-5',
        set_number: 1,
        side: 'none',
        weight_kg: null,
        reps: null,
        duration_seconds: 45,
        distance_meters: null,
        intensity_type: 'rir',
        intensity_value: 0,
        is_done: true,
        recorded_at: '2026-10-06T18:03:00Z',
      };

      const result = formatSetTextForExcel(set, 'time', false, esTranslations, 'kg');
      expect(result).toBe('45s(0)');
    });

    it('formatea ejercicios de distancia con metros', () => {
      const set: RawWorkoutSet = {
        id: 's-6',
        set_number: 1,
        side: 'none',
        weight_kg: null,
        reps: null,
        duration_seconds: null,
        distance_meters: 100,
        intensity_type: 'rir',
        intensity_value: 2,
        is_done: true,
        recorded_at: '2026-10-06T18:03:00Z',
      };

      const result = formatSetTextForExcel(set, 'distance', false, esTranslations, 'kg');
      expect(result).toBe('100m(2)');
    });
  });

  describe('formatWorkoutExerciseSets', () => {
    it('devuelve texto saltado si el ejercicio se marcó como saltado', () => {
      const ex = {
        id: 'we-1',
        exercise_id: 'ex-1',
        replaces_exercise_id: null,
        day_note: null,
        is_skipped: true,
        position: 1,
        workout_sets: [],
      };
      expect(formatWorkoutExerciseSets(ex, 'weight_reps', false, esTranslations, 'kg')).toBe(
        'Saltado',
      );
    });

    it('devuelve guión si no hay series completadas', () => {
      const ex = {
        id: 'we-2',
        exercise_id: 'ex-1',
        replaces_exercise_id: null,
        day_note: null,
        is_skipped: false,
        position: 1,
        workout_sets: [
          {
            id: 's-1',
            set_number: 1,
            side: 'none' as const,
            weight_kg: 50,
            reps: 10,
            duration_seconds: null,
            distance_meters: null,
            intensity_type: 'rir' as const,
            intensity_value: 1,
            is_done: false,
            recorded_at: '2026-10-06T18:03:00Z',
          },
        ],
      };
      expect(formatWorkoutExerciseSets(ex, 'weight_reps', false, esTranslations, 'kg')).toBe('-');
    });
  });

  describe('sanitizeSheetName y deduplicateSheetNames', () => {
    it('elimina caracteres ilegales en Excel y limita a 31 caracteres', () => {
      const raw = 'Pecho / Espalda y Brazo / Pierna extra larga que supera 31';
      const clean = sanitizeSheetName(raw);
      expect(clean).not.toContain('/');
      expect(clean.length).toBeLessThanOrEqual(31);
    });

    it('desambigua nombres repetidos agregando sufijo numérico sin exceder 31 caracteres', () => {
      const names = [
        'Rutina de Fuerza Máxima 2026 con Nombres Largos',
        'Rutina de Fuerza Máxima 2026 con Nombres Largos',
        'Rutina de Fuerza Máxima 2026 con Nombres Largos',
      ];
      const deduped = deduplicateSheetNames(names);
      expect(deduped[0]).toHaveLength(31);
      expect(deduped[1]).toMatch(/\(2\)$/);
      expect(deduped[1]?.length).toBeLessThanOrEqual(31);
      expect(deduped[2]).toMatch(/\(3\)$/);
      expect(deduped[2]?.length).toBeLessThanOrEqual(31);
      expect(new Set(deduped).size).toBe(3);
    });
  });

  describe('sanitizeFileNameSlug y buildExcelFileName', () => {
    it('normaliza tildes y caracteres especiales para el slug del archivo', () => {
      expect(sanitizeFileNameSlug('José María')).toBe('jose-maria');
      expect(sanitizeFileNameSlug('Ana / López!')).toBe('ana-lopez');
    });

    it('construye el nombre de archivo con slug del cliente y fecha', () => {
      const fileName = buildExcelFileName('José María', esTranslations, '2026-10-06');
      expect(fileName).toBe('entrenos-jose-maria-2026-10-06.xlsx');
    });

    it('construye el nombre de archivo sin cliente si no se proporciona', () => {
      const fileName = buildExcelFileName(undefined, enTranslations, '2026-10-06');
      expect(fileName).toBe('workouts-2026-10-06.xlsx');
    });
  });

  describe('buildDailySheet', () => {
    it('crea la hoja Día a día con cabeceras y filas formateadas en orden cronológico inverso (D-149)', () => {
      const workouts: RawWorkout[] = [
        {
          id: 'w-1',
          performed_on: '2026-10-06',
          started_at: '2026-10-06T18:00:00Z',
          closed_at: '2026-10-06T19:00:00Z',
          day_number: 1,
          program_id: 'prog-1',
          programs: { id: 'prog-1', name: 'Casa + Gym' },
          workout_exercises: [
            {
              id: 'we-1',
              exercise_id: 'ex-1',
              replaces_exercise_id: null,
              day_note: 'Primera sesión',
              is_skipped: false,
              position: 1,
              workout_sets: [
                {
                  id: 's-1',
                  set_number: 1,
                  side: 'none',
                  weight_kg: 45,
                  reps: 8,
                  duration_seconds: null,
                  distance_meters: null,
                  intensity_type: 'rir',
                  intensity_value: 1,
                  is_done: true,
                  recorded_at: '2026-10-06T18:03:00Z',
                },
              ],
            },
          ],
        },
        {
          id: 'w-2',
          performed_on: '2026-10-10',
          started_at: '2026-10-10T18:00:00Z',
          closed_at: '2026-10-10T19:00:00Z',
          day_number: 2,
          program_id: 'prog-1',
          programs: { id: 'prog-1', name: 'Casa + Gym' },
          workout_exercises: [
            {
              id: 'we-2',
              exercise_id: 'ex-1',
              replaces_exercise_id: null,
              day_note: 'Segunda sesión más pesada',
              is_skipped: false,
              position: 1,
              workout_sets: [
                {
                  id: 's-2',
                  set_number: 1,
                  side: 'none',
                  weight_kg: 50,
                  reps: 8,
                  duration_seconds: null,
                  distance_meters: null,
                  intensity_type: 'rir',
                  intensity_value: 1,
                  is_done: true,
                  recorded_at: '2026-10-10T18:03:00Z',
                },
              ],
            },
          ],
        },
      ];

      const exMap = new Map([
        [
          'ex-1',
          { name: 'Flexiones con mochila', measurement: 'weight_reps', isUnilateral: false },
        ],
      ]);

      const sheet = buildDailySheet(workouts, exMap, esTranslations, 'kg');
      expect(sheet.sheet).toBe('Día a día');
      expect(sheet.data[0]![0]).toEqual(expect.objectContaining({ value: 'Fecha' }));

      // Orden cronológico inverso: el 2026-10-10 aparece primero en la fila 1
      expect(sheet.data[1]![0]).toEqual(expect.objectContaining({ value: '2026-10-10' }));
      expect(sheet.data[1]![1]).toEqual(expect.objectContaining({ value: 'Casa + Gym' }));
      expect(sheet.data[1]![2]).toEqual(expect.objectContaining({ value: 'Día 2' }));
      expect(sheet.data[1]![4]).toEqual(expect.objectContaining({ value: '50X8(1)' }));

      // El 2026-10-06 aparece segundo en la fila 2
      expect(sheet.data[2]![0]).toEqual(expect.objectContaining({ value: '2026-10-06' }));
      expect(sheet.data[2]![2]).toEqual(expect.objectContaining({ value: 'Día 1' }));
      expect(sheet.data[2]![4]).toEqual(expect.objectContaining({ value: '45X8(1)' }));
    });

    it('buildRoutineSheets agrupa por rutina y contiene sus ejercicios', () => {
      const workouts: RawWorkout[] = [
        {
          id: 'w-1',
          performed_on: '2026-10-06',
          started_at: '2026-10-06T18:00:00Z',
          closed_at: '2026-10-06T19:00:00Z',
          day_number: 1,
          program_id: 'prog-1',
          programs: { id: 'prog-1', name: 'Casa + Gym' },
          workout_exercises: [
            {
              id: 'we-1',
              exercise_id: 'ex-1',
              replaces_exercise_id: null,
              day_note: null,
              is_skipped: false,
              position: 1,
              workout_sets: [
                {
                  id: 's-1',
                  set_number: 1,
                  side: 'none',
                  weight_kg: 50,
                  reps: 10,
                  duration_seconds: null,
                  distance_meters: null,
                  intensity_type: 'rir',
                  intensity_value: 2,
                  is_done: true,
                  recorded_at: '2026-10-06T18:05:00Z',
                },
              ],
            },
          ],
        },
      ];

      const exMap = new Map([
        ['ex-1', { name: 'Press banca', measurement: 'weight_reps', isUnilateral: false }],
      ]);

      const routineSheets = buildRoutineSheets(workouts, exMap, esTranslations, 'kg');
      expect(routineSheets).toHaveLength(1);
      expect(routineSheets[0]?.sheet).toBe('Casa + Gym');
      expect(routineSheets[0]?.data[1]![0]).toEqual(
        expect.objectContaining({ value: 'Press banca' }),
      );
      expect(routineSheets[0]?.data[1]![3]).toEqual(expect.objectContaining({ value: '50X10(2)' }));
    });
  });

  describe('buildWeightSheet y buildWorkoutSheets (Criterio 3: consentimiento)', () => {
    const workouts: RawWorkout[] = [
      {
        id: 'w-1',
        performed_on: '2026-10-06',
        started_at: '2026-10-06T18:00:00Z',
        closed_at: '2026-10-06T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [],
      },
    ];
    const exMap = new Map<string, { name: string; measurement: string; isUnilateral: boolean }>();

    it('criterio 3: sin consentimiento NO hay hoja de peso', () => {
      const healthData: ExcelHealthData = {
        hasConsent: false,
        weights: [{ id: 'w-1', measured_on: '2026-10-01', weight_kg: 85 }],
      };

      const weightSheet = buildWeightSheet(healthData, esTranslations, 'kg');
      expect(weightSheet).toBeNull();

      const allSheets = buildWorkoutSheets({
        workouts,
        exerciseOptionsById: exMap,
        healthData,
        translations: esTranslations,
        unit: 'kg',
      });

      const sheetNames = allSheets.map((s) => s.sheet);
      expect(sheetNames).toContain('Día a día');
      expect(sheetNames).toContain('Casa + Gym');
      expect(sheetNames).not.toContain('Peso corporal');
    });

    it('con consentimiento pero sin registros de peso NO crea la hoja vacía', () => {
      const healthData: ExcelHealthData = {
        hasConsent: true,
        weights: [],
      };

      const weightSheet = buildWeightSheet(healthData, esTranslations, 'kg');
      expect(weightSheet).toBeNull();
    });

    it('con consentimiento y registros SÍ hay hoja de peso', () => {
      const healthData: ExcelHealthData = {
        hasConsent: true,
        weights: [
          { id: 'bw-1', measured_on: '2026-10-01', weight_kg: 85 },
          { id: 'bw-2', measured_on: '2026-10-15', weight_kg: 84.5 },
        ],
      };

      const weightSheet = buildWeightSheet(healthData, esTranslations, 'kg');
      expect(weightSheet).not.toBeNull();
      expect(weightSheet?.sheet).toBe('Peso corporal');
      expect(weightSheet?.data[1]![0]).toEqual(expect.objectContaining({ value: '2026-10-01' }));
      expect(weightSheet?.data[1]![1]).toEqual(expect.objectContaining({ value: 85 }));

      const allSheets = buildWorkoutSheets({
        workouts,
        exerciseOptionsById: exMap,
        healthData,
        translations: esTranslations,
        unit: 'kg',
      });

      const sheetNames = allSheets.map((s) => s.sheet);
      expect(sheetNames).toContain('Día a día');
      expect(sheetNames).toContain('Casa + Gym');
      expect(sheetNames).toContain('Peso corporal');
    });
  });

  describe('getExcelTranslations', () => {
    it('obtiene todas las claves desde la función t', () => {
      const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
        if (key === 'progress.excel.dayLabel') {
          const num = typeof opts?.number === 'number' ? opts.number : 0;
          return `Day ${num}`;
        }
        if (key === 'progress.excel.weightColumn') {
          const unit = typeof opts?.unit === 'string' ? opts.unit : 'kg';
          return `Weight (${unit})`;
        }
        return key;
      });

      const tr = getExcelTranslations(mockT);
      expect(tr.daily).toBe('progress.excel.daily');
      expect(tr.dayLabel(3)).toBe('Day 3');
      expect(tr.weightColumn('kg')).toBe('Weight (kg)');
    });
  });

  describe('generateExcelBlob', () => {
    it('genera un Blob binario válido con write-excel-file', async () => {
      const sheets = [
        {
          sheet: 'Día a día',
          data: [[{ value: 'Fecha' }, { value: 'Rutina' }]],
        },
      ];

      const blob = await generateExcelBlob(sheets);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});
