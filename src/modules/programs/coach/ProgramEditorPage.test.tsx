import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAppAs } from '@/test/render-app';

import type { SaveProgramResult } from '../api/programs-api';
import { newTemplate } from '../model/program-document';
import type { ProgramDayExercise, ProgramDocument } from '../model/program-document';

// El editor de los días del ciclo (PR 2.8), con la base de datos sustituida
// por datos inventados. La lógica de los cambios tiene sus tests en model/.
const api = vi.hoisted(() => ({
  fetchTemplates: vi.fn(),
  fetchProgram: vi.fn<(tenantId: string, id: string) => Promise<ProgramDocument>>(),
  saveProgram: vi.fn<(tenantId: string, document: ProgramDocument) => Promise<SaveProgramResult>>(),
  setTemplateArchived: vi.fn(),
}));
vi.mock('../api/programs-api', () => api);

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ID = uuid(1);

function exercise(n: number, sets: number): ProgramDayExercise {
  return {
    id: uuid(100 + n),
    exerciseId: uuid(200 + n),
    supersetGroup: null,
    restSeconds: 120,
    note: null,
    sets: Array.from({ length: sets }, (_, index) => ({
      id: uuid(300 + n * 10 + index),
      repsMin: 8,
      repsMax: 12,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir' as const,
      intensityValue: 1,
      targetLoadKg: null,
    })),
  };
}

/** "Casa + Gym", resumida: el lunes de entreno en casa con 2 ejercicios y 5 series. */
function casaGym(): ProgramDocument {
  const template = newTemplate('Casa + Gym', 7);
  const [block] = template.blocks;
  if (block === undefined) throw new Error('sin bloque');
  return {
    ...template,
    id: ID,
    updatedAt: '2026-11-15T10:00:00.000Z',
    blocks: [
      {
        ...block,
        id: uuid(2),
        days: block.days.map((day, index) => ({
          ...day,
          id: uuid(10 + index),
          ...(day.dayNumber === 1
            ? {
                kind: 'training' as const,
                subtitle: 'Empuje + dorsal + bíceps',
                place: 'Casa',
                exercises: [exercise(1, 3), exercise(2, 2)],
              }
            : {}),
        })),
      },
    ],
  };
}

const days = () =>
  within(screen.getByRole('list', { name: 'Days of the cycle' })).getAllByRole('button');

describe('módulo programs: editor de los días del ciclo (PR 2.8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchProgram.mockResolvedValue(casaGym());
    api.saveProgram.mockResolvedValue({
      status: 'saved',
      id: ID,
      updatedAt: '2026-11-15T11:00:00Z',
    });
  });

  it('enseña los días de un ciclo semanal, de lunes a domingo, con sus ejercicios y series', async () => {
    await renderAppAs('coach@example.test', `/coach/programs/${ID}`);

    expect(await screen.findByRole('heading', { name: 'Casa + Gym', level: 1 })).toBeVisible();
    expect(days()).toHaveLength(7);
    expect(days()[0]).toHaveTextContent(
      'MondayEmpuje + dorsal + bíceps · Casa · 2 exercises · 5 sets',
    );
    expect(days()[1]).toHaveTextContent('TuesdayRest');
    expect(days()[6]).toHaveTextContent('Sunday');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('un ciclo que no es de 7 días va por "Día 1, Día 2…"', async () => {
    api.fetchProgram.mockResolvedValue({ ...newTemplate('Ocho', 8), id: ID, updatedAt: 'v1' });
    await renderAppAs('coach@example.test', `/coach/programs/${ID}`);

    expect(await screen.findByRole('button', { name: /^Day 1/ })).toBeVisible();
    expect(days().at(-1)).toHaveTextContent('Day 8');
  });

  it('marca un día como entreno, le pone nombre y lugar, y guarda sin perder los ejercicios', async () => {
    const { user } = await renderAppAs('coach@example.test', `/coach/programs/${ID}`);
    await user.click(await screen.findByRole('button', { name: /^Thursday/ }));
    await user.click(screen.getByRole('button', { name: 'Training' }));
    await user.type(screen.getByLabelText('Name (optional)'), 'Pierna');
    await user.type(screen.getByLabelText('Place (optional)'), 'Gym');
    expect(screen.getByText('You have unsaved changes.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const sent = api.saveProgram.mock.calls[0]?.[1];
    expect(sent?.blocks[0]?.days[3]).toMatchObject({
      kind: 'training',
      name: 'Pierna',
      place: 'Gym',
    });
    expect(sent?.blocks[0]?.days[0]?.exercises).toEqual(casaGym().blocks[0]?.days[0]?.exercises);
    expect(sent?.updatedAt).toBe('2026-11-15T10:00:00.000Z');
  });

  it('acortar el ciclo cuando sobran días con contenido pide confirmación', async () => {
    const { user } = await renderAppAs('coach@example.test', `/coach/programs/${ID}`);
    const field = await screen.findByLabelText('Days in the cycle');
    await user.click(screen.getByRole('button', { name: /^Sunday/ }));
    await user.click(screen.getByRole('button', { name: 'Training' }));
    await user.clear(field);
    await user.type(field, '6');
    await user.click(screen.getByRole('button', { name: 'Change' }));

    expect(
      screen.getByText('Sunday has content. If you shorten the cycle, it will be removed.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Yes, shorten' }));
    expect(days()).toHaveLength(6);
    expect(days()[0]).toHaveTextContent('Day 1');
  });

  it('marcar como descanso un día con ejercicios pide confirmación', async () => {
    const { user } = await renderAppAs('coach@example.test', `/coach/programs/${ID}`);
    await user.click(await screen.findByRole('button', { name: /^Monday/ }));
    await user.click(screen.getByRole('button', { name: 'Rest' }));

    expect(screen.getByText(/This day has 2 exercises/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(days()[0]).toHaveTextContent('2 exercises');
  });

  it('si la rutina se cambió desde otro dispositivo, lo dice y no pisa nada', async () => {
    api.saveProgram.mockResolvedValue({ status: 'conflict' });
    const { user } = await renderAppAs('coach@example.test', `/coach/programs/${ID}`);
    await user.click(await screen.findByRole('button', { name: /^Tuesday/ }));
    await user.click(screen.getByRole('button', { name: 'Training' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('changed from another device');
    await user.click(screen.getByRole('button', { name: 'Reload' }));
    expect(api.fetchProgram).toHaveBeenCalledTimes(2);
  });
});
