import { beforeEach, describe, expect, it } from 'vitest';

import { clearDeviceDrafts } from '@/core/lib';

import { newTemplate } from './program-document';
import { clearProgramDraft, readProgramDraft, writeProgramDraft } from './program-draft';

const PROGRAM = '00000000-0000-4000-8000-000000000001';
const saved = { ...newTemplate('Prueba', 7), id: PROGRAM, updatedAt: '2026-11-15T10:00:00Z' };
const changed = { ...saved, name: 'Prueba cambiada' };

describe('los cambios sin guardar de una rutina, en el dispositivo (PR 2.8b)', () => {
  beforeEach(() => localStorage.clear());

  it('se guardan y se recuperan para ese usuario y esa rutina', () => {
    writeProgramDraft('user-a', changed);

    expect(readProgramDraft('user-a', saved)).toEqual(changed);
    expect(readProgramDraft('user-b', saved)).toBeNull();
    expect(
      readProgramDraft('user-a', { ...saved, id: '00000000-0000-4000-8000-000000000002' }),
    ).toBeNull();
  });

  it('si la rutina se guardó después desde otro sitio, el borrador se olvida', () => {
    writeProgramDraft('user-a', changed);

    expect(readProgramDraft('user-a', { ...saved, updatedAt: '2026-11-15T11:00:00Z' })).toBeNull();
    expect(readProgramDraft('user-a', saved)).toBeNull();
  });

  it('lo que no pasa la validación cuenta como ninguno', () => {
    localStorage.setItem(`athlete-core.draft.program.user-a.${PROGRAM}`, '{not json');
    expect(readProgramDraft('user-a', saved)).toBeNull();

    localStorage.setItem(
      `athlete-core.draft.program.user-a.${PROGRAM}`,
      JSON.stringify({
        userId: 'user-a',
        programId: PROGRAM,
        document: { ...changed, blocks: [] },
      }),
    );
    expect(readProgramDraft('user-a', saved)).toBeNull();
  });

  it('se borra al guardar o al descartar, y todos al cerrar sesión', () => {
    writeProgramDraft('user-a', changed);
    clearProgramDraft('user-a', PROGRAM);
    expect(readProgramDraft('user-a', saved)).toBeNull();

    writeProgramDraft('user-a', changed);
    clearDeviceDrafts();
    expect(readProgramDraft('user-a', saved)).toBeNull();
  });
});
