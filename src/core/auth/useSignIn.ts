import { useAuthAction } from './useAuthAction';

interface SignInInput {
  email: string;
  password: string;
}

/** Entrar con email y contraseña. Devuelve el motivo si no se pudo (D-043). */
export function useSignIn() {
  return useAuthAction<SignInInput>((service, { email, password }) =>
    service.signInWithPassword(email, password),
  );
}
