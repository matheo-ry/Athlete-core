/**
 * Las iniciales de un negocio, para cuando no tiene logo (D-057): "Norte
 * Strength" → "NS", "Iron Lab" → "IL", "ATHLETE CORE" → "AC".
 */
export function brandInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('');
  return initials.toUpperCase() || '?';
}
