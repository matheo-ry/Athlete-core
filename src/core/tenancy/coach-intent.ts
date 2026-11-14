// "¿Eres coach? Crea tu negocio" (D-037): la intención se recuerda en el
// dispositivo mientras se crea y se confirma la cuenta (7 días como máximo).
// Al terminar, la app lleva a crear el negocio aunque se haya cerrado entre medias.

const STORAGE_KEY = 'athlete-core.coachIntent';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function rememberCoachIntent(now: number = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(now));
  } catch {
    // Sin almacenamiento solo se pierde el atajo: "Crear mi negocio" sigue en la bienvenida.
  }
}

export function hasCoachIntent(now: number = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(at) && at > 0 && now - at <= MAX_AGE_MS;
  } catch {
    return false;
  }
}

export function clearCoachIntent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Igual que arriba.
  }
}
