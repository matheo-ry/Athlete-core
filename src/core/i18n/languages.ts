export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

function isLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Convierte lo que dice el dispositivo ("es-ES", "en-GB"...) en un idioma de la app. */
export function toLanguage(value: string | undefined): Language {
  const base = value?.toLowerCase().split('-')[0];
  return base !== undefined && isLanguage(base) ? base : DEFAULT_LANGUAGE;
}
