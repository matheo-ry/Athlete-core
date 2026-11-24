import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSupabaseClient } from '@/core/supabase';

import { fetchClientHistoryWorkouts, fetchCurrentClientProgramId } from './client-workouts-api';

vi.mock('@/core/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

describe('client-workouts-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchClientHistoryWorkouts', () => {
    it('returns parsed and sorted workouts', async () => {
      const mockRawData = [
        {
          id: 'w-1',
          tenant_id: 't-1',
          client_id: 'c-1',
          program_id: 'p-1',
          block_id: 'b-1',
          program_day_id: 'pd-1',
          day_number: 1,
          performed_on: '2026-11-20',
          started_at: '2026-11-20T10:00:00Z',
          closed_at: '2026-11-20T11:00:00Z',
          edited_at: null,
          close_reason: 'completed',
          last_changed_at: '2026-11-20T11:00:00Z',
          programs: { id: 'p-1', name: 'Rutina Alpha' },
          program_days: { id: 'pd-1', name: 'Día 1' },
          workout_exercises: [
            {
              id: 'we-2',
              workout_id: 'w-1',
              position: 2,
              exercise_id: 'e-2',
              replaces_exercise_id: null,
              superset_group: null,
              prescribed_sets: [],
              prescribed_rest_seconds: 60,
              coach_note: null,
              day_note: null,
              is_skipped: false,
              changed_at: '2026-11-20T10:40:00Z',
              workout_sets: [],
            },
            {
              id: 'we-1',
              workout_id: 'w-1',
              position: 1,
              exercise_id: 'e-1',
              replaces_exercise_id: null,
              superset_group: null,
              prescribed_sets: [],
              prescribed_rest_seconds: 90,
              coach_note: null,
              day_note: null,
              is_skipped: false,
              changed_at: '2026-11-20T10:10:00Z',
              workout_sets: [
                {
                  id: 'ws-2',
                  workout_exercise_id: 'we-1',
                  set_number: 2,
                  side: 'none',
                  weight_kg: '60',
                  reps: 8,
                  duration_seconds: null,
                  distance_meters: null,
                  intensity_type: 'rir',
                  intensity_value: '2',
                  is_done: true,
                  is_extra: false,
                  recorded_at: '2026-11-20T10:20:00Z',
                },
                {
                  id: 'ws-1',
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
                  recorded_at: '2026-11-20T10:15:00Z',
                },
              ],
            },
          ],
        },
      ];

      const orderMock = vi.fn().mockImplementation(function (this: unknown) {
        return {
          order: vi.fn().mockResolvedValue({ data: mockRawData, error: null }),
        };
      });

      const notMock = vi.fn().mockReturnValue({ order: orderMock });
      const eq2 = vi.fn().mockReturnValue({ not: notMock });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eq1 });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      vi.mocked(getSupabaseClient).mockReturnValue({
        from: fromMock,
      } as unknown as ReturnType<typeof getSupabaseClient>);

      const result = await fetchClientHistoryWorkouts('t-1', 'c-1');

      expect(result).toHaveLength(1);
      const w = result[0]!;
      expect(w.id).toBe('w-1');
      expect(w.programs?.name).toBe('Rutina Alpha');
      expect(w.program_days?.name).toBe('Día 1');

      // Exercises should be sorted by position (1, 2)
      expect(w.workout_exercises[0]?.position).toBe(1);
      expect(w.workout_exercises[1]?.position).toBe(2);

      // Sets should be sorted by set_number (1, 2) and weight parsed as number
      const sets = w.workout_exercises[0]!.workout_sets;
      expect(sets[0]?.set_number).toBe(1);
      expect(sets[0]?.weight_kg).toBe(50);
      expect(sets[1]?.set_number).toBe(2);
      expect(sets[1]?.weight_kg).toBe(60);
      expect(sets[1]?.intensity_value).toBe(2);
    });

    it('throws error when supabase query fails', async () => {
      const orderMock = vi.fn().mockImplementation(function (this: unknown) {
        return {
          order: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        };
      });

      const notMock = vi.fn().mockReturnValue({ order: orderMock });
      const eq2 = vi.fn().mockReturnValue({ not: notMock });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eq1 });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      vi.mocked(getSupabaseClient).mockReturnValue({
        from: fromMock,
      } as unknown as ReturnType<typeof getSupabaseClient>);

      await expect(fetchClientHistoryWorkouts('t-1', 'c-1')).rejects.toThrow(
        'Could not load client workouts: PGRST116',
      );
    });
  });

  describe('fetchCurrentClientProgramId', () => {
    it('returns program id when current active program exists', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: { id: 'prog-123' },
        error: null,
      });
      const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const isEndedNull = vi.fn().mockReturnValue({ order: orderMock });
      const isArchivedNull = vi.fn().mockReturnValue({ is: isEndedNull });
      const eqClient = vi.fn().mockReturnValue({ is: isArchivedNull });
      const eqTenant = vi.fn().mockReturnValue({ eq: eqClient });
      const selectMock = vi.fn().mockReturnValue({ eq: eqTenant });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      vi.mocked(getSupabaseClient).mockReturnValue({
        from: fromMock,
      } as unknown as ReturnType<typeof getSupabaseClient>);

      const result = await fetchCurrentClientProgramId('t-1', 'c-1');
      expect(result).toBe('prog-123');
    });

    it('returns null when no active program found', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
      const isEndedNull = vi.fn().mockReturnValue({ order: orderMock });
      const isArchivedNull = vi.fn().mockReturnValue({ is: isEndedNull });
      const eqClient = vi.fn().mockReturnValue({ is: isArchivedNull });
      const eqTenant = vi.fn().mockReturnValue({ eq: eqClient });
      const selectMock = vi.fn().mockReturnValue({ eq: eqTenant });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      vi.mocked(getSupabaseClient).mockReturnValue({
        from: fromMock,
      } as unknown as ReturnType<typeof getSupabaseClient>);

      const result = await fetchCurrentClientProgramId('t-1', 'c-1');
      expect(result).toBeNull();
    });
  });
});
