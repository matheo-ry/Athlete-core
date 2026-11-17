import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderAppAs } from '@/test/render-app';

import type { ClientProgram } from '../model/assignments';
import type { ClientWorkoutAlerts } from '../model/coach-alerts';

const assignmentsApi = vi.hoisted(() => ({
  fetchClientPrograms: vi.fn<() => Promise<ClientProgram[]>>(),
  fetchProgramsOfClient: vi.fn(),
  assignProgram: vi.fn(),
}));
vi.mock('../api/assignments-api', () => assignmentsApi);

const workoutAlerts = vi.hoisted(() => ({
  useWorkoutAlerts: vi.fn(),
}));
vi.mock('../api/useWorkoutAlerts', () => workoutAlerts);

async function anaUserId(): Promise<string> {
  const members = await createFakeTenancySource().listMembers(TEST_TENANTS.iron.id);
  return members.find((member) => member.displayName === 'Ana Cliente')?.userId ?? '';
}

function activeProgramRow(clientId: string): ClientProgram {
  return {
    id: 'prog-1',
    name: 'Fuerza base',
    clientId,
    startsOn: '2026-11-01',
    endedAt: null,
    mode: 'calendar',
    startBlockId: null,
    blocks: [{ id: 'b1', cycleDays: 7, laps: 4 }],
  };
}

describe('módulo programs: tarjeta de avisos del coach (PR 2.18, PR 3.14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra aviso de cliente sin entrenar desde hace 7 días', async () => {
    const anaId = await anaUserId();
    assignmentsApi.fetchClientPrograms.mockResolvedValue([activeProgramRow(anaId)]);

    const alertsMap = new Map<string, ClientWorkoutAlerts>();
    alertsMap.set(anaId, {
      daysSinceLastWorkout: 7,
      exerciseReplacement: null,
    });
    workoutAlerts.useWorkoutAlerts.mockReturnValue({ isSuccess: true, data: alertsMap });

    await renderAppAs('coach@example.test', '/coach');

    expect(await screen.findByRole('heading', { name: 'Programs to look at' })).toBeVisible();
    expect(screen.getByText('Ana Cliente')).toBeVisible();
    expect(screen.getByText('Has not trained for 7 days')).toBeVisible();

    const link = screen.getByRole('link', { name: /Ana Cliente/ });
    expect(link).toHaveAttribute('href', `/coach/clients/${anaId}`);
  });

  it('muestra aviso de ejercicio cambiado 3 veces en 4 semanas', async () => {
    const anaId = await anaUserId();
    assignmentsApi.fetchClientPrograms.mockResolvedValue([activeProgramRow(anaId)]);

    const alertsMap = new Map<string, ClientWorkoutAlerts>();
    alertsMap.set(anaId, {
      daysSinceLastWorkout: 2,
      exerciseReplacement: {
        exerciseName: 'Press horizontal',
        times: 3,
      },
    });
    workoutAlerts.useWorkoutAlerts.mockReturnValue({ isSuccess: true, data: alertsMap });

    await renderAppAs('coach@example.test', '/coach');

    expect(await screen.findByRole('heading', { name: 'Programs to look at' })).toBeVisible();
    expect(screen.getByText('Ana Cliente')).toBeVisible();
    expect(screen.getByText('Changed Press horizontal 3 times in 4 weeks')).toBeVisible();
  });
});
