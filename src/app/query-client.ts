import { QueryCache, QueryClient } from '@tanstack/react-query';

import { logger } from '@/core/lib';
import { isNativeApp } from '@/core/native';

import { PERSISTED_MAX_AGE_MS, persistQueryCache, restoreQueryCache } from './query-persistence';

interface QueryClientOptions {
  /** En la app del móvil, lo cargado se guarda en el teléfono (query-persistence.ts). */
  keepOnDevice?: boolean;
}

export function createQueryClient({ keepOnDevice = false }: QueryClientOptions = {}): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      // Todo fallo al pedir datos queda registrado en un solo sitio. Al usuario
      // se le enseña el estado de error traducido de cada pantalla.
      onError: (error, query) => {
        logger.error('Query failed', { queryKey: query.queryKey, message: error.message });
      },
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        // Lo guardado en el teléfono no se olvida a los 5 minutos de no usarse,
        // como hace TanStack Query por defecto: tiene que estar para entrenar sin
        // cobertura aunque no se haya abierto esa pantalla (D-118).
        ...(keepOnDevice ? { gcTime: PERSISTED_MAX_AGE_MS } : {}),
      },
    },
  });
}

/**
 * El cliente de la app, antes de pintar nada. En la app del móvil recupera lo
 * que había guardado y guarda cada cambio; en el navegador es el de siempre.
 */
export async function createAppQueryClient(): Promise<QueryClient> {
  const keepOnDevice = isNativeApp();
  const client = createQueryClient({ keepOnDevice });
  if (keepOnDevice) {
    await restoreQueryCache(client);
    persistQueryCache(client);
  }
  return client;
}
