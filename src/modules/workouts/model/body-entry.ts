// Lo que escribe el cliente al apuntar su peso o una medida (D-127), sin React.
// Aquí solo se lee el texto; los límites de cada dato están en `body-weight.ts`
// y `body-measurements.ts`, iguales a los de la base de datos.

/** Un número escrito con coma o punto ("82,5"); `null` si no es un número. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  return Number(normalized);
}

/** El día de hoy en la zona del usuario, como `2026-11-16` (el formato de un `date`). */
export function todayIso(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${String(now.getFullYear())}-${month}-${day}`;
}

export type EntryDateResult =
  { ok: true; date: string } | { ok: false; reason: 'invalid' | 'future' };

/** La fecha elegida: un día que existe y que no es futuro (se apunta lo que ya pasó). */
export function parseEntryDate(text: string, today: string): EntryDateResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match === null) {
    return { ok: false, reason: 'invalid' };
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  const exists =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  if (!exists) {
    return { ok: false, reason: 'invalid' };
  }
  return text > today ? { ok: false, reason: 'future' } : { ok: true, date: text };
}
