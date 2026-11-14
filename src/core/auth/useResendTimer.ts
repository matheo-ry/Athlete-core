import { useCallback, useEffect, useState } from 'react';

/** D-038: pasan 60 segundos entre un código por email y el siguiente. */
export const RESEND_WAIT_SECONDS = 60;

/**
 * Cuenta atrás para "Enviar otro código". Empieza al montarse, porque la
 * pantalla del código se ve justo después de mandar uno.
 */
export function useResendTimer(waitSeconds: number = RESEND_WAIT_SECONDS) {
  const [availableAt, setAvailableAt] = useState(() => Date.now() + waitSeconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (now >= availableAt) {
      return undefined;
    }
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [now, availableAt]);

  const restart = useCallback(() => {
    const start = Date.now();
    setAvailableAt(start + waitSeconds * 1000);
    setNow(start);
  }, [waitSeconds]);

  return { secondsLeft: Math.max(0, Math.ceil((availableAt - now) / 1000)), restart };
}
