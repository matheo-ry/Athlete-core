import { describe, expect, it } from 'vitest';

import { copyInput, isModified, restoredInput } from './exercise-actions';
import type { Exercise } from './exercise-schema';

const ORIGINAL = {
  measurement: 'weight_reps',
  isUnilateral: false,
  muscleGroup: 'back',
  equipment: 'cable',
} as const;

const LAT_PULLDOWN: Exercise = {
  id: '00000000-0000-4000-8000-000000000001',
  name: null,
  libraryKey: 'lat_pulldown',
  libraryName: { en: 'Lat pulldown', es: 'Jalón al pecho' },
  ...ORIGINAL,
  instructions: null,
  videoUrl: null,
  archivedAt: null,
  original: ORIGINAL,
};

describe('isModified', () => {
  it('uno del catálogo sin tocar no ha cambiado', () => {
    expect(isModified(LAT_PULLDOWN)).toBe(false);
  });

  it.each<Partial<Exercise>>([
    { name: 'Jalón agarre amplio' },
    { measurement: 'bodyweight_reps' },
    { isUnilateral: true },
    { muscleGroup: null },
    { equipment: 'machine' },
    { instructions: 'Pecho arriba.' },
    { videoUrl: 'https://youtu.be/abc' },
  ])('cualquier cambio cuenta: %o', (change) => {
    expect(isModified({ ...LAT_PULLDOWN, ...change })).toBe(true);
  });

  it('uno propio nunca tiene "Restaurar original"', () => {
    expect(isModified({ ...LAT_PULLDOWN, libraryKey: null, name: 'Remo', original: null })).toBe(
      false,
    );
  });
});

describe('restoredInput', () => {
  it('deja el nombre vacío y los datos del catálogo, sin instrucciones ni vídeo', () => {
    const changed: Exercise = {
      ...LAT_PULLDOWN,
      name: 'Jalón agarre amplio',
      equipment: 'machine',
      instructions: 'Pecho arriba.',
      videoUrl: 'https://youtu.be/abc',
    };
    expect(restoredInput(changed)).toEqual({
      name: null,
      ...ORIGINAL,
      instructions: null,
      videoUrl: null,
    });
  });

  it('uno propio no tiene original', () => {
    expect(restoredInput({ ...LAT_PULLDOWN, original: null })).toBeNull();
  });
});

describe('copyInput', () => {
  it('copia todos los datos con el nombre nuevo', () => {
    const withVideo = { ...LAT_PULLDOWN, isUnilateral: true, videoUrl: 'https://youtu.be/abc' };
    expect(copyInput(withVideo, 'Lat pulldown (copy)')).toEqual({
      name: 'Lat pulldown (copy)',
      ...ORIGINAL,
      isUnilateral: true,
      instructions: null,
      videoUrl: 'https://youtu.be/abc',
    });
  });

  it('el nombre no pasa de 80 caracteres', () => {
    expect(copyInput(LAT_PULLDOWN, 'x'.repeat(90)).name).toHaveLength(80);
  });
});
