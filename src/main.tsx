import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';
import { initI18n, loadModuleTranslations } from '@/core/i18n';
import { logger } from '@/core/lib';
import { registeredModules } from '@/modules';

import './index.css';

async function bootstrap(): Promise<void> {
  const container = document.getElementById('root');
  if (container === null) {
    throw new Error('Root element #root not found');
  }

  // Los textos tienen que estar cargados antes de pintar la primera pantalla.
  await initI18n();
  await loadModuleTranslations(registeredModules);

  createRoot(container).render(
    <StrictMode>
      <AppProviders>
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
