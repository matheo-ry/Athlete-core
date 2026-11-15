import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router';

import { useAuth } from '@/core/auth';

import { clearProgramDraft, readProgramDraft, writeProgramDraft } from '../model/program-draft';
import type { ProgramDocument } from '../model/program-document';

/**
 * Que no se pierdan los cambios sin guardar del editor (PR 2.8b, D-079):
 * - Mientras hay cambios, se guardan en el dispositivo. Al volver a abrir la
 *   rutina se ofrece recuperarlos (`recovered`), y hasta que el coach elige no
 *   se toca lo guardado.
 * - Salir a otra pantalla de la app pide confirmación (`blocker`); cerrar la
 *   pestaña o recargar, el aviso del propio navegador. Cambiar de día no sale
 *   del editor y no pregunta.
 */
export function useUnsavedChanges(
  saved: ProgramDocument,
  draft: ProgramDocument,
  dirty: boolean,
  isSaving: boolean,
) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const programId = saved.id;
  const [recovered, setRecovered] = useState<ProgramDocument | null>(() =>
    userId === null ? null : readProgramDraft(userId, saved),
  );

  useEffect(() => {
    if (userId === null || programId === null || recovered !== null) {
      return;
    }
    if (dirty) {
      writeProgramDraft(userId, draft);
    } else {
      clearProgramDraft(userId, programId);
    }
  }, [userId, programId, draft, dirty, recovered]);

  useEffect(() => {
    if (!dirty) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Mientras se guarda no se pregunta: el guardado sigue aunque se salga, y
  // al terminar el editor vuelve a empezar y olvidaría la pregunta a medias.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !isSaving && currentLocation.pathname !== nextLocation.pathname,
  );

  return {
    recovered,
    /** Ya se ha elegido "Recuperar" o "Descartar". */
    resolveRecovery: (discard: boolean) => {
      if (discard && userId !== null && programId !== null) {
        clearProgramDraft(userId, programId);
      }
      setRecovered(null);
    },
    /** Lo guardado ya está en la base de datos: el borrador sobra. */
    forget: () => {
      if (userId !== null && programId !== null) {
        clearProgramDraft(userId, programId);
      }
    },
    blocker,
  };
}
