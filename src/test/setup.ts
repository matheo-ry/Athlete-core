import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

import { DEFAULT_LANGUAGE, i18n, initI18n } from '@/core/i18n';

// Se ejecuta antes de cada archivo de test.

// Los flujos largos (crear la cuenta, confirmar, unirse…) pasan por varias
// pantallas. Con todos los tests a la vez, alguna tarda más del segundo que
// Testing Library espera por defecto: 3 segundos evitan fallos por lentitud.
configure({ asyncUtilTimeout: 3000 });

beforeAll(async () => {
  await initI18n();
});

afterEach(async () => {
  cleanup();
  // Cada test empieza en inglés y sin nada guardado del test anterior.
  localStorage.clear();
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
});
