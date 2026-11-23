import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useOnlineStatus } from './useOnlineStatus';

/**
 * Aviso fijo "Sin conexión" (DECISIONES D-061): una píldora de cristal arriba.
 * Lo ya cargado se sigue viendo; los formularios avisan al enviar.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }
  return (
    <div role="status" className="flex justify-center px-4 pt-2">
      <p className="glass-float text-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
        <WifiOff aria-hidden="true" className="size-4" />
        {t('core.network.offline')}
      </p>
    </div>
  );
}
