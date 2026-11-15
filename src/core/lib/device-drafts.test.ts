import { beforeEach, describe, expect, it } from 'vitest';

import { DEVICE_DRAFT_PREFIX, clearDeviceDrafts } from './device-drafts';

describe('los borradores del dispositivo (D-079)', () => {
  beforeEach(() => localStorage.clear());

  it('al cerrar sesión se borran todos los borradores, y nada más', () => {
    localStorage.setItem(`${DEVICE_DRAFT_PREFIX}program.a`, '{}');
    localStorage.setItem(`${DEVICE_DRAFT_PREFIX}program.b`, '{}');
    localStorage.setItem('athlete-core.lastSpace', '{}');

    clearDeviceDrafts();

    expect(localStorage.getItem(`${DEVICE_DRAFT_PREFIX}program.a`)).toBeNull();
    expect(localStorage.getItem(`${DEVICE_DRAFT_PREFIX}program.b`)).toBeNull();
    expect(localStorage.getItem('athlete-core.lastSpace')).toBe('{}');
  });

  it('si el navegador no deja leer, no falla', () => {
    const broken = {
      get length(): number {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    expect(() => clearDeviceDrafts(broken)).not.toThrow();
  });
});
