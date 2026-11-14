import { describe, expect, it } from 'vitest';

import {
  formatInviteCode,
  isInviteCodeFormat,
  normalizeInviteCode,
  parseInviteCodeParam,
} from './invite-code';

describe('código de invitación (D-050)', () => {
  it('no importan las mayúsculas, los espacios ni los guiones', () => {
    expect(normalizeInviteCode(' k7m4-9xq2 ')).toBe('K7M49XQ2');
    expect(normalizeInviteCode('norte 001')).toBe('NORTE001');
  });

  it('reconoce la forma de un código', () => {
    expect(isInviteCodeFormat('K7M4 9XQ2')).toBe(true);
    expect(isInviteCodeFormat('IRONLAB1')).toBe(true);
    expect(isInviteCodeFormat('ABC')).toBe(false);
    expect(isInviteCodeFormat('ABCD!234')).toBe(false);
  });

  it('el código del enlace se valida antes de usarlo', () => {
    expect(parseInviteCodeParam('norte001')).toBe('NORTE001');
    expect(parseInviteCodeParam('<script>')).toBe('');
    expect(parseInviteCodeParam(null)).toBe('');
  });

  it('se muestra en dos grupos de cuatro', () => {
    expect(formatInviteCode('K7M49XQ2')).toBe('K7M4 9XQ2');
    expect(formatInviteCode('NORTE001')).toBe('NORT E001');
  });
});
