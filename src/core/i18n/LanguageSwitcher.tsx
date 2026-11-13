import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

import { SUPPORTED_LANGUAGES } from './languages';
import { useLanguage } from './useLanguage';

/** Botones para cambiar de idioma. La elección se recuerda en el dispositivo. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = useLanguage();

  return (
    <div role="group" aria-label={t('core.language.label')} className="flex gap-1">
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-pressed={language === current}
          onClick={() => void i18n.changeLanguage(language)}
          className={cn(
            'min-h-11 rounded-lg px-3 text-sm font-medium transition-colors',
            'focus-visible:outline-primary-readable focus-visible:outline-2 focus-visible:outline-offset-2',
            language === current
              ? 'bg-primary text-on-primary'
              : 'text-muted hover:bg-background hover:text-foreground',
          )}
        >
          {t(`core.language.${language}`)}
        </button>
      ))}
    </div>
  );
}
