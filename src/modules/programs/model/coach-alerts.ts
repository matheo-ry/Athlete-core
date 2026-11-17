import { routineProgress } from './assignments';
import type { ClientRoutines } from './assignments';
import { daysBetween } from './calendar';

// Los avisos del inicio del coach (PR 2.18, PR 3.14, D-085, D-114, D-128):
// a qué clientes hay que prestar atención (rutina, inactividad o ejercicios cambiados).
// Sin emails ni notificaciones (P-07). Lógica pura.

/** Con cuántos días de margen se avisa de que una rutina se acaba. */
export const ENDS_SOON_DAYS = 7;

export interface ClientWorkoutAlerts {
  daysSinceLastWorkout?: number | null;
  exerciseReplacement?: {
    exerciseName: string;
    times: number;
  } | null;
}

export type CoachAlert =
  | { kind: 'noProgram'; clientId: string; clientName: string }
  | { kind: 'notTrained'; clientId: string; clientName: string; days: number }
  | {
      kind: 'exerciseChanged';
      clientId: string;
      clientName: string;
      exerciseName: string;
      times: number;
    }
  | { kind: 'endsSoon'; clientId: string; clientName: string; endsOn: string }
  | { kind: 'repeating'; clientId: string; clientName: string };

interface AlertClient {
  userId: string;
  displayName: string;
}

/**
 * Un aviso por cliente activo, como mucho (D-114, D-128):
 * 1. Sin rutina
 * 2. Sin entrenar desde hace 7 días o más
 * 3. Cambió el mismo ejercicio 3 veces en 4 semanas
 * 4. Rutina terminada y repitiéndose
 * 5. Rutina a 7 días o menos de terminar
 *
 * Una rutina sin fecha de fin no da aviso (D-075), y quien tiene una próxima
 * asignada tampoco: ya está resuelto. Primero lo más urgente.
 */
export function coachAlerts(
  clients: readonly AlertClient[],
  routines: ReadonlyMap<string, ClientRoutines>,
  today: string,
  workoutAlerts?: ReadonlyMap<string, ClientWorkoutAlerts>,
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

    const wAlerts = workoutAlerts?.get(client.userId);
    if (
      wAlerts?.daysSinceLastWorkout !== null &&
      wAlerts?.daysSinceLastWorkout !== undefined &&
      wAlerts.daysSinceLastWorkout >= 7
    ) {
      alerts.push({ kind: 'notTrained', ...base, days: wAlerts.daysSinceLastWorkout });
      continue;
    }

    if (wAlerts?.exerciseReplacement) {
      alerts.push({
        kind: 'exerciseChanged',
        ...base,
        exerciseName: wAlerts.exerciseReplacement.exerciseName,
        times: wAlerts.exerciseReplacement.times,
      });
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

  const urgency = {
    noProgram: 0,
    notTrained: 1,
    exerciseChanged: 2,
    repeating: 3,
    endsSoon: 4,
  } as const;

  return alerts.sort(
    (a, b) => urgency[a.kind] - urgency[b.kind] || a.clientName.localeCompare(b.clientName),
  );
}
