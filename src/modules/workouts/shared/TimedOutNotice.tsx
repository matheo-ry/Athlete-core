import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { Button } from '@/core/ui';

import { useSetTimedOutNotice, useTimedOutNotice } from '../api/useTimedOutNotice';
import { weekdayName } from '../model/workout-timers';

/** "Guardamos tu entreno del lunes", al abrir la app tras cerrarse solo (D-119). */
export function TimedOutNotice() {
  const { t } = useTranslation();
  const language = useLanguage();
  const notice = useTimedOutNotice();
  const setNotice = useSetTimedOutNotice();
  if (!notice.data) {
    return null;
  }
  return (
    <div
      role="status"
      className="glass-float animate-enter fixed inset-x-4 top-[calc(5rem+var(--safe-top))] z-50 mx-auto flex max-w-lg flex-col gap-3 rounded-[1.6rem] p-5"
    >
      <p className="text-sm font-semibold">
        {t('workouts.timeout.saved', { day: weekdayName(notice.data.lastChangedAt, language) })}
      </p>
      <div>
        <Button
          onClick={() => {
            setNotice.mutate(null);
          }}
        >
          {t('workouts.sync.dismiss')}
        </Button>
      </div>
    </div>
  );
}
