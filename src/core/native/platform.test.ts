import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ native: false, allowWebWorkouts: false }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => state.native },
}));
vi.mock('../config', () => ({
  env: {
    get allowWebWorkouts() {
      return state.allowWebWorkouts;
    },
  },
}));

const { canLogWorkouts, isNativeApp } = await import('./platform');

describe('isNativeApp', () => {
  it('dice si estamos dentro de la app instalada', () => {
    state.native = true;
    expect(isNativeApp()).toBe(true);
    state.native = false;
    expect(isNativeApp()).toBe(false);
  });
});

describe('canLogWorkouts', () => {
  beforeEach(() => {
    state.native = false;
    state.allowWebWorkouts = false;
  });

  it('en la app instalada siempre se puede registrar un entreno', () => {
    state.native = true;
    expect(canLogWorkouts()).toBe(true);
  });

  it('en el navegador no se puede (la web publicada)', () => {
    expect(canLogWorkouts()).toBe(false);
  });

  it('en el navegador se puede si core/config lo permite (desarrollo y tests)', () => {
    state.allowWebWorkouts = true;
    expect(canLogWorkouts()).toBe(true);
  });
});
