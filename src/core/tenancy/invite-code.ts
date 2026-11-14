// El código de invitación de un coach (DECISIONES D-050). Lógica pura.
//
// - Lo generan 8 caracteres sin los que se confunden (0, O, 1, I, L), pero la
//   base de datos acepta de 6 a 10 letras y números: los códigos del seed
//   (IRONLAB1, NORTE001) siguen valiendo.
// - Al escribirlo no importan las mayúsculas, los espacios ni los guiones.
// - Se muestra en dos grupos de cuatro: "K7M4 9XQ2".

const INVITE_CODE_PATTERN = /^[A-Z0-9]{6,10}$/;

/** Mayúsculas, sin espacios ni guiones: "k7m4-9xq2 " → "K7M49XQ2". */
export function normalizeInviteCode(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, '');
}

/** ¿Tiene forma de código? (No dice si existe: eso lo sabe la base de datos.) */
export function isInviteCodeFormat(value: string): boolean {
  return INVITE_CODE_PATTERN.test(normalizeInviteCode(value));
}

/** El código que llega en un enlace (`/join?code=…`), ya limpio, o '' si no vale. */
export function parseInviteCodeParam(value: string | null): string {
  if (value === null) {
    return '';
  }
  const code = normalizeInviteCode(value);
  return INVITE_CODE_PATTERN.test(code) ? code : '';
}

/** En grupos de cuatro, para leerlo y dictarlo mejor. */
export function formatInviteCode(code: string): string {
  return normalizeInviteCode(code).replace(/(.{4})(?=.)/g, '$1 ');
}
