import { createInstance } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, toLanguage } from './languages';
import type { Language } from './languages';
import en from './locales/en.json';
import es from './locales/es.json';

// Todos los textos viven en un solo espacio ("translation") con claves
// `modulo.zona.elemento`. Los textos comunes están en ./locales; los de cada
// módulo se añaden con `loadModuleTranslations` bajo la clave del módulo.
const NAMESPACE = 'translation';
const LANGUAGE_STORAGE_KEY = 'athlete-core.language';

export const i18n = createInstance();

let initialization: Promise<void> | null = null;

/** Arranca i18next una sola vez. El idioma inicial sale del dispositivo. */
export function initI18n(): Promise<void> {
  initialization ??= i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { [NAMESPACE]: en },
        es: { [NAMESPACE]: es },
      },
      supportedLngs: [...SUPPORTED_LANGUAGES],
      fallbackLng: DEFAULT_LANGUAGE,
      // "es-ES" o "en-GB" se tratan como "es" y "en".
      load: 'languageOnly',
      defaultNS: NAMESPACE,
      interpolation: { escapeValue: false }, // React ya escapa el texto
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      },
    })
    .then(() => {
      const syncDocumentLanguage = (language: string) => {
        document.documentElement.lang = toLanguage(language);
      };
      syncDocumentLanguage(i18n.language);
      i18n.on('languageChanged', syncDocumentLanguage);
    });
  return initialization;
}

export type TranslationLoader = () => Promise<{ default: Record<string, unknown> }>;

export type ModuleTranslations = Record<Language, TranslationLoader>;

export interface TranslationSource {
  /** Clave del módulo: sus textos quedan bajo `<key>.…`. */
  key: string;
  i18n: ModuleTranslations;
}

/** Carga los textos de cada módulo, en todos los idiomas, bajo su clave. */
export async function loadModuleTranslations(sources: readonly TranslationSource[]): Promise<void> {
  await Promise.all(
    sources.flatMap((source) =>
      SUPPORTED_LANGUAGES.map(async (language) => {
        const messages = await source.i18n[language]();
        i18n.addResourceBundle(language, NAMESPACE, { [source.key]: messages.default }, true, true);
      }),
    ),
  );
}
