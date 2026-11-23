import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useOnlineStatus } from './useOnlineStatus';

/**
 * Franja fija "Sin conexión" (DECISIONES D-061). Lo ya cargado se sigue viendo;
 * los formularios avisan al enviar. Una píldora centrada, discreta pero visible.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }
  return (
    <div role="status" className="flex justify-center px-4 pt-2">
      <span className="bg-foreground text-background animate-rise inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg">
        <WifiOff aria-hidden="true" className="size-3.5" />
        {t('core.network.offline')}
      </span>
    </div>
  );
}
