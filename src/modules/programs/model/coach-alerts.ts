import { routineProgress } from './assignments';
import type { ClientRoutines } from './assignments';
import { daysBetween } from './calendar';

// Los avisos del inicio del coach (PR 2.18, D-085): a qué clientes hay que
// mirarles la rutina. Sin emails ni notificaciones (P-07). Lógica pura.

/** Con cuántos días de margen se avisa de que una rutina se acaba. */
export const ENDS_SOON_DAYS = 7;

export type CoachAlert =
  | { kind: 'noProgram'; clientId: string; clientName: string }
  | { kind: 'endsSoon'; clientId: string; clientName: string; endsOn: string }
  | { kind: 'repeating'; clientId: string; clientName: string };

interface AlertClient {
  userId: string;
  displayName: string;
}

/**
 * Un aviso por cliente activo, como mucho: sin rutina; con el último bloque
 * ya terminado y repitiéndose; o con la rutina a 7 días o menos de terminar.
 * Una rutina sin fecha de fin no da aviso (D-075), y quien tiene una próxima
 * asignada tampoco: ya está resuelto. Primero lo más urgente.
 */
export function coachAlerts(
  clients: readonly AlertClient[],
  routines: ReadonlyMap<string, ClientRoutines>,
  today: string,
): CoachAlert[] {
  const alerts: CoachAlert[] = [];
  for (const client of clients) {
    const own = routines.get(client.userId);
    const base = { clientId: client.userId, clientName: client.displayName };
    if (own !== undefined && own.next !== null) {
      continue;
    }
    const current = own?.current ?? null;
    if (current === null) {
      alerts.push({ kind: 'noProgram', ...base });
      continue;
    }
    const progress = routineProgress(current, today);
    if (progress === null) {
      continue;
    }
    if (progress.isRepeating) {
      alerts.push({ kind: 'repeating', ...base });
    } else if (progress.endsOn !== null && daysBetween(today, progress.endsOn) <= ENDS_SOON_DAYS) {
      alerts.push({ kind: 'endsSoon', ...base, endsOn: progress.endsOn });
    }
  }
  const urgency = { noProgram: 0, repeating: 1, endsSoon: 2 } as const;
  return alerts.sort(
    (a, b) => urgency[a.kind] - urgency[b.kind] || a.clientName.localeCompare(b.clientName),
  );
}
