import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAppAs } from '@/test/render-app';

import type { ArchiveTemplateResult, SaveProgramResult } from '../api/programs-api';
import { newTemplate } from '../model/program-document';
import type { ProgramDocument } from '../model/program-document';
import { parseTemplates } from '../model/template-list';
import type { TemplateSummary } from '../model/template-list';

// La pantalla entera, con la base de datos sustituida por datos inventados.
// La lógica de la lista y del documento tiene sus tests en model/.
const api = vi.hoisted(() => ({
  fetchTemplates: vi.fn<(tenantId: string) => Promise<TemplateSummary[]>>(),
  fetchProgram: vi.fn<(tenantId: string, id: string) => Promise<ProgramDocument>>(),
  saveProgram: vi.fn<(tenantId: string, document: ProgramDocument) => Promise<SaveProgramResult>>(),
  setTemplateArchived:
    vi.fn<(tenantId: string, id: string, archived: boolean) => Promise<ArchiveTemplateResult>>(),
}));
vi.mock('../api/programs-api', () => api);

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const TEMPLATES = parseTemplates([
  {
    id: uuid(1),
    name: 'Pecho / Espalda y Brazo / Pierna',
    updated_at: '2026-11-15T10:00:00Z',
    archived_at: null,
    program_blocks: [
      {
        position: 1,
        cycle_days: 8,
        program_days: [...'EEDEEDDD'].map((k) => ({ kind: k === 'E' ? 'training' : 'rest' })),
      },
    ],
  },
  {
    id: uuid(2),
    name: 'Casa + Gym',
    updated_at: '2026-11-15T10:00:00Z',
    archived_at: null,
    program_blocks: [
      {
        position: 1,
        cycle_days: 7,
        program_days: [...'EDEDEED'].map((k) => ({ kind: k === 'E' ? 'training' : 'rest' })),
      },
    ],
  },
]);

function rows() {
  return within(screen.getByRole('list')).getAllByRole('listitem');
}

describe('módulo programs: lista de plantillas (PR 2.7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchTemplates.mockResolvedValue(TEMPLATES);
    api.saveProgram.mockResolvedValue({ status: 'saved', id: uuid(9), updatedAt: 'x' });
    api.setTemplateArchived.mockResolvedValue({ status: 'saved' });
  });

  it('enseña las plantillas por orden alfabético, con su ciclo y sus días de entreno', async () => {
    await renderAppAs('coach@example.test', '/coach/programs');

    expect(await screen.findByRole('heading', { name: 'Programs' })).toBeVisible();
    expect(await screen.findByText('Casa + Gym')).toBeVisible();
    const [first, second] = rows();
    expect(first).toHaveTextContent(/^Casa \+ GymWeekly · 4 training days · Edited Nov 15, 2026/);
    expect(second).toHaveTextContent('8-day cycle · 4 training days');
    expect(screen.getByRole('button', { name: 'Active 2' })).toBeVisible();
  });

  it('sin plantillas: "Aún no tienes plantillas. Crea la primera"', async () => {
    api.fetchTemplates.mockResolvedValue([]);
    await renderAppAs('coach@example.test', '/coach/programs');

    expect(await screen.findByText("You don't have any templates yet")).toBeVisible();
    expect(screen.getByText('Create the first one.')).toBeVisible();
  });

  it('"Nueva plantilla": la crea con un bloque sin fin y todos sus días de descanso, y abre el editor', async () => {
    api.fetchProgram.mockResolvedValue({
      ...newTemplate('Prueba', 10),
      id: uuid(9),
      updatedAt: 'v1',
    });
    const { user } = await renderAppAs('coach@example.test', '/coach/programs');
    await user.click(await screen.findByRole('button', { name: 'New template' }));
    await user.type(screen.getByLabelText('Name'), 'Prueba');
    await user.clear(screen.getByLabelText('Days in the cycle'));
    await user.type(screen.getByLabelText('Days in the cycle'), '10');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(api.saveProgram).toHaveBeenCalledWith(expect.any(String), newTemplate('Prueba', 10));
    expect(await screen.findByRole('heading', { name: 'Prueba', level: 1 })).toBeVisible();
    expect(api.fetchProgram).toHaveBeenCalledWith(expect.any(String), uuid(9));
  });

  it('no crea una plantilla sin nombre ni con un ciclo de más de 28 días', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/programs');
    await user.click(await screen.findByRole('button', { name: 'New template' }));
    await user.clear(screen.getByLabelText('Days in the cycle'));
    await user.type(screen.getByLabelText('Days in the cycle'), '29');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByText('Write the name of the template.')).toBeVisible();
    expect(screen.getByText('Write a number from 1 to 28.')).toBeVisible();
    expect(api.saveProgram).not.toHaveBeenCalled();
  });

  it('si choca con el tope de 300 plantillas, lo dice', async () => {
    api.saveProgram.mockResolvedValue({ status: 'limit_reached' });
    const { user } = await renderAppAs('coach@example.test', '/coach/programs');
    await user.click(await screen.findByRole('button', { name: 'New template' }));
    await user.type(screen.getByLabelText('Name'), 'La 301');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('300 active templates');
  });

  it('renombrar carga la rutina entera y la guarda con el nombre nuevo', async () => {
    const document = { ...newTemplate('Casa + Gym', 7), id: uuid(2), updatedAt: 'v1' };
    api.fetchProgram.mockResolvedValue(document);
    const { user } = await renderAppAs('coach@example.test', '/coach/programs');
    await user.click(await screen.findByRole('button', { name: 'Rename: Casa + Gym' }));
    const field = screen.getByLabelText('New name for “Casa + Gym”');
    await user.clear(field);
    await user.type(field, 'Casa + Gym 2');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(api.fetchProgram).toHaveBeenCalledWith(expect.any(String), uuid(2));
    expect(api.saveProgram).toHaveBeenCalledWith(expect.any(String), {
      ...document,
      name: 'Casa + Gym 2',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Renamed to “Casa + Gym 2”.');
  });

  it('archivar la quita de "Activas"; con "Archivadas" se ve y se recupera', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/programs');
    const archiveButton = await screen.findByRole('button', { name: 'Archive: Casa + Gym' });
    // Al archivar, la lista se vuelve a pedir: la base de datos ya la da por archivada.
    const [eightDays, weekly] = TEMPLATES;
    if (eightDays === undefined || weekly === undefined) throw new Error('faltan datos');
    api.fetchTemplates.mockResolvedValue([
      eightDays,
      { ...weekly, archivedAt: '2026-11-15T11:00:00Z' },
    ]);
    await user.click(archiveButton);

    expect(api.setTemplateArchived).toHaveBeenCalledWith(expect.any(String), uuid(2), true);
    expect(await screen.findByRole('status')).toHaveTextContent('“Casa + Gym” archived.');
    expect(await screen.findByRole('button', { name: 'Active 1' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Archived 1' }));
    await user.click(await screen.findByRole('button', { name: 'Recover: Casa + Gym' }));

    expect(api.setTemplateArchived).toHaveBeenLastCalledWith(expect.any(String), uuid(2), false);
    expect(await screen.findByRole('status')).toHaveTextContent('“Casa + Gym” is active again.');
  });
});
