import { use } from 'react';

import { HealthConsentPromptContext } from './health-consent-prompt-context';
import type { HealthConsentPromptValue } from './health-consent-prompt-context';

/** Pedir el consentimiento al ir a apuntar datos de salud (`ensure`) y el estado de la ventana. */
export function useHealthConsentPrompt(): HealthConsentPromptValue {
  const value = use(HealthConsentPromptContext);
  if (value === null) {
    throw new Error('useHealthConsentPrompt must be used inside <HealthConsentPromptProvider>');
  }
  return value;
}
