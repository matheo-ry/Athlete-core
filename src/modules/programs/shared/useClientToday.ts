import { useMemo } from 'react';

import { routinesByClient } from '../model/assignments';
import type { ClientProgram } from '../model/assignments';
import { localToday } from '../model/calendar';
import { clientBlock } from '../model/client-view';
import type { ProgramBlock, ProgramDay, ProgramDocument } from '../model/program-document';
import { useDayLabel, useDaySummary } from './useDayText';
import { useClientPrograms } from '../api/useAssignments';
import { useProgram } from '../api/useProgram';
import { useSyncMissedDays } from '../api/useSyncMissedDays';

export type ClientToday =
  | { status: 'loading' }
  | { status: 'none'; next: ClientProgram | null }
  | {
      status: 'ready';
      program: ClientProgram;
      document: ProgramDocument;
      /** El bloque que va hoy (o el primero, si aún no ha empezado). */
      block: ProgramBlock;
      /** El día que toca hoy; vacío en modo lista (D-082). */
      today: ProgramDay | null;
      /** Si hoy toca recuperación de un día faltado (D-125). */
      isRecovery?: boolean;
    };

/**
 * El cálculo de "Hoy toca" (D-084, D-119), para la tarjeta del inicio, que es
 * de `workouts`: la rutina vigente del cliente, su bloque y el día de hoy.
 */
export function useClientToday(): ClientToday {
  const date = useMemo(() => localToday(), []);
  const programs = useClientPrograms();
  // El cliente solo lee sus propias rutinas (RLS): hay como mucho un cliente.
  const routines = [...routinesByClient(programs.data ?? [], date).values()][0];
  const current = routines?.current ?? null;
  const document = useProgram(current?.id ?? '');

  useSyncMissedDays(current, document.data, date);

  if (!programs.isSuccess) {
    return { status: 'loading' };
  }
  if (current === null) {
    return { status: 'none', next: routines?.next ?? null };
  }
  if (!document.isSuccess) {
    return { status: 'loading' };
  }
  const placed = clientBlock(current, document.data, date);
  if (placed === null) {
    return { status: 'none', next: null };
  }
  const today = placed.block.days.find((day) => day.dayNumber === placed.todayNumber) ?? null;
  return {
    status: 'ready',
    program: current,
    document: document.data,
    block: placed.block,
    today,
    isRecovery: placed.isRecovery,
  };
}

/** "Lunes · Empuje" o "Día 3": el título de un día, en el idioma del usuario. */
export function useDayTitle(block: ProgramBlock | undefined) {
  const label = useDayLabel(block);
  return (day: Pick<ProgramDay, 'dayNumber' | 'name'>) =>
    [label(day.dayNumber), day.name].filter((part) => part !== null).join(' · ');
}

export { useDaySummary };
