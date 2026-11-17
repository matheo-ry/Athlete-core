import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAppAs } from '@/test/render-app';

import type { RawWorkout } from '../model/exercise-history';

const api = vi.hoisted(() => ({
  fetchClientWorkouts: vi.fn<(tenantId: string, clientId: string) => Promise<RawWorkout[]>>(),
  fetchCurrentClientProgramId:
    vi.fn<(tenantId: string, clientId: string) => Promise<string | null>>(),
}));
vi.mock('../api/progress-api', () => api);

// El peso y las medidas los carga el módulo workouts (D-127).
const healthApi = vi.hoisted(() => ({ fetchClientHealthData: vi.fn() }));
vi.mock('@/modules/workouts/api/workouts-coach-api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...healthApi,
}));

const exercisesApi = vi.hoisted(() => ({
  fetchExercises: vi.fn(),
}));
vi.mock('@/modules/exercises/api/exercises-api', () => exercisesApi);

describe('ClientProgressPage (D-127, D-129, PR 3.16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthApi.fetchClientHealthData.mockResolvedValue({
      hasConsent: false,
      weights: [],
      measurements: [],
    });
    exercisesApi.fetchExercises.mockResolvedValue([
      {
        id: 'ex-flexiones',
        name: 'Flexiones con mochila',
        libraryKey: null,
        libraryName: null,
        muscleGroup: 'chest',
        equipment: 'bodyweight',
        measurement: 'weight_reps',
        isUnilateral: false,
        instructions: null,
        videoUrl: null,
        archivedAt: null,
      },
    ]);
  });

  it('muestra estado vacío si no hay entrenos ni salud', async () => {
    api.fetchClientWorkouts.mockResolvedValue([]);
    api.fetchCurrentClientProgramId.mockResolvedValue('prog-1');

    await renderAppAs('client@example.test', '/client/progress');

    expect(await screen.findByText('No workouts recorded yet')).toBeVisible();
  });

  it('criterio 1 y 4: Ana ve la gráfica de RM de un ejercicio con 3 entrenos; tocando un punto, su valor, fecha y entreno elegido', async () => {
    const workouts: RawWorkout[] = [
      {
        id: 'w-1',
        performed_on: '2026-10-06',
        started_at: '2026-10-06T18:00:00Z',
        closed_at: '2026-10-06T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-1',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: 'Primera sesión suave',
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-1',
                set_number: 1,
                side: 'none',
                weight_kg: 45,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-06T18:03:00Z',
              },
            ],
          },
        ],
      },
      {
        id: 'w-2',
        performed_on: '2026-10-13',
        started_at: '2026-10-13T18:00:00Z',
        closed_at: '2026-10-13T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-2',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: 'Mochila cargada',
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-2',
                set_number: 1,
                side: 'none',
                weight_kg: 47.5,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-13T18:03:00Z',
              },
            ],
          },
        ],
      },
      {
        id: 'w-3',
        performed_on: '2026-10-20',
        started_at: '2026-10-20T18:00:00Z',
        closed_at: '2026-10-20T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-3',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: 'Sensación muy buena',
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-3',
                set_number: 1,
                side: 'none',
                weight_kg: 50,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-20T18:03:00Z',
              },
            ],
          },
        ],
      },
    ];

    api.fetchClientWorkouts.mockResolvedValue(workouts);
    api.fetchCurrentClientProgramId.mockResolvedValue('prog-1');

    await renderAppAs('client@example.test', '/client/progress');

    expect(await screen.findByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
    expect(await screen.findByRole('heading', { level: 2, name: 'Casa + Gym' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Flexiones con mochila' })).toBeVisible();

    // Gráfica presente
    const chart = screen.getByTestId('line-chart-container');
    expect(chart).toBeVisible();

    // 3 puntos en la gráfica
    expect(screen.getByTestId('chart-point-0')).toBeInTheDocument();
    expect(screen.getByTestId('chart-point-1')).toBeInTheDocument();
    expect(screen.getByTestId('chart-point-2')).toBeInTheDocument();

    // Por defecto, seleccionado el último entreno (w-3)
    const detail = screen.getByTestId('selected-workout-detail');
    expect(detail).toHaveTextContent('DAY 3');
    expect(detail).toHaveTextContent('50×8(1)');
    expect(screen.getByTestId('selected-session-note')).toHaveTextContent('Sensación muy buena');

    // Tocar el primer punto (chart-point-0)
    fireEvent.click(screen.getByTestId('chart-point-0'));

    // Actualiza el detalle inferior al DAY 1 con sus series y nota
    expect(detail).toHaveTextContent('DAY 1');
    expect(detail).toHaveTextContent('45×8(1)');
    expect(screen.getByTestId('selected-session-note')).toHaveTextContent('Primera sesión suave');
  });

  it('criterio 2: el % de progreso cambia al pasar de "4 semanas" a "Todo"', async () => {
    // Calculamos fechas relativas a hoy para que el filtro de 4 semanas (28 días) actúe con certeza
    const today = new Date();
    const d3 = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // hace 2 días
    const d2 = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // hace 14 días
    const d1 = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // hace 60 días (fuera de 4 semanas)

    const workouts: RawWorkout[] = [
      {
        id: 'w-old',
        performed_on: d1,
        started_at: `${d1}T18:00:00Z`,
        closed_at: `${d1}T19:00:00Z`,
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-old',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-old',
                set_number: 1,
                side: 'none',
                weight_kg: 50,
                reps: 6,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 0,
                is_done: true,
                recorded_at: `${d1}T18:03:00Z`,
              },
            ],
          },
        ],
      },
      {
        id: 'w-mid',
        performed_on: d2,
        started_at: `${d2}T18:00:00Z`,
        closed_at: `${d2}T19:00:00Z`,
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-mid',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-mid',
                set_number: 1,
                side: 'none',
                weight_kg: 55,
                reps: 6,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 0,
                is_done: true,
                recorded_at: `${d2}T18:03:00Z`,
              },
            ],
          },
        ],
      },
      {
        id: 'w-new',
        performed_on: d3,
        started_at: `${d3}T18:00:00Z`,
        closed_at: `${d3}T19:00:00Z`,
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-new',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-new',
                set_number: 1,
                side: 'none',
                weight_kg: 60,
                reps: 6,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 0,
                is_done: true,
                recorded_at: `${d3}T18:03:00Z`,
              },
            ],
          },
        ],
      },
    ];

    api.fetchClientWorkouts.mockResolvedValue(workouts);
    api.fetchCurrentClientProgramId.mockResolvedValue('prog-1');

    const { user } = await renderAppAs('client@example.test', '/client/progress');

    // En "All time", compara 50 kg con 60 kg (+20%)
    const badge = await screen.findByTestId('rm-progress-badge');
    expect(badge).toHaveTextContent('+20 %');

    // Cambiar a "4 weeks" (solo entran w-mid y w-new: 55 kg a 60 kg -> +9.1%)
    const fourWeeksBtn = screen.getByTestId('period-btn-4w');
    await user.click(fourWeeksBtn);

    expect(badge).toHaveTextContent('+9.1 %');

    // Volver a "All time"
    const allBtn = screen.getByTestId('period-btn-all');
    await user.click(allBtn);

    expect(badge).toHaveTextContent('+20 %');
  });

  it('criterio 3: Ana ve la gráfica de su peso corporal', async () => {
    api.fetchClientWorkouts.mockResolvedValue([]);
    api.fetchCurrentClientProgramId.mockResolvedValue(null);
    healthApi.fetchClientHealthData.mockResolvedValue({
      hasConsent: true,
      weights: [
        { id: 'bw-1', measured_on: '2026-10-01', weight_kg: 62.0 },
        { id: 'bw-2', measured_on: '2026-10-08', weight_kg: 62.5 },
        { id: 'bw-3', measured_on: '2026-10-15', weight_kg: 63.0 },
      ],
      measurements: [],
    });

    const { user } = await renderAppAs('client@example.test', '/client/progress');

    // Cambiar a la pestaña "Weight & measurements"
    const healthTab = await screen.findByTestId('tab-health');
    await user.click(healthTab);

    // Debe verse la tarjeta de salud y la gráfica de peso
    expect(await screen.findByTestId('health-progress-card')).toBeVisible();
    expect(screen.getByTestId('health-metric-weight')).toBeVisible();

    // Comprobar puntos en la gráfica de peso
    expect(screen.getByTestId('chart-point-0')).toBeInTheDocument();
    expect(screen.getByTestId('chart-point-1')).toBeInTheDocument();
    expect(screen.getByTestId('chart-point-2')).toBeInTheDocument();

    // Muestra último peso y cambio
    expect(screen.getByTestId('health-diff-stat')).toHaveTextContent('+1 kg');
  });
  it('fallo de Gemini: con medidas y sin peso, se ve la gráfica de la primera medida', async () => {
    api.fetchClientWorkouts.mockResolvedValue([]);
    api.fetchCurrentClientProgramId.mockResolvedValue(null);
    healthApi.fetchClientHealthData.mockResolvedValue({
      hasConsent: true,
      weights: [],
      measurements: [
        { id: 'm-1', measured_on: '2026-10-01', kind: 'waist', side: null, value_cm: 72 },
        { id: 'm-2', measured_on: '2026-10-15', kind: 'waist', side: null, value_cm: 70.5 },
      ],
    });

    const { user } = await renderAppAs('client@example.test', '/client/progress');
    await user.click(await screen.findByTestId('tab-health'));

    expect(await screen.findByTestId('health-metric-waist')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByTestId('health-metric-weight')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chart-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('chart-point-1')).toBeInTheDocument();
    expect(screen.getByTestId('health-diff-stat')).toHaveTextContent('-1.5 cm');
  });

  it('fallo de Gemini: si falla la carga de salud, los ejercicios se siguen viendo', async () => {
    api.fetchClientWorkouts.mockResolvedValue([]);
    api.fetchCurrentClientProgramId.mockResolvedValue(null);
    healthApi.fetchClientHealthData.mockRejectedValue(new Error('network'));

    const { user } = await renderAppAs('client@example.test', '/client/progress');

    // La pestaña de ejercicios no depende de la salud: sale su estado vacío, no un error.
    expect(await screen.findByText('No workouts recorded yet')).toBeVisible();
    expect(healthApi.fetchClientHealthData).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('tab-health'));
    expect(await screen.findByText('Something went wrong')).toBeVisible();
  });
});
