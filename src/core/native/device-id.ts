import { z } from 'zod';

import { getDeviceStore } from './device-store';
import type { DeviceStore } from './device-store';

// Un identificador de este móvil, creado la primera vez y guardado en él. Sirve
// para saber en qué dispositivo está abierto algo (D-124). No identifica a la
// persona y no cambia al cambiar de cuenta.

const KEY = 'device.id';
const schema = z.string().min(1).max(64);

export async function readOrCreateDeviceId(
  store: Pick<DeviceStore, 'read' | 'write'>,
  newId: () => string,
): Promise<string> {
  const stored = await store.read(KEY, schema);
  if (stored !== null) {
    return stored;
  }
  const id = newId();
  await store.write(KEY, id);
  return id;
}

let current: Promise<string> | null = null;

export function getDeviceId(): Promise<string> {
  current ??= readOrCreateDeviceId(getDeviceStore(), () => crypto.randomUUID());
  return current;
}
