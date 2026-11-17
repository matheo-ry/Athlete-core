import { dehydrate, hydrate } from '@tanstack/react-query';
import type { DehydratedState, QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { getDeviceStore } from '@/core/native';
import type { DeviceStore } from '@/core/native';

// En la app del móvil, lo ya cargado sigue ahí al volver a abrirla sin
// conexión, aunque se haya quitado de la multitarea o apagado el móvil
// (DECISIONES D-061 y D-118): los espacios, los flags, la marca, la rutina…
// Se guarda en el almacén del teléfono y se recupera antes de pintar la primera
// pantalla. Con conexión, cada pantalla lo vuelve a pedir como siempre.
//
// Al cerrar sesión, `core/tenancy` vacía la caché y aquí se guarda vacía: no
// queda nada del usuario anterior. En el navegador no se usa (todo sigue igual).

const KEY = 'query-cache';
/** Lo guardado hace más de esto ya no sirve: mejor pedirlo otra vez. */
export const PERSISTED_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 1000;

const dehydratedStateSchema = z.custom<DehydratedState>(
  (value) =>
    z.object({ queries: z.array(z.object({ queryKey: z.array(z.unknown()) })) }).safeParse(value)
      .success,
);

const persistedSchema = z.object({
  savedAt: z.number(),
  state: dehydratedStateSchema,
});

/** Recupera lo guardado. Se llama una vez, antes de pintar. */
export async function restoreQueryCache(
  client: QueryClient,
  store: DeviceStore = getDeviceStore(),
  now: number = Date.now(),
): Promise<void> {
  const saved = await store.read(KEY, persistedSchema);
  if (saved === null) {
    return;
  }
  if (now - saved.savedAt > PERSISTED_MAX_AGE_MS) {
    await store.remove(KEY);
    return;
  }
  hydrate(client, saved.state);
}

/** Guarda la caché cada vez que cambia, como mucho una vez por segundo. Devuelve cómo parar. */
export function persistQueryCache(
  client: QueryClient,
  store: DeviceStore = getDeviceStore(),
  now: () => number = Date.now,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    timer = null;
    // Solo lo que se cargó bien; nada de cambios a medias (los formularios
    // no se envían sin conexión, D-061).
    const state = dehydrate(client, { shouldDehydrateMutation: () => false });
    void store.write(KEY, { savedAt: now(), state });
  };
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event.type === 'added' || event.type === 'removed' || event.type === 'updated') {
      timer ??= setTimeout(save, SAVE_DELAY_MS);
    }
  });
  return () => {
    unsubscribe();
    if (timer !== null) {
      clearTimeout(timer);
    }
  };
}
