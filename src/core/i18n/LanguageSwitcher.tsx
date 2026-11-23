import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

import { SUPPORTED_LANGUAGES } from './languages';
import { useLanguage } from './useLanguage';

/** Botones para cambiar de idioma. La elección se recuerda en el dispositivo. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('core.language.label')}
      className="bg-glass flex gap-1 self-start rounded-full p-1 shadow-[inset_0_0_0_1px_var(--color-hairline)]"
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-pressed={language === current}
          onClick={() => void i18n.changeLanguage(language)}
          className={cn(
            'min-h-10 rounded-full px-4 text-sm font-medium transition-[color,background-color] duration-300',
            'focus-visible:outline-primary-readable focus-visible:outline-2 focus-visible:outline-offset-2',
            language === current
              ? 'bg-glass-strong text-foreground shadow-[var(--glass-edge)]'
              : 'text-muted hover:text-foreground',
          )}
        >
          {t(`core.language.${language}`)}
        </button>
      ))}
    </div>
  );
}
