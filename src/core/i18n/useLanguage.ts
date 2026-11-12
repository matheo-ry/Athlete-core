import { useTranslation } from 'react-i18next';

import { toLanguage } from './languages';
import type { Language } from './languages';

/** Idioma en el que se está mostrando la app. Sirve también para formatear números y fechas. */
export function useLanguage(): Language {
  const { i18n } = useTranslation();
  return toLanguage(i18n.resolvedLanguage);
}
