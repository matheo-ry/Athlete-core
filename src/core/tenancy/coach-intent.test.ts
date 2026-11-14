import { describe, expect, it } from 'vitest';

import { clearCoachIntent, hasCoachIntent, rememberCoachIntent } from './coach-intent';

const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

describe('intención de crear un negocio (D-037)', () => {
  it('se recuerda y se olvida', () => {
    rememberCoachIntent(NOW);
    expect(hasCoachIntent(NOW + DAY)).toBe(true);
    clearCoachIntent();
    expect(hasCoachIntent(NOW)).toBe(false);
  });

  it('caduca a los 7 días', () => {
    rememberCoachIntent(NOW);
    expect(hasCoachIntent(NOW + 8 * DAY)).toBe(false);
  });
});
