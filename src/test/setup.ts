import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

import { DEFAULT_LANGUAGE, i18n, initI18n } from '@/core/i18n';

// Se ejecuta antes de cada archivo de test.

beforeAll(async () => {
  await initI18n();
});

afterEach(async () => {
  cleanup();
  // Cada test empieza en inglés y sin nada guardado del test anterior.
  localStorage.clear();
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
});
