import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useOnlineStatus } from './useOnlineStatus';

/**
 * Franja fija "Sin conexión" (DECISIONES D-061). Lo ya cargado se sigue viendo;
 * los formularios avisan al enviar.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }
  return (
    <div
      role="status"
      className="bg-foreground text-background sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
    >
      <WifiOff aria-hidden="true" className="size-4" />
      {t('core.network.offline')}
    </div>
  );
}
