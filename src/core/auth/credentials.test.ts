import { describe, expect, it } from 'vitest';

import { checkEmail, checkNewPassword, isCompleteCode, normalizeCode } from './credentials';

describe('checkEmail', () => {
  it('acepta un email y lo deja limpio', () => {
    expect(checkEmail('  Ana@Example.com ')).toEqual({ ok: true, email: 'ana@example.com' });
  });

  it('distingue un email vacío de uno mal escrito', () => {
    expect(checkEmail('   ')).toEqual({ ok: false, error: 'required' });
    expect(checkEmail('ana@')).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('checkNewPassword (D-041)', () => {
  it('pide 8 caracteres como mínimo, sin exigir símbolos ni mayúsculas', () => {
    expect(checkNewPassword('1234567')).toBe('too_short');
    expect(checkNewPassword('abcdefgh')).toBeNull();
  });

  it('no admite más de 72 caracteres', () => {
    expect(checkNewPassword('a'.repeat(72))).toBeNull();
    expect(checkNewPassword('a'.repeat(73))).toBe('too_long');
  });
});

describe('normalizeCode', () => {
  it('deja solo las cifras, aunque se pegue con espacios o guiones', () => {
    expect(normalizeCode(' 123 456 ')).toBe('123456');
    expect(normalizeCode('123-456')).toBe('123456');
  });

  it('corta a 6 cifras', () => {
    expect(normalizeCode('1234567890')).toBe('123456');
  });

  it('sabe si el código está completo', () => {
    expect(isCompleteCode('12345')).toBe(false);
    expect(isCompleteCode('123 456')).toBe(true);
  });
});
