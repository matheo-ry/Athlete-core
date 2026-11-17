import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@/app/providers';
import { createAppQueryClient } from '@/app/query-client';
import { AppRouter } from '@/app/router';
import { initI18n, loadModuleTranslations } from '@/core/i18n';
import { logger } from '@/core/lib';
import { startNativeShell } from '@/core/native';
import { registeredModules } from '@/modules';

import './index.css';

async function bootstrap(): Promise<void> {
  const container = document.getElementById('root');
  if (container === null) {
    throw new Error('Root element #root not found');
  }

  // En la app del móvil: botón "atrás" y barra de estado. En el navegador, nada.
  startNativeShell();

  // Los textos tienen que estar cargados antes de pintar la primera pantalla.
  await initI18n();
  await loadModuleTranslations(registeredModules);
  // En la app del móvil, con lo que ya estaba guardado en el teléfono (D-118).
  const queryClient = await createAppQueryClient();

  createRoot(container).render(
    <StrictMode>
      <AppProviders queryClient={queryClient}>
        <AppRouter />
      </AppProviders>
    </StrictMode>,
  );
}

bootstrap().catch((error: unknown) => {
  logger.error('App failed to start', {
    message: error instanceof Error ? error.message : 'Unknown error',
  });
});
