import { useMutation } from '@tanstack/react-query';

import { logger } from '../lib';
import type { AuthResult, AuthService } from './auth-types';
import { useAuth } from './useAuth';

/**
 * Una acción de cuenta (entrar, mandar un código, cambiar la contraseña…) con
 * su estado de "enviando" (D-061: el botón se desactiva mientras tanto).
 * - Sin conexión no se intenta: el motivo es 'offline'.
 * - Un error inesperado no rompe la pantalla: el motivo es 'unknown'.
 */
export function useAuthAction<TInput>(
  run: (service: AuthService, input: TInput) => Promise<AuthResult>,
) {
  const { service } = useAuth();
  return useMutation<AuthResult, Error, TInput>({
    mutationFn: async (input) => {
      if (!navigator.onLine) {
        return { ok: false, reason: 'offline' };
      }
      try {
        return await run(service, input);
      } catch (error) {
        logger.error('Auth: unexpected error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        return { ok: false, reason: 'unknown' };
      }
    },
  });
}
