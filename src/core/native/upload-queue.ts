import { z } from 'zod';

import { logger } from '../lib';
import { getDeviceStore } from './device-store';
import type { DeviceStore } from './device-store';

// La cola de lo pendiente de subir (DECISIONES D-118). Lo que el cliente apunta
// se guarda aquí al instante, en el almacén del teléfono, y se sube cuando hay
// conexión: en orden, de uno en uno, y reintentando si falla.
//
// - **No duplica:** cada cosa lleva el identificador que creó el móvil. Volver a
//   encolarla sustituye a la versión anterior en su mismo sitio de la cola, y la
//   base de datos acepta subir dos veces lo mismo (D-138).
// - **No pierde cambios:** si algo cambia mientras se sube, la versión subida no
//   borra la nueva de la cola: se sube también.
// - **Rechazos:** si la base de datos lo rechaza (el coach dio de baja al
//   cliente, o no cumple sus reglas), reintentar no sirve. Se queda en la cola
//   como rechazado para avisar al cliente hasta que lo lea.
//
// Cada usuario tiene su cola: si la sesión caduca, lo suyo espera a que vuelva
// a entrar con la misma cuenta (D-118). Qué se sube y cómo lo decide el módulo
// que lo encola, con su `UploadSender`.

export const UPLOAD_REJECTIONS = ['no_access', 'invalid'] as const;
export type UploadRejection = (typeof UPLOAD_REJECTIONS)[number];

const uploadItemSchema = z.object({
  /** El identificador que creó el móvil (por ejemplo, el del entreno). */
  id: z.string().min(1),
  /** Qué es: decide quién lo sube ('workout'…). */
  kind: z.string().min(1),
  tenantId: z.string().min(1),
  /** El nombre del negocio, para el aviso "ya no tienes acceso a …". */
  tenantName: z.string(),
  payload: z.json(),
  /** Sube con cada cambio: así se sabe si lo subido sigue siendo lo último. */
  revision: z.number().int().min(1),
  attempts: z.number().int().min(0),
  status: z.enum(['pending', 'rejected']),
  rejection: z.enum(UPLOAD_REJECTIONS).nullable(),
});

export type UploadItem = z.infer<typeof uploadItemSchema>;

const queueSchema = z.array(uploadItemSchema);

export interface UploadInput {
  id: string;
  kind: string;
  tenantId: string;
  tenantName: string;
  payload: UploadItem['payload'];
}

/** Lo que responde quien sube: hecho, reintentar más tarde o rechazado para siempre. */
export type UploadResult = 'done' | 'retry' | UploadRejection;
export type UploadSender = (item: UploadItem) => Promise<UploadResult>;

export interface UploadRun {
  uploaded: number;
  rejected: number;
  /** Algo falló y se reintentará: cuántos intentos lleva lo primero de la cola. */
  failedAttempts: number | null;
}

export interface UploadQueue {
  enqueue(userId: string, input: UploadInput): Promise<void>;
  list(userId: string): Promise<UploadItem[]>;
  /** Sube lo pendiente en orden. Si ya se está subiendo, espera y vuelve a mirar. */
  process(userId: string, senders: Readonly<Record<string, UploadSender>>): Promise<UploadRun>;
  /** El cliente ya leyó el aviso: se olvidan los rechazados. */
  dismissRejected(userId: string): Promise<void>;
  /** Al cerrar sesión a propósito (D-118): lo que quedaba se pierde. */
  clear(userId: string): Promise<void>;
  /** Avisa de cualquier cambio en la cola, para las pantallas. */
  subscribe(listener: () => void): () => void;
}

/** Espera antes del siguiente intento: 5 s, 10 s, 20 s… hasta 5 minutos. */
export function retryDelayMs(attempts: number): number {
  return Math.min(5_000 * 2 ** Math.max(attempts - 1, 0), 300_000);
}

