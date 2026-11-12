import { describe, expect, it } from 'vitest';

import { parseJoinCode } from './join-code';

describe('parseJoinCode', () => {
  it('acepta letras y números y los pasa a mayúsculas', () => {
    expect(parseJoinCode('abc123')).toBe('ABC123');
  });

  it('quita los espacios de los extremos', () => {
    expect(parseJoinCode('  IRON42 ')).toBe('IRON42');
  });

  it.each([null, '', 'abc', 'has space', '<script>', 'A'.repeat(17)])(
    'devuelve vacío para %j',
    (value) => {
      expect(parseJoinCode(value)).toBe('');
    },
  );
});
