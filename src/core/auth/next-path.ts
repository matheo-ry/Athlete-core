// Después de entrar se vuelve a la pantalla que se había pedido (D-056). Esa
// pantalla viaja en la dirección (`/login?next=/coach/clients`), así que es un
// dato de fuera: solo se acepta una ruta de la propia app. Si no, alguien podría
// mandar un enlace que, tras entrar, lleve a otra web.

const NEXT_PARAM = 'next';

/** Devuelve la ruta si es de la app (`/algo`), o `null`. */
export function safeNextPath(value: string | null): string | null {
  if (value === null || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }
  // Una ruta que lleve otra vez a entrar no tiene sentido como destino.
  if (value === '/login' || value.startsWith('/login?')) {
    return null;
  }
  return value;
}

/** La dirección de /login que, al entrar, vuelve a `path`. */
export function loginPathFor(path: string): string {
  const next = safeNextPath(path);
  if (next === null || next === '/') {
    return '/login';
  }
  return `/login?${new URLSearchParams({ [NEXT_PARAM]: next }).toString()}`;
}

/** Lee el destino guardado en la dirección actual. */
export function readNextPath(search: string): string | null {
  return safeNextPath(new URLSearchParams(search).get(NEXT_PARAM));
}
