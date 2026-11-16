import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderAppAs } from '@/test/render-app';

import type { AssignInput, AssignResult } from '../api/assignments-api';
import { parseClientPrograms } from '../model/assignments';
import type { ClientProgram } from '../model/assignments';
import type { TemplateSummary } from '../model/template-list';

// La pestaña "Asignadas" (PR 2.13b), con la base de datos sustituida por datos
// inventados. En Iron Lab, el negocio de prueba, la única clienta activa es
// "Ana Cliente".
const api = vi.hoisted(() => ({
  fetchTemplates: vi.fn<(tenantId: string) => Promise<TemplateSummary[]>>(),
  fetchProgram: vi.fn(),
  saveProgram: vi.fn(),
  setTemplateArchived: vi.fn(),
}));
vi.mock('../api/programs-api', () => api);
const assignments = vi.hoisted(() => ({
  fetchClientPrograms: vi.fn<(tenantId: string) => Promise<ClientProgram[]>>(),
  assignProgram: vi.fn<(tenantId: string, input: AssignInput) => Promise<AssignResult>>(),
}));
vi.mock('../api/assignments-api', () => assignments);

async function anaUserId(): Promise<string> {
  const members = await createFakeTenancySource().listMembers(TEST_TENANTS.iron.id);
  return members.find((member) => member.displayName === 'Ana Cliente')?.userId ?? '';
}

function program(
  id: string,
  clientId: string,
  name: string,
  startsOn: string,
  laps: number | null,
) {
  return {
    id,
    name,
    client_id: clientId,
    starts_on: startsOn,
    start_block_id: null,
    mode: 'calendar',
    program_blocks: [{ id: `${id}-b`, position: 1, cycle_days: 7, laps }],
  };
}

async function openAssigned() {
  const view = await renderAppAs('coach@example.test', '/coach/programs');
  await view.user.click(await screen.findByRole('button', { name: 'Assigned' }));
  return view;
}

describe('módulo programs: la pestaña "Asignadas" (PR 2.13b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Lunes 16 de noviembre de 2026: "hoy" es la fecha del dispositivo.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
    api.fetchTemplates.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cada cliente con su rutina: la semana en que va, cuándo termina y la próxima', async () => {
    const ana = await anaUserId();
    assignments.fetchClientPrograms.mockResolvedValue(
      parseClientPrograms([
        program('p1', ana, 'Casa + Gym', '2026-11-09', 4),
        program('p2', ana, 'Fuerza básica', '2026-11-30', null),
      ]),
    );
    await openAssigned();

    const list = await screen.findByRole('list', { name: 'Clients and their programs' });
    const [row] = within(list).getAllByRole('listitem');
    expect(row).toHaveTextContent(
      'Ana ClienteCasa + Gym · Week 2 of 4 · Ends Dec 6, 2026Next: Fuerza básica, starts Nov 30, 2026',
    );
  });

  it('sin rutina dice "Sin rutina"', async () => {
    assignments.fetchClientPrograms.mockResolvedValue([]);
    await openAssigned();
    expect(await screen.findByText('No program')).toBeVisible();
  });

  it('una rutina terminada que se sigue repitiendo lo avisa (D-075)', async () => {
    const ana = await anaUserId();
    assignments.fetchClientPrograms.mockResolvedValue(
      parseClientPrograms([program('p1', ana, 'Casa + Gym', '2026-11-02', 1)]),
    );
    await openAssigned();
    const list = await screen.findByRole('list', { name: 'Clients and their programs' });
    expect(within(list).getByRole('listitem')).toHaveTextContent(
      'Ana ClienteCasa + Gym · Finished: repeating until you change it',
    );
  });

  it('el buscador filtra por nombre de cliente', async () => {
    assignments.fetchClientPrograms.mockResolvedValue([]);
    const { user } = await openAssigned();
    await screen.findByText('Ana Cliente');
    await user.type(screen.getByLabelText('Search clients by name'), 'zzz');
    expect(screen.getByText('No client matches')).toBeVisible();
  });

  it('si no se pueden cargar las rutinas, enseña el error con "Reintentar"', async () => {
    assignments.fetchClientPrograms.mockRejectedValue(new Error('Could not load: 500'));
    await openAssigned();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