export function createUploadQueue(store: DeviceStore): UploadQueue {
  const listeners = new Set<() => void>();
  // Las escrituras van de una en una: así dos cambios seguidos no se pisan.
  let lock: Promise<unknown> = Promise.resolve();
  const running = new Map<string, Promise<UploadRun>>();

  const keyOf = (userId: string) => `upload-queue.${userId}`;
  const read = async (userId: string) => (await store.read(keyOf(userId), queueSchema)) ?? [];

  function update(userId: string, change: (items: UploadItem[]) => UploadItem[]): Promise<void> {
    const next = lock.then(async () => {
      const items = change(await read(userId));
      await (items.length === 0 ? store.remove(keyOf(userId)) : store.write(keyOf(userId), items));
      listeners.forEach((listener) => listener());
    });
    lock = next.catch(() => undefined);
    return next;
  }

  async function runOnce(
    userId: string,
    senders: Readonly<Record<string, UploadSender>>,
  ): Promise<UploadRun> {
    const run: UploadRun = { uploaded: 0, rejected: 0, failedAttempts: null };
    const tried = new Set<string>();
    for (;;) {
      await lock;
      const item = (await read(userId)).find(
        (candidate) =>
          candidate.status === 'pending' &&
          senders[candidate.kind] !== undefined &&
          !tried.has(`${candidate.kind}:${candidate.id}:${String(candidate.revision)}`),
      );
      const send = item === undefined ? undefined : senders[item.kind];
      if (item === undefined || send === undefined) {
        return run;
      }
      tried.add(`${item.kind}:${item.id}:${String(item.revision)}`);
      const result = await sendSafely(send, item);
      const same = (other: UploadItem) =>
        other.kind === item.kind && other.id === item.id && other.revision === item.revision;
      if (result === 'retry') {
        // En orden: lo de detrás espera a que esto suba.
        await update(userId, (items) =>
          items.map((other) => (same(other) ? { ...other, attempts: other.attempts + 1 } : other)),
        );
        run.failedAttempts = item.attempts + 1;
        return run;
      }
      if (result === 'done') {
        run.uploaded += 1;
        await update(userId, (items) => items.filter((other) => !same(other)));
      } else {
        run.rejected += 1;
        await update(userId, (items) =>
          items.map((other) =>
            same(other) ? { ...other, status: 'rejected', rejection: result } : other,
          ),
        );
      }
    }
  }

  return {
    enqueue: (userId, input) =>
      update(userId, (items) => {
        const index = items.findIndex((item) => item.kind === input.kind && item.id === input.id);
        const previous = index === -1 ? undefined : items[index];
        const item: UploadItem = {
          ...input,
          revision: (previous?.revision ?? 0) + 1,
          attempts: 0,
          status: 'pending',
          rejection: null,
        };
        return previous === undefined
          ? [...items, item]
          : items.map((other, position) => (position === index ? item : other));
      }),
    list: async (userId) => {
      await lock;
      return read(userId);
    },
    process: (userId, senders) => {
      // Una sola subida a la vez por usuario: si llega otra petición, va detrás.
      const previous = running.get(userId) ?? Promise.resolve();
      const next = previous.catch(() => undefined).then(() => runOnce(userId, senders));
      running.set(userId, next);
      const forget = () => {
        if (running.get(userId) === next) {
          running.delete(userId);
        }
      };
      next.then(forget, forget);
      return next;
    },
    dismissRejected: (userId) =>
      update(userId, (items) => items.filter((item) => item.status !== 'rejected')),
    clear: (userId) => update(userId, () => []),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

async function sendSafely(send: UploadSender, item: UploadItem): Promise<UploadResult> {
  try {
    return await send(item);
  } catch (error) {
    // Sin el contenido: lleva los datos del entreno.
    logger.error('Upload failed', {
      kind: item.kind,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return 'retry';
  }
}

let queue: UploadQueue | null = null;

/** La cola de este dispositivo. */
export function getUploadQueue(): UploadQueue {
  queue ??= createUploadQueue(getDeviceStore());
  return queue;
}
