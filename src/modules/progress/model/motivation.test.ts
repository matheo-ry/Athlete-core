import { describe, expect, it } from 'vitest';

import {
  addDaysToDateStr,
  calculateLevel,
  calculateMotivation,
  calculateStreakAndTracker,
  getMondayOfIsoWeek,
} from './motivation';
import type { RawWorkout } from './exercise-history';

function mockWorkout(
  id: string,
  performedOn: string,
  startedAt = `${performedOn}T10:00:00Z`,
  closedAt = `${performedOn}T10:45:00Z`,
  exerciseSets: { weightKg: number | null; reps: number | null; isDone?: boolean }[] = [
    { weightKg: 80, reps: 10, isDone: true },
  ],
): RawWorkout {
  return {
    id,
    performed_on: performedOn,
    started_at: startedAt,
    closed_at: closedAt,
    day_number: 1,
    program_id: 'prog-1',
    programs: { id: 'prog-1', name: 'Fuerza' },
    workout_exercises: [
      {
        id: `we-${id}`,
        exercise_id: 'ex-bench',
        replaces_exercise_id: null,
        day_note: null,
        is_skipped: false,
        position: 1,
        workout_sets: exerciseSets.map((s, idx) => ({
          id: `ws-${id}-${String(idx)}`,
          set_number: idx + 1,
          side: 'none',
          weight_kg: s.weightKg,
          reps: s.reps,
          duration_seconds: null,
          distance_meters: null,
          intensity_type: null,
          intensity_value: null,
          is_done: s.isDone ?? true,
          recorded_at: startedAt,
        })),
      },
    ],
  };
}

