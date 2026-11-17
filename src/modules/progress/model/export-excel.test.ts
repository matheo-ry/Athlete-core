import { describe, expect, it } from 'vitest';

import type { RawWorkout, RawWorkoutSet } from './exercise-history';
import {
  buildDailySheet,
  buildRoutineSheets,
  buildWeightSheet,
  buildWorkoutSheets,
  type ExcelHealthData,
  formatSetTextForExcel,
  generateExcelBlob,
  sanitizeSheetName,
} from './export-excel';

describe('export-excel (D-131, D-135)', () => {
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

      const result = formatSetTextForExcel(set, 'weight_reps', false, 'es', 'kg');
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

      const result = formatSetTextForExcel(set, 'weight_reps', false, 'es', 'kg');
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

      expect(formatSetTextForExcel(setRight, 'weight_reps', true, 'es', 'kg')).toBe('D: 30X9(1)');
      expect(formatSetTextForExcel(setRight, 'weight_reps', true, 'en', 'kg')).toBe('R: 30X9(1)');
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

      const result = formatSetTextForExcel(set, 'weight_reps', false, 'es', 'lb');
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

      const result = formatSetTextForExcel(set, 'time', false, 'es', 'kg');
      expect(result).toBe('45s(0)');
    });
  });

  describe('sanitizeSheetName', () => {
    it('elimina caracteres ilegales en Excel y limita a 31 caracteres', () => {
      const raw = 'Pecho / Espalda y Brazo / Pierna extra larga que supera 31';
      const clean = sanitizeSheetName(raw);
      expect(clean).not.toContain('/');
      expect(clean.length).toBeLessThanOrEqual(31);
    });
  });

  describe('buildDailySheet', () => {
    it('crea la hoja Día a día con cabeceras y filas formateadas', () => {
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
              day_note: 'Buena sensación',
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
      ];

      const exMap = new Map([
        [
          'ex-1',
          { name: 'Flexiones con mochila', measurement: 'weight_reps', isUnilateral: false },
        ],
      ]);

      const sheet = buildDailySheet(workouts, exMap, 'es', 'kg');
      expect(sheet.sheet).toBe('Día a día');
      expect(sheet.data[0]![0]).toEqual(expect.objectContaining({ value: 'Fecha' }));
      expect(sheet.data[1]![0]).toEqual(expect.objectContaining({ value: '2026-10-06' }));
      expect(sheet.data[1]![1]).toEqual(expect.objectContaining({ value: 'Casa + Gym' }));
      expect(sheet.data[1]![2]).toEqual(expect.objectContaining({ value: 'Día 1' }));
      expect(sheet.data[1]![3]).toEqual(
        expect.objectContaining({ value: 'Flexiones con mochila' }),
      );
      expect(sheet.data[1]![4]).toEqual(expect.objectContaining({ value: '45X8(1)' }));
      expect(sheet.data[1]![5]).toEqual(expect.objectContaining({ value: 'Buena sensación' }));
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

      const routineSheets = buildRoutineSheets(workouts, exMap, 'es', 'kg');
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

      const weightSheet = buildWeightSheet(healthData, 'es', 'kg');
      expect(weightSheet).toBeNull();

      const allSheets = buildWorkoutSheets({
        workouts,
        exerciseOptionsById: exMap,
        healthData,
        language: 'es',
        unit: 'kg',
      });

      const sheetNames = allSheets.map((s) => s.sheet);
      expect(sheetNames).toContain('Día a día');
      expect(sheetNames).toContain('Casa + Gym');
      expect(sheetNames).not.toContain('Peso corporal');
    });

    it('con consentimiento SÍ hay hoja de peso', () => {
      const healthData: ExcelHealthData = {
        hasConsent: true,
        weights: [
          { id: 'bw-1', measured_on: '2026-10-01', weight_kg: 85 },
          { id: 'bw-2', measured_on: '2026-10-15', weight_kg: 84.5 },
        ],
      };

      const weightSheet = buildWeightSheet(healthData, 'es', 'kg');
      expect(weightSheet).not.toBeNull();
      expect(weightSheet?.sheet).toBe('Peso corporal');
      expect(weightSheet?.data[1]![0]).toEqual(expect.objectContaining({ value: '2026-10-01' }));
      expect(weightSheet?.data[1]![1]).toEqual(expect.objectContaining({ value: 85 }));

      const allSheets = buildWorkoutSheets({
        workouts,
        exerciseOptionsById: exMap,
        healthData,
        language: 'es',
        unit: 'kg',
      });

      const sheetNames = allSheets.map((s) => s.sheet);
      expect(sheetNames).toContain('Día a día');
      expect(sheetNames).toContain('Casa + Gym');
      expect(sheetNames).toContain('Peso corporal');
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
