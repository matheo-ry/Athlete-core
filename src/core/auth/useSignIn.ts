import { useMutation } from '@tanstack/react-query';

import type { AuthResult } from './auth-types';
import { useAuth } from './useAuth';

interface SignInInput {
  email: string;
  password: string;
}

/** Entrar con email y contraseña. Devuelve el motivo si no se pudo (D-043). */
export function useSignIn() {
  const { service } = useAuth();
  return useMutation<AuthResult, Error, SignInInput>({
    mutationFn: ({ email, password }) => service.signInWithPassword(email, password),
  });
}
