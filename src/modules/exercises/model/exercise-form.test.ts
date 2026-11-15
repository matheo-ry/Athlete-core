import { describe, expect, it } from 'vitest';

import { emptyFormValues, formValuesOf, readExerciseForm } from './exercise-form';
import type { ExerciseFormValues } from './exercise-form';
import type { Exercise } from './exercise-schema';

const LAT_PULLDOWN: Exercise = {
  id: '00000000-0000-4000-8000-000000000001',
  name: null,
  libraryKey: 'lat_pulldown',
  libraryName: { en: 'Lat pulldown', es: 'Jalón al pecho' },
  muscleGroup: 'back',
  equipment: 'cable',
  measurement: 'weight_reps',
  isUnilateral: false,
  instructions: null,
  videoUrl: null,
  archivedAt: null,
};

function filled(overrides: Partial<ExerciseFormValues> = {}): ExerciseFormValues {
  return {
    ...emptyFormValues('Flexiones con mochila'),
    measurement: 'bodyweight_reps',
    ...overrides,
  };
}

describe('emptyFormValues', () => {
  it('pone el nombre escrito en el buscador, sin espacios de sobra y como mucho 80 caracteres', () => {
    expect(emptyFormValues('  sentadilla lateral ').name).toBe('sentadilla lateral');
    expect(emptyFormValues('x'.repeat(90)).name).toHaveLength(80);
  });
});

describe('readExerciseForm', () => {
  it('limpia los datos: sin grupo, sin material y los opcionales vacíos se guardan vacíos', () => {
    expect(readExerciseForm(filled({ instructions: '   ' }), null, 'es')).toEqual({
      ok: true,
      input: {
        name: 'Flexiones con mochila',
        measurement: 'bodyweight_reps',
        isUnilateral: false,
        muscleGroup: null,
        equipment: null,
        instructions: null,
        videoUrl: null,
      },
    });
  });

  it('exige el nombre y la forma de medir', () => {
    expect(readExerciseForm(emptyFormValues('  '), null, 'es')).toEqual({
      ok: false,
      errors: { name: 'nameRequired', measurement: 'measurementRequired' },
    });
  });

  it('pone los topes de la base de datos: 80, 2.000 y 500 caracteres', () => {
    const result = readExerciseForm(
      filled({
        name: 'x'.repeat(81),
        instructions: 'x'.repeat(2001),
        videoUrl: `https://${'x'.repeat(500)}`,
      }),
      null,
      'es',
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        name: 'nameTooLong',
        instructions: 'instructionsTooLong',
        videoUrl: 'videoUrlTooLong',
      },
    });
  });

  it.each(['http://youtu.be/abc', 'youtu.be/abc', 'https://youtu.be/a b', 'https://'])(
    'no acepta el enlace de vídeo %s (D-074)',
    (videoUrl) => {
      expect(readExerciseForm(filled({ videoUrl }), null, 'es')).toEqual({
        ok: false,
        errors: { videoUrl: 'videoUrlNotHttps' },
      });
    },
  );

  it('acepta un enlace https://', () => {
    const result = readExerciseForm(filled({ videoUrl: ' https://youtu.be/abc ' }), null, 'es');
    expect(result.ok && result.input.videoUrl).toBe('https://youtu.be/abc');
  });

  it('un ejercicio del catálogo con el nombre sin tocar sigue sin nombre propio (D-071)', () => {
    const values = {
      ...formValuesOf(LAT_PULLDOWN, 'Jalón al pecho'),
      equipment: 'machine' as const,
    };
    expect(readExerciseForm(values, LAT_PULLDOWN, 'es')).toMatchObject({
      ok: true,
      input: { name: null, equipment: 'machine' },
    });
  });

  it('si el coach le cambia el nombre, se guarda el suyo', () => {
    const values = { ...formValuesOf(LAT_PULLDOWN, 'Lat pulldown'), name: 'Jalón agarre amplio' };
    expect(readExerciseForm(values, LAT_PULLDOWN, 'en')).toMatchObject({
      ok: true,
      input: { name: 'Jalón agarre amplio' },
    });
  });

  it('uno que ya tiene nombre propio lo conserva aunque coincida con el del catálogo', () => {
    const renamed = { ...LAT_PULLDOWN, name: 'Lat pulldown' };
    expect(readExerciseForm(formValuesOf(renamed, 'Lat pulldown'), renamed, 'en')).toMatchObject({
      ok: true,
      input: { name: 'Lat pulldown' },
    });
  });
});

describe('formValuesOf', () => {
  it('rellena el formulario con los datos del ejercicio', () => {
    expect(
      formValuesOf(
        { ...LAT_PULLDOWN, muscleGroup: null, videoUrl: 'https://x.test' },
        'Lat pulldown',
      ),
    ).toEqual({
      name: 'Lat pulldown',
      measurement: 'weight_reps',
      isUnilateral: false,
      muscleGroup: 'none',
      equipment: 'cable',
      instructions: '',
      videoUrl: 'https://x.test',
    });
  });
});
