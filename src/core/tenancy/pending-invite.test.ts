import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND } from '../branding/default-brand';
import { clearPendingInvite, readPendingInvite, rememberPendingInvite } from './pending-invite';

const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const INVITE = { code: 'NORTE001', name: 'Norte Strength', branding: DEFAULT_BRAND };

describe('código recordado (D-037)', () => {
  it('se recuerda en el dispositivo', () => {
    rememberPendingInvite(INVITE, NOW);
    expect(readPendingInvite(NOW + DAY)).toEqual(INVITE);
    clearPendingInvite();
    expect(readPendingInvite(NOW)).toBeNull();
  });

  it('caduca a los 7 días', () => {
    rememberPendingInvite(INVITE, NOW);
    localStorage.setItem(
      'athlete-core.pendingInvite',
      JSON.stringify({ ...INVITE, at: NOW - 8 * DAY }),
    );
    expect(readPendingInvite(NOW)).toBeNull();
  });

  it('un valor estropeado o un código raro no valen', () => {
    localStorage.setItem('athlete-core.pendingInvite', '{not json');
    expect(readPendingInvite(NOW)).toBeNull();
    localStorage.setItem(
      'athlete-core.pendingInvite',
      JSON.stringify({ ...INVITE, code: '<script>', at: NOW }),
    );
    expect(readPendingInvite(NOW)).toBeNull();
  });
});
