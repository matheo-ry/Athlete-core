import { createContext } from 'react';

/** Qué le pasa a la ventana del consentimiento. La pinta quien la monta (`app/client`). */
export interface HealthConsentDialogState {
  isOpen: boolean;
  /** Dando el permiso: los botones esperan. */
  isPending: boolean;
  /** Por qué no se pudo dar (sin conexión o un error), si falló. */
  failure: 'offline' | 'error' | null;
  /** "Acepto". Si sale bien, se cierra sola. */
  accept: () => void;
  /** "Ahora no" (o Escape): se cierra y no vuelve a salir sola en este dispositivo. */
  decline: () => void;
}

export interface HealthConsentPromptValue {
  /**
   * Para quien va a apuntar peso, medidas o notas (D-126): si el consentimiento
   * ya está dado, `true` al instante; si no, enseña la ventana y espera. `true`
   * si el cliente acepta, `false` si dice "Ahora no".
   */
  ensure: () => Promise<boolean>;
  dialog: HealthConsentDialogState;
}

export const HealthConsentPromptContext = createContext<HealthConsentPromptValue | null>(null);
