// Las fechas se guardan en UTC (DECISIONES D-010) y se convierten a la zona del
// usuario solo al mostrarlas. Si no se pasa zona horaria, se usa la del dispositivo.

function toDate(value: Date | string): Date {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }
  return date;
}

/** Fecha corta, por ejemplo "Jan 15, 2026" o "15 ene 2026". */
export function formatDate(value: Date | string, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(toDate(value));
}

/** Fecha y hora, por ejemplo "Jan 15, 2026, 6:30 PM". */
export function formatDateTime(value: Date | string, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(toDate(value));
}

/** Día de la semana y fecha sin año, para cabeceras: "Sunday, November 22" o "domingo, 22 de noviembre". */
export function formatDayLabel(value: Date | string, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(toDate(value));
}