describe('motivation model (PR 3.17, D-130)', () => {
  describe('date helpers', () => {
    it('finds Monday of ISO week correctly', () => {
      // 2026-11-23 es lunes
      expect(getMondayOfIsoWeek('2026-11-23')).toBe('2026-11-23');
      // 2026-11-24 es martes -> lunes 23
      expect(getMondayOfIsoWeek('2026-11-24')).toBe('2026-11-23');
      // 2026-11-29 es domingo -> lunes 23
      expect(getMondayOfIsoWeek('2026-11-29')).toBe('2026-11-23');
      // 2026-11-30 es lunes -> lunes 30
      expect(getMondayOfIsoWeek('2026-11-30')).toBe('2026-11-30');
    });

    it('adds and subtracts days correctly', () => {
      expect(addDaysToDateStr('2026-11-23', 1)).toBe('2026-11-24');
      expect(addDaysToDateStr('2026-11-23', 6)).toBe('2026-11-29');
      expect(addDaysToDateStr('2026-11-23', -7)).toBe('2026-11-16');
    });
  });

  describe('calculateLevel (Levels 1-7)', () => {
    it('calculates levels correctly according to workout count', () => {
      // 1 Novato (0)
      const l0 = calculateLevel(0);
      expect(l0.level).toBe(1);
      expect(l0.key).toBe('novice');
      expect(l0.nextLevelWorkouts).toBe(5);
      expect(l0.progress).toBe(0);

      const l4 = calculateLevel(4);
      expect(l4.level).toBe(1);
      expect(l4.progress).toBe(0.8);

      // 2 Constante (5)
      const l5 = calculateLevel(5);
      expect(l5.level).toBe(2);
      expect(l5.key).toBe('consistent');
      expect(l5.nextLevelWorkouts).toBe(10);
      expect(l5.progress).toBe(0);

      // 3 Comprometido (10)
      const l10 = calculateLevel(10);
      expect(l10.level).toBe(3);
      expect(l10.key).toBe('committed');

      // 4 Disciplinado (25)
      const l25 = calculateLevel(25);
      expect(l25.level).toBe(4);
      expect(l25.key).toBe('disciplined');

      // 5 Fuerte (50)
      const l50 = calculateLevel(50);
      expect(l50.level).toBe(5);
      expect(l50.key).toBe('strong');

      // 6 Imparable (100)
      const l100 = calculateLevel(100);
      expect(l100.level).toBe(6);
      expect(l100.key).toBe('unstoppable');

      // 7 Leyenda (200)
      const l200 = calculateLevel(200);
      expect(l200.level).toBe(7);
      expect(l200.key).toBe('legend');
      expect(l200.nextLevelWorkouts).toBeNull();
      expect(l200.progress).toBe(1);

      const l250 = calculateLevel(250);
      expect(l250.level).toBe(7);
      expect(l250.progress).toBe(1);
    });
  });

  describe('calculateStreakAndTracker', () => {
    it('returns empty tracker when no workouts', () => {
      const res = calculateStreakAndTracker([], 4, '2026-11-24');
      expect(res.currentStreak).toBe(0);
      expect(res.completedWeeksCount).toBe(0);
      expect(res.weekTracker.completedDays).toBe(0);
      expect(res.weekTracker.isComplete).toBe(false);
      expect(res.weekTracker.days).toHaveLength(7);
    });

    it('marks current week days correctly and does not break streak while in progress', () => {
      // Semana anterior: 2026-11-16 a 2026-11-22 (4 entrenos -> completa)
      // Semana actual: 2026-11-23 a 2026-11-29 (hoy es martes 24; 1 entreno el lunes 23)
      const workouts = [
        mockWorkout('w1', '2026-11-16'),
        mockWorkout('w2', '2026-11-17'),
        mockWorkout('w3', '2026-11-19'),
        mockWorkout('w4', '2026-11-20'),
        mockWorkout('w5', '2026-11-23'),
      ];

      const res = calculateStreakAndTracker(workouts, 4, '2026-11-24');
      // Semana anterior completa (1 semana)
      expect(res.completedWeeksCount).toBe(1);
      // Racha actual se mantiene en 1 porque la anterior estuvo completa y la actual está en curso
      expect(res.currentStreak).toBe(1);
      // En la semana actual se hizo 1 día
      expect(res.weekTracker.completedDays).toBe(1);
      expect(res.weekTracker.isComplete).toBe(false);
      // El lunes 23 está hecho
      expect(res.weekTracker.days[0]?.isDone).toBe(true);
      // El martes 24 no está hecho pero es hoy
      expect(res.weekTracker.days[1]?.isDone).toBe(false);
      expect(res.weekTracker.days[1]?.isToday).toBe(true);
    });

    it('increments streak when current week reaches target days (AC2)', () => {
      // Semana actual completa: 4 entrenos
      const workouts = [
        mockWorkout('w1', '2026-11-23'),
        mockWorkout('w2', '2026-11-24'),
        mockWorkout('w3', '2026-11-25'),
        mockWorkout('w4', '2026-11-26'),
      ];

      const res = calculateStreakAndTracker(workouts, 4, '2026-11-26');
      expect(res.completedWeeksCount).toBe(1);
      expect(res.currentStreak).toBe(1);
      expect(res.weekTracker.completedDays).toBe(4);
      expect(res.weekTracker.isComplete).toBe(true);
    });

    it('chains consecutive weeks into streak', () => {
      // 3 semanas consecutivas completas
      const workouts = [
        // Sem 1 (nov 2)
        mockWorkout('w1', '2026-11-02'),
        mockWorkout('w2', '2026-11-03'),
        mockWorkout('w3', '2026-11-04'),
        mockWorkout('w4', '2026-11-05'),
        // Sem 2 (nov 9)
        mockWorkout('w5', '2026-11-09'),
        mockWorkout('w6', '2026-11-10'),
        mockWorkout('w7', '2026-11-11'),
        mockWorkout('w8', '2026-11-12'),
        // Sem 3 (nov 16)
        mockWorkout('w9', '2026-11-16'),
        mockWorkout('w10', '2026-11-17'),
        mockWorkout('w11', '2026-11-18'),
        mockWorkout('w12', '2026-11-19'),
      ];

      const res = calculateStreakAndTracker(workouts, 4, '2026-11-24');
      expect(res.completedWeeksCount).toBe(3);
      expect(res.currentStreak).toBe(3);
      expect(res.maxStreak).toBe(3);
    });
  });

  describe('calculateMotivation overall & 18 achievements', () => {
    it('satisfies AC3: after 1 workout, level 1 and "first_workout" unlocked', () => {
      const workouts = [mockWorkout('w1', '2026-11-24')];
      const state = calculateMotivation({ rawWorkouts: workouts, now: '2026-11-24' });

      expect(state.totalWorkouts).toBe(1);
      expect(state.level.level).toBe(1);

      const firstWorkoutAch = state.achievements.find((a) => a.id === 'first_workout');
      expect(firstWorkoutAch?.isUnlocked).toBe(true);
      expect(firstWorkoutAch?.current).toBe(1);

      const firstWeekAch = state.achievements.find((a) => a.id === 'first_full_week');
      expect(firstWeekAch?.isUnlocked).toBe(false);
    });

    it('satisfies AC2: 4 days in week unlocks "first_full_week" and streak is 1', () => {
      const workouts = [
        mockWorkout('w1', '2026-11-23'),
        mockWorkout('w2', '2026-11-24'),
        mockWorkout('w3', '2026-11-25'),
        mockWorkout('w4', '2026-11-26'),
      ];
      const state = calculateMotivation({ rawWorkouts: workouts, now: '2026-11-26' });

      expect(state.currentStreak).toBe(1);
      const firstWeekAch = state.achievements.find((a) => a.id === 'first_full_week');
      expect(firstWeekAch?.isUnlocked).toBe(true);
    });

    it('unlocks body weight achievement when bodyWeightsCount >= 1', () => {
      const state = calculateMotivation({ rawWorkouts: [], bodyWeightsCount: 1 });
      const ach = state.achievements.find((a) => a.id === 'first_body_weight');
      expect(ach?.isUnlocked).toBe(true);
    });

    it('unlocks workout over 60 min achievement', () => {
      const w = mockWorkout('w1', '2026-11-24', '2026-11-24T10:00:00Z', '2026-11-24T11:15:00Z');
      const state = calculateMotivation({ rawWorkouts: [w] });
      const ach = state.achievements.find((a) => a.id === 'workout_over_60_min');
      expect(ach?.isUnlocked).toBe(true);
    });

    it('tracks minilogros and records across workout history', () => {
      // Sesión 1: 80x12
      const w1 = mockWorkout('w1', '2026-11-10', '2026-11-10T10:00:00Z', '2026-11-10T10:45:00Z', [
        { weightKg: 80, reps: 12, isDone: true },
      ]);
      // Sesión 2: 80x13 (minilogro y récord de repes/RM)
      const w2 = mockWorkout('w2', '2026-11-17', '2026-11-17T10:00:00Z', '2026-11-17T10:45:00Z', [
        { weightKg: 80, reps: 13, isDone: true },
      ]);

      const state = calculateMotivation({ rawWorkouts: [w1, w2] });
      expect(state.recordsCount).toBeGreaterThanOrEqual(1);
      expect(state.minilogrosCount).toBe(1);

      const firstRecord = state.achievements.find((a) => a.id === 'first_record');
      expect(firstRecord?.isUnlocked).toBe(true);

      const firstMini = state.achievements.find((a) => a.id === 'first_minilogro');
      expect(firstMini?.isUnlocked).toBe(true);
    });
  });
});
