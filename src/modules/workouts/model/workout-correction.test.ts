import { describe, expect, it } from 'vitest';

import {
  SEVEN_DAYS_MS,
  buildCorrectionSyncPayload,
  canCorrectWorkout,
  isPreviousRoutine,
} from './workout-correction';
import type { ClientWorkoutRecord } from './workout-correction';

describe('workout-correction', () => {
  describe('canCorrectWorkout', () => {
    const baseClosedAt = '2026-11-20T10:00:00.000Z';
    const baseClosedMs = new Date(baseClosedAt).getTime();

    it('returns false when not on mobile', () => {
      expect(canCorrectWorkout({ closed_at: baseClosedAt }, false, baseClosedMs + 1000)).toBe(
        false,
      );
    });

    it('returns false when workout is not closed', () => {
      expect(canCorrectWorkout({ closed_at: null }, true, baseClosedMs + 1000)).toBe(false);
    });

    it('returns true when on mobile and within 7 days', () => {
      // 1 day after
      expect(
        canCorrectWorkout({ closed_at: baseClosedAt }, true, baseClosedMs + 24 * 60 * 60 * 1000),
      ).toBe(true);

      // Exactly 7 days
      expect(
        canCorrectWorkout({ closed_at: baseClosedAt }, true, baseClosedMs + SEVEN_DAYS_MS),
      ).toBe(true);
    });

    it('returns false when more than 7 days have passed', () => {
      // 7 days and 1 second
      expect(
        canCorrectWorkout({ closed_at: baseClosedAt }, true, baseClosedMs + SEVEN_DAYS_MS + 1000),
      ).toBe(false);

      // 14 days
      expect(
        canCorrectWorkout({ closed_at: baseClosedAt }, true, baseClosedMs + 2 * SEVEN_DAYS_MS),
      ).toBe(false);
    });

    it('returns false if now is before closed_at (clock skew in the past)', () => {
      expect(canCorrectWorkout({ closed_at: baseClosedAt }, true, baseClosedMs - 1000)).toBe(false);
    });
  });

  describe('isPreviousRoutine', () => {
    it('returns true when program IDs differ', () => {
      expect(isPreviousRoutine('prog-1', 'prog-2')).toBe(true);
    });

    it('returns false when program IDs match', () => {
      expect(isPreviousRoutine('prog-1', 'prog-1')).toBe(false);
    });

    it('returns false if either program ID is null', () => {
      expect(isPreviousRoutine(null, 'prog-1')).toBe(false);
      expect(isPreviousRoutine('prog-1', null)).toBe(false);
    });
  });

  describe('buildCorrectionSyncPayload', () => {
    it('creates formatted payload with updated timestamps', () => {
      const workout: ClientWorkoutRecord = {
        id: 'w-1',
        tenant_id: 't-1',
        client_id: 'c-1',
        program_id: 'p-1',
        block_id: 'b-1',
        program_day_id: 'pd-1',
        day_number: 1,
        performed_on: '2026-11-23',
        started_at: '2026-11-23T10:00:00.000Z',
        closed_at: '2026-11-23T11:00:00.000Z',
        edited_at: null,
        close_reason: 'completed',
        last_changed_at: '2026-11-23T11:00:00.000Z',
        workout_exercises: [
          {
            id: 'we-1',
            position: 1,
            exercise_id: 'e-1',
            replaces_exercise_id: null,
            superset_group: null,
            prescribed_sets: [],
            prescribed_rest_seconds: 90,
            coach_note: 'Note',
            day_note: 'Good set',
            is_skipped: false,
            changed_at: '2026-11-23T10:30:00.000Z',
            workout_sets: [
              {
                id: 's-1',
                workout_exercise_id: 'we-1',
                set_number: 1,
                side: 'none',
                weight_kg: 50,
                reps: 10,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                is_extra: false,
                recorded_at: '2026-11-23T10:15:00.000Z',
              },
            ],
          },
        ],
      };

      const now = '2026-11-24T12:00:00.000Z';
      const payload = buildCorrectionSyncPayload(workout, 'device-123', now);

      expect(payload.id).toBe('w-1');
      expect(payload.last_changed_at).toBe(now);
      expect(payload.device_id).toBe('device-123');
      expect(payload.close_reason).toBe('completed');

      const exercises = payload.exercises as Array<Record<string, unknown>>;
      expect(exercises).toHaveLength(1);
      expect(exercises[0]?.changed_at).toBe(now);
      expect(exercises[0]?.day_note).toBe('Good set');

      const sets = exercises[0]?.sets as Array<Record<string, unknown>>;
      expect(sets).toHaveLength(1);
      expect(sets[0]?.weight_kg).toBe(50);
      expect(sets[0]?.reps).toBe(10);
      expect(sets[0]?.recorded_at).toBe(now);
    });
  });
});
