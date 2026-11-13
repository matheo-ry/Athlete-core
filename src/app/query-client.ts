import { QueryCache, QueryClient } from '@tanstack/react-query';

import { logger } from '@/core/lib';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      // Todo fallo al pedir datos queda registrado en un solo sitio. Al usuario
      // se le enseña el estado de error traducido de cada pantalla.
      onError: (error, query) => {
        logger.error('Query failed', { queryKey: query.queryKey, message: error.message });
      },
    }),
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  });
}
