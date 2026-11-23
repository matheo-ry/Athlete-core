import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

import { SUPPORTED_LANGUAGES } from './languages';
import { useLanguage } from './useLanguage';

/**
 * Selector de idioma: dos segmentos con el código, "EN" y "ES". El nombre
 * completo va como etiqueta accesible. La elección se recuerda en el dispositivo.
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('core.language.label')}
      className="surface-raised flex gap-0.5 rounded-full p-0.5"
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-label={t(`core.language.${language}`)}
          aria-pressed={language === current}
          onClick={() => void i18n.changeLanguage(language)}
          className={cn(
            'focus-ring numeric min-h-11 min-w-11 rounded-full px-3 text-xs font-semibold uppercase transition-colors',
            language === current
              ? 'bg-primary text-on-primary'
              : 'text-muted hover:text-foreground',
          )}
        >
          {language}
        </button>
      ))}
    </div>
  );
}
