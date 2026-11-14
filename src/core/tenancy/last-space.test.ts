import { describe, expect, it } from 'vitest';

import { clearLastSpace, readLastSpace, rememberLastSpace } from './last-space';

describe('el último espacio (D-056 y D-066)', () => {
  it('se recuerda para ese usuario', () => {
    rememberLastSpace('user-a', 'tenant-1');

    expect(readLastSpace('user-a')).toBe('tenant-1');
  });

  it('otro usuario del mismo dispositivo no hereda el espacio', () => {
    rememberLastSpace('user-a', 'tenant-1');

    expect(readLastSpace('user-b')).toBeNull();
  });

  it('se olvida al borrarlo', () => {
    rememberLastSpace('user-a', 'tenant-1');
    clearLastSpace();

    expect(readLastSpace('user-a')).toBeNull();
  });

  it('un valor estropeado cuenta como ninguno', () => {
    localStorage.setItem('athlete-core.lastSpace', '{not json');
    expect(readLastSpace('user-a')).toBeNull();

    localStorage.setItem('athlete-core.lastSpace', JSON.stringify({ userId: 'user-a' }));
    expect(readLastSpace('user-a')).toBeNull();
  });
});
