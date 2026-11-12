type ClassValue = string | false | null | undefined;

/** Une clases de Tailwind ignorando las que no aplican (false, null, undefined). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
