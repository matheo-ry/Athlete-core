import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderAppAs } from '@/test/render-app';

import type { AssignInput, AssignResult } from '../api/assignments-api';
import { parseClientPrograms } from '../model/assignments';
import type { ClientProgram } from '../model/assignments';
import { newTemplate } from '../model/program-document';
import type { ProgramDocument } from '../model/program-document';
import { parseTemplates } from '../model/template-list';
import type { TemplateSummary } from '../model/template-list';

// "Asignar" (PR 2.13a), con la base de datos sustituida por datos inventados.
// En el negocio de prueba, Iron Lab, la única clienta activa es "Ana Cliente".
const api = vi.hoisted(() => ({
  fetchTemplates: vi.fn<(tenantId: string) => Promise<TemplateSummary[]>>(),
  fetchProgram: vi.fn<(tenantId: string, id: string) => Promise<ProgramDocument>>(),
  saveProgram: vi.fn(),
  setTemplateArchived: vi.fn(),
}));
vi.mock('../api/programs-api', () => api);
const assignments = vi.hoisted(() => ({
  fetchClientPrograms: vi.fn<(tenantId: string) => Promise<ClientProgram[]>>(),
  assignProgram: vi.fn<(tenantId: string, input: AssignInput) => Promise<AssignResult>>(),
}));
vi.mock('../api/assignments-api', () => assignments);

const ID = '00000000-0000-4000-8000-000000000001';
const TEMPLATE = parseTemplates([
  {
    id: ID,
    name: 'Casa + Gym',
    updated_at: '2026-11-15T10:00:00Z',
    archived_at: null,
    program_blocks: [{ position: 1, cycle_days: 7, program_days: [{ kind: 'training' }] }],
  },
]);

/** Una plantilla semanal de 4 vueltas: empezando el lunes 16 termina el 13 de diciembre. */
function fourWeeks(): ProgramDocument {
  const document = { ...newTemplate('Casa + Gym', 7), id: ID, updatedAt: 'x' };
  const block = document.blocks[0];
  if (block === undefined) throw new Error('falta el bloque');
  document.blocks[0] = { ...block, laps: 4 };
  return document;
}

/** El identificador que la fuente de datos de prueba da a "Ana Cliente". */
async function anaUserId(): Promise<string> {
  const members = await createFakeTenancySource().listMembers(TEST_TENANTS.iron.id);
  return members.find((member) => member.displayName === 'Ana Cliente')?.userId ?? '';
}

async function openAssign() {
  const view = await renderAppAs('coach@example.test', '/coach/programs');
  await view.user.click(await screen.findByRole('button', { name: 'Assign: Casa + Gym' }));
  const dialog = await screen.findByRole('dialog', { name: 'Assign “Casa + Gym”' });
  await within(dialog).findByText('Ana Cliente');
  return { ...view, dialog };
}

describe('módulo programs: asignar una plantilla (PR 2.13a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Lunes 16 de noviembre de 2026, a mediodía: "hoy" es la fecha del dispositivo.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
    api.fetchTemplates.mockResolvedValue(TEMPLATE);
    api.fetchProgram.mockResolvedValue(fourWeeks());
    assignments.fetchClientPrograms.mockResolvedValue([]);
    assignments.assignProgram.mockResolvedValue({ status: 'assigned', count: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asigna a un cliente con fecha de hoy y en modo calendario, y lo dice', async () => {
    const { user, dialog } = await openAssign();
    expect(within(dialog).getByLabelText('Start date')).toHaveValue('2026-11-16');
    expect(within(dialog).getByText('Ends on December 13, 2026.')).toBeVisible();

    await user.click(within(dialog).getByRole('checkbox', { name: /Ana Cliente/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Assign to 1 client' }));

    expect(assignments.assignProgram).toHaveBeenCalledWith(expect.any(String), {
      templateId: ID,
      clientIds: [expect.any(String)],
      startsOn: '2026-11-16',
      mode: 'calendar',
      today: '2026-11-16',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('“Casa + Gym” assigned.');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('sin elegir a nadie no asigna', async () => {
    const { user, dialog } = await openAssign();
    await user.click(within(dialog).getByRole('button', { name: 'Assign to 1 client' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Choose at least one client.');
    expect(assignments.assignProgram).not.toHaveBeenCalled();
  });

  it('con una rutina sin fin: "Se repite hasta que la cambies"; Escape cierra', async () => {
    api.fetchProgram.mockResolvedValue({ ...newTemplate('Casa + Gym', 7), id: ID, updatedAt: 'x' });
    const { user, dialog } = await openAssign();
    expect(within(dialog).getByText('Repeats until you change it.')).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Assign: Casa + Gym' })).toHaveFocus();
  });
});

describe('módulo programs: asignar a quien ya tiene rutina (PR 2.13a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
    api.fetchTemplates.mockResolvedValue(TEMPLATE);
    api.fetchProgram.mockResolvedValue(fourWeeks());
    assignments.assignProgram.mockResolvedValue({ status: 'assigned', count: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('con fecha de hoy, avisa de que la vigente pasa a Anteriores; con fecha futura, no', async () => {
    const clientId = await anaUserId();
    assignments.fetchClientPrograms.mockResolvedValue(
      parseClientPrograms([
        {
          id: 'p1',
          name: 'Pierna',
          client_id: clientId,
          starts_on: '2026-11-01',
          start_block_id: null,
          mode: 'calendar',
          program_blocks: [{ id: 'b1', position: 1, cycle_days: 7, laps: null }],
        },
      ]),
    );
    const { user, dialog } = await openAssign();
    expect(within(dialog).getByText(/Has “Pierna”/)).toBeVisible();
    await user.click(within(dialog).getByRole('checkbox', { name: /Ana Cliente/ }));
    expect(within(dialog).getByRole('note')).toHaveTextContent(
      'Ana Cliente already has “Pierna”. It will move to Previous.',
    );

    const date = within(dialog).getByLabelText('Start date');
    await user.clear(date);
    await user.type(date, '2026-11-26');
    expect(within(dialog).getByText('Starts on November 26, 2026.')).toBeVisible();
    expect(within(dialog).queryByRole('note')).toBeNull();
  });
});
