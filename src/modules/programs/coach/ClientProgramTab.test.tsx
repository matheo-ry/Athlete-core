import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderAppAs } from '@/test/render-app';

import { parseClientPrograms } from '../model/assignments';
import type { ClientProgram } from '../model/assignments';
import { editCycle } from '../model/cycle-editor';
import { newTemplate } from '../model/program-document';
import type { ProgramDocument } from '../model/program-document';

// La pestaña "Rutina" de la ficha del cliente (PR 2.14), con la base de datos
// sustituida por datos inventados. En Iron Lab la clienta es "Ana Cliente".
const api = vi.hoisted(() => ({
  fetchTemplates: vi.fn(),
  fetchProgram: vi.fn<(tenantId: string, id: string) => Promise<ProgramDocument>>(),
  saveProgram: vi.fn(),
  setTemplateArchived: vi.fn(),
}));
vi.mock('../api/programs-api', () => api);
const assignments = vi.hoisted(() => ({
  fetchClientPrograms: vi.fn(),
  fetchProgramsOfClient: vi.fn<(tenantId: string, clientId: string) => Promise<ClientProgram[]>>(),
  assignProgram: vi.fn(),
  setMissedDayRule: vi.fn(),
}));
vi.mock('../api/assignments-api', () => assignments);

const PROGRAM_ID = '00000000-0000-4000-8000-000000000001';

async function anaUserId(): Promise<string> {
  const members = await createFakeTenancySource().listMembers(TEST_TENANTS.iron.id);
  return members.find((member) => member.displayName === 'Ana Cliente')?.userId ?? '';
}

/** "Casa + Gym" de Ana: semanal, con el lunes "Torso" de entreno. */
function document(clientId: string): ProgramDocument {
  const base = { ...newTemplate('Casa + Gym', 7), id: PROGRAM_ID, updatedAt: 'x', clientId };
  const withMonday = editCycle(base, { type: 'setDayKind', dayNumber: 1, kind: 'training' });
  return editCycle(withMonday, { type: 'setDayText', dayNumber: 1, field: 'name', value: 'Torso' });
}

function row(id: string, clientId: string, name: string, startsOn: string, endedAt: string | null) {
  return {
    id,
    name,
    client_id: clientId,
    starts_on: startsOn,
    start_block_id: null,
    mode: 'calendar',
    ended_at: endedAt,
    program_blocks: [{ id: `${id}-b`, position: 1, cycle_days: 7, laps: 4 }],
  };
}

describe('módulo programs: la pestaña "Rutina" de la ficha (PR 2.14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Lunes 16 de noviembre de 2026.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enseña la rutina actual con la semana en que va, sus días con hoy marcado, y las anteriores', async () => {
    const ana = await anaUserId();
    api.fetchProgram.mockResolvedValue(document(ana));
    assignments.fetchProgramsOfClient.mockResolvedValue(
      parseClientPrograms([
        row(PROGRAM_ID, ana, 'Casa + Gym', '2026-11-09', null),
        row('old', ana, 'Fuerza', '2026-09-01', '2026-11-09T10:00:00Z'),
      ]),
    );
    await renderAppAs('coach@example.test', `/coach/clients/${ana}`);

    expect(await screen.findByRole('button', { name: 'Program' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await screen.findByText('Casa + Gym')).toBeVisible();
    expect(
      screen.getByText('Week 2 of 4 · Ends Dec 6, 2026 · With calendar · Started Nov 9, 2026'),
    ).toBeVisible();
    const days = await screen.findByRole('list', { name: 'Days of the current block' });
    const [monday] = within(days).getAllByRole('listitem');
    expect(monday).toHaveTextContent('Monday · TodayTorso · 0 exercises · 0 sets');
    expect(monday).toHaveAttribute('aria-current', 'date');
    expect(screen.getByRole('link', { name: 'Edit “Casa + Gym”' })).toHaveAttribute(
      'href',
      `/coach/programs/${PROGRAM_ID}`,
    );
    expect(screen.getByText('Fuerza')).toBeVisible();
    expect(screen.getByText('Sep 1, 2026 – Nov 9, 2026')).toBeVisible();
  });

  it('sin rutina lo dice', async () => {
    assignments.fetchProgramsOfClient.mockResolvedValue([]);
    await renderAppAs('coach@example.test', `/coach/clients/${await anaUserId()}`);
    expect(await screen.findByText("This client doesn't have a program.")).toBeVisible();
  });

  it('enseña la sección de regla de día saltado y permite elegir una opción (PR 3.12, D-125)', async () => {
    const ana = await anaUserId();
    api.fetchProgram.mockResolvedValue(document(ana));
    assignments.fetchProgramsOfClient.mockResolvedValue(
      parseClientPrograms([row(PROGRAM_ID, ana, 'Casa + Gym', '2026-11-09', null)]),
    );
    assignments.setMissedDayRule.mockResolvedValue({ status: 'done' });
    await renderAppAs('coach@example.test', `/coach/clients/${ana}`);

    expect(await screen.findByRole('heading', { name: 'If a workout is missed' })).toBeVisible();
    const radioRecover = screen.getByRole('radio', { name: /Recovered on the next rest day/i });
    expect(radioRecover).not.toBeChecked();

    const radioLose = screen.getByRole('radio', { name: /Skipped/i });
    expect(radioLose).toBeChecked();
  });

  it('el editor de la rutina de un cliente dice de quién es y vuelve a su ficha', async () => {
    const ana = await anaUserId();
    api.fetchProgram.mockResolvedValue(document(ana));
    await renderAppAs('coach@example.test', `/coach/programs/${PROGRAM_ID}`);
    expect(await screen.findByText('Program of Ana Cliente')).toBeVisible();
    expect(screen.getByRole('link', { name: '← Ana Cliente' })).toHaveAttribute(
      'href',
      `/coach/clients/${ana}`,
    );
  });
});
