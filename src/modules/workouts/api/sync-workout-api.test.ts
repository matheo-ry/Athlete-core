import { describe, expect, it } from 'vitest';

import { discardPayload, uploadResultFor } from './sync-workout-api';

describe('uploadResultFor', () => {
  it('sin error, está subido', () => {
    expect(uploadResultFor(null)).toBe('done');
  });

  it('si el coach lo dio de baja, no se reintenta y se avisa (D-118)', () => {
    expect(uploadResultFor({ code: 'P0001', message: 'not_allowed' })).toBe('no_access');
  });

  it('una regla o un dato que la base de datos no acepta no se reintenta', () => {
    expect(uploadResultFor({ code: 'P0001', message: 'workout_locked' })).toBe('invalid');
    expect(uploadResultFor({ code: '22P02', message: 'invalid input syntax' })).toBe('invalid');
    // Un identificador de serie repetido: antes habría atascado la cola.
    expect(uploadResultFor({ code: '23505', message: 'duplicate key' })).toBe('invalid');
  });

  it('sin conexión o con el servidor caído, se reintenta', () => {
    expect(uploadResultFor({ code: '', message: 'TypeError: Failed to fetch' })).toBe('retry');
    expect(uploadResultFor({ code: 'PGRST301', message: 'JWT expired' })).toBe('retry');
    expect(uploadResultFor({ code: '503', message: 'Service Unavailable' })).toBe('retry');
  });
});

describe('discardPayload', () => {
  it('va con el mismo identificador del entreno, para sustituir su subida pendiente', () => {
    expect(discardPayload('workout-1')).toEqual({ id: 'workout-1', discard: true });
  });
});
