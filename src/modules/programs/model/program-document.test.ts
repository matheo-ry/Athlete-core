import { describe, expect, it } from 'vitest';

import {
  newTemplate,
  newTemplateSchema,
  parseProgramDocument,
  programDocumentSchema,
  toSavePayload,
} from './program-document';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Una rutina como la devuelve la base de datos: anidada y sin ordenar.
const ROW = {
  id: uuid(1),
  name: 'Casa + Gym',
  client_id: null,
  updated_at: '2026-11-15T10:00:00+00:00',
  program_blocks: [
    {
      id: uuid(2),
      position: 1,
      name: null,
      cycle_days: 2,
      laps: null,
      program_days: [
        {
          id: uuid(4),
          day_number: 2,
          kind: 'rest',
          name: null,
          subtitle: null,
          place: null,
          program_day_exercises: [],
        },
        {
          id: uuid(3),
          day_number: 1,
          kind: 'training',
          name: null,
          subtitle: 'Tirón + pierna',
          place: 'Gym',
          program_day_exercises: [
            {
              id: uuid(6),
              position: 2,
              exercise_id: uuid(21),
              superset_group: null,
              rest_seconds: 60,
              note: null,
              program_sets: [
                {
                  id: uuid(8),
                  position: 1,
                  reps_min: null,
                  reps_max: null,
                  duration_seconds: 45,
                  distance_meters: null,
                  intensity_type: null,
                  intensity_value: null,
                  target_load_kg: null,
                },
              ],
            },
            {
              id: uuid(5),
              position: 1,
              exercise_id: uuid(20),
              superset_group: null,
              rest_seconds: 120,
              note: 'Pausa de 1 segundo arriba',
              program_sets: [
                {
                  id: uuid(7),
                  position: 2,
                  reps_min: 10,
                  reps_max: 12,
                  duration_seconds: null,
                  distance_meters: null,
                  intensity_type: 'rir',
                  intensity_value: 0,
                  target_load_kg: null,
                },
                {
                  id: uuid(9),
                  position: 1,
                  reps_min: 6,
                  reps_max: 8,
                  duration_seconds: null,
                  distance_meters: null,
                  intensity_type: 'rpe',
                  intensity_value: 7.5,
                  target_load_kg: 22.5,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('el documento de una rutina (D-079)', () => {
  it('lee la rutina de la base de datos y la ordena por posición y por día', () => {
    const document = parseProgramDocument(ROW);
    const [block] = document.blocks;

    expect(document).toMatchObject({ id: uuid(1), name: 'Casa + Gym', clientId: null });
    expect(block?.days.map((day) => day.dayNumber)).toEqual([1, 2]);
    const [first, second] = block?.days[0]?.exercises ?? [];
    expect(first?.exerciseId).toBe(uuid(20));
    expect(second?.exerciseId).toBe(uuid(21));
    expect(first?.sets.map((set) => set.repsMin)).toEqual([6, 10]);
    expect(first?.sets[0]).toMatchObject({
      intensityType: 'rpe',
      intensityValue: 7.5,
      targetLoadKg: 22.5,
    });
  });

  it('rechaza lo que no cuadra con la base de datos', () => {
    expect(() => parseProgramDocument({ ...ROW, program_blocks: [] })).toThrow();
    expect(() => parseProgramDocument({ ...ROW, name: '' })).toThrow();
    expect(() => parseProgramDocument({ id: 'no-es-un-uuid' })).toThrow();
  });

  it('se envía a save_program con los nombres de la base de datos, en orden y con su updated_at', () => {
    const payload = toSavePayload(parseProgramDocument(ROW));

    expect(payload).toMatchObject({
      id: uuid(1),
      expected_updated_at: '2026-11-15T10:00:00+00:00',
    });
    const day = payload.blocks[0]?.days[0];
    expect(day).toMatchObject({ id: uuid(3), day_number: 1, kind: 'training', place: 'Gym' });
    expect(day?.exercises.map((item) => item.exercise_id)).toEqual([uuid(20), uuid(21)]);
    expect(day?.exercises[0]?.sets[0]).toEqual({
      id: uuid(9),
      reps_min: 6,
      reps_max: 8,
      duration_seconds: null,
      distance_meters: null,
      intensity_type: 'rpe',
      intensity_value: 7.5,
      target_load_kg: 22.5,
    });
  });

  it('una plantilla nueva: un bloque sin fin con todos sus días de descanso', () => {
    const template = newTemplate('  Prueba  ', 10);

    expect(template).toMatchObject({ id: null, updatedAt: null, name: 'Prueba', clientId: null });
    expect(template.blocks).toHaveLength(1);
    expect(template.blocks[0]).toMatchObject({ id: null, cycleDays: 10, laps: null });
    expect(template.blocks[0]?.days.map((day) => [day.dayNumber, day.kind])).toEqual(
      Array.from({ length: 10 }, (_, index) => [index + 1, 'rest']),
    );
    expect(programDocumentSchema.safeParse(template).success).toBe(true);
  });

  it('el esquema del documento tiene los mismos topes que la base de datos (D-086)', () => {
    const template = newTemplate('Prueba', 1);
    const withBlocks = (count: number) => ({
      ...template,
      blocks: Array.from({ length: count }, () => template.blocks[0]),
    });

    expect(programDocumentSchema.safeParse(withBlocks(12)).success).toBe(true);
    expect(programDocumentSchema.safeParse(withBlocks(13)).success).toBe(false);
    expect(programDocumentSchema.safeParse({ ...template, name: 'a'.repeat(81) }).success).toBe(
      false,
    );
  });
});

describe('el formulario de "Nueva plantilla"', () => {
  it('pide un nombre y de 1 a 28 días de ciclo', () => {
    expect(newTemplateSchema.parse({ name: ' Prueba ', cycleDays: '10' })).toEqual({
      name: 'Prueba',
      cycleDays: 10,
    });
    expect(
      newTemplateSchema.safeParse({ name: '  ', cycleDays: '7' }).error?.issues[0]?.message,
    ).toBe('programs.form.nameRequired');
    for (const cycleDays of ['0', '29', '7.5', '', 'siete']) {
      expect(newTemplateSchema.safeParse({ name: 'Prueba', cycleDays }).success).toBe(false);
    }
    expect(newTemplateSchema.safeParse({ name: 'Prueba', cycleDays: '28' }).success).toBe(true);
  });
});
