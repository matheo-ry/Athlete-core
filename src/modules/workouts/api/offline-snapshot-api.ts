import type { QueryClient } from '@tanstack/react-query';

import { getDeviceStore, userKey } from '@/core/native';
import { loadCurrentClientProgram, localToday } from '@/modules/programs';

import {
  offlineSnapshotSchema,
  previousPerformances,
  programExerciseIds,
} from '../model/offline-snapshot';
import type { OfflineSnapshot } from '../model/offline-snapshot';
import { fetchPerformedExercises } from './performed-api';

// Lo necesario para entrenar sin cobertura, en el almacén del teléfono
// (D-118). Uno por usuario y espacio: un cliente de dos coaches tiene dos.
// Al cerrar sesión se borra con todo lo del usuario (`removeUser`).

/** La misma copia, en la caché de TanStack Query, para las pantallas de entreno (PR 3.5b). */
export function snapshotQueryKey(userId: string, tenantId: string) {
  return ['workouts', 'snapshot', userId, tenantId] as const;
}

function snapshotKey(userId: string, tenantId: string): string {
  return userKey(userId, `workouts.snapshot.${tenantId}`);
}

/** Descarga la rutina vigente y la vez anterior de cada ejercicio, y lo guarda en el teléfono. */
export async function refreshOfflineSnapshot(
  queryClient: QueryClient,
  userId: string,
  tenantId: string,
): Promise<OfflineSnapshot> {
  const current = await loadCurrentClientProgram(queryClient, tenantId, localToday());
  const exerciseIds = programExerciseIds({ current });
  const performed =
    current === null || exerciseIds.size === 0
      ? []
      : await fetchPerformedExercises(tenantId, userId, [...exerciseIds]);
  const snapshot: OfflineSnapshot = {
    tenantId,
    savedAt: new Date().toISOString(),
    current,
    previous:
      current === null ? [] : previousPerformances(performed, current.program.id, exerciseIds),
  };
  await getDeviceStore().write(snapshotKey(userId, tenantId), snapshot);
  queryClient.setQueryData(snapshotQueryKey(userId, tenantId), snapshot);
  return snapshot;
}

/** Lo último guardado, validado; `null` si nunca se descargó (o es de otra versión de la app). */
export function readOfflineSnapshot(
  userId: string,
  tenantId: string,
): Promise<OfflineSnapshot | null> {
  return getDeviceStore().read(snapshotKey(userId, tenantId), offlineSnapshotSchema);
}
