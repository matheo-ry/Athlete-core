import { describe, expect, it } from 'vitest';

import { isMiniAchievement } from './minilogros';

describe('isMiniAchievement (D-130)', () => {
  it('returns false when there is no previous set', () => {
    expect(isMiniAchievement({ weightKg: 80, reps: 10, isDone: true }, null)).toBe(false);
  });

  it('returns false when the current set is not done', () => {
    expect(
      isMiniAchievement({ weightKg: 80, reps: 12, isDone: false }, { weightKg: 80, reps: 10 }),
    ).toBe(false);
  });

  it('returns true when same weight but more reps (e.g. 80x12 -> 80x13)', () => {
    // Ejemplo exacto de D-130 y Criterio 1: Ana hizo 80x12 la vez anterior; hoy apunta 80x13
    expect(
      isMiniAchievement({ weightKg: 80, reps: 13, isDone: true }, { weightKg: 80, reps: 12 }),
    ).toBe(true);
  });

  it('returns true when more weight (e.g. 75x12 -> 80x9)', () => {
    // Ejemplo exacto de D-130: antes 75x12, hoy 80x9 (minilogro: más peso)
    expect(
      isMiniAchievement({ weightKg: 80, reps: 9, isDone: true }, { weightKg: 75, reps: 12 }),
    ).toBe(true);
  });

  it('returns false when same weight and same or fewer reps (e.g. 80x10 -> 80x10)', () => {
    // Ejemplo de D-130: antes 80x10, hoy 80x10 (nada)
    expect(
      isMiniAchievement({ weightKg: 80, reps: 10, isDone: true }, { weightKg: 80, reps: 10 }),
    ).toBe(false);

    expect(
      isMiniAchievement({ weightKg: 80, reps: 8, isDone: true }, { weightKg: 80, reps: 10 }),
    ).toBe(false);
  });

  it('returns false when less weight even with more reps', () => {
    expect(
      isMiniAchievement({ weightKg: 70, reps: 15, isDone: true }, { weightKg: 80, reps: 10 }),
    ).toBe(false);
  });

  it('handles time measurements (more seconds = minilogro)', () => {
    expect(
      isMiniAchievement(
        { weightKg: null, reps: null, durationSeconds: 65, isDone: true },
        { weightKg: null, reps: null, durationSeconds: 60 },
      ),
    ).toBe(true);

    expect(
      isMiniAchievement(
        { weightKg: null, reps: null, durationSeconds: 60, isDone: true },
        { weightKg: null, reps: null, durationSeconds: 60 },
      ),
    ).toBe(false);
  });

  it('handles distance measurements (more meters = minilogro)', () => {
    expect(
      isMiniAchievement(
        { weightKg: null, reps: null, distanceMeters: 500, isDone: true },
        { weightKg: null, reps: null, distanceMeters: 400 },
      ),
    ).toBe(true);

    expect(
      isMiniAchievement(
        { weightKg: null, reps: null, distanceMeters: 400, isDone: true },
        { weightKg: null, reps: null, distanceMeters: 400 },
      ),
    ).toBe(false);
  });
});
