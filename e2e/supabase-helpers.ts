import { readFileSync } from 'node:fs';

import { expect } from '@playwright/test';

// Ayudas para hablar con Supabase LOCAL desde los tests de extremo a extremo:
// crear una cuenta nueva y confirmada, y leer los códigos que llegan a la
// bandeja de pruebas (Mailpit). Solo la API pública y la clave pública local.

const MAILPIT = 'http://127.0.0.1:54324/api/v1';

function localEnv(): { url: string; key: string } {
  let text = '';
  try {
    text = readFileSync('.env.local', 'utf8');
  } catch {
    // Sin .env.local, la app tampoco arranca: el test fallará con un mensaje claro.
  }
  const read = (name: string) => new RegExp(`^${name}=(.+)$`, 'm').exec(text)?.[1]?.trim() ?? '';
  return { url: read('VITE_SUPABASE_URL'), key: read('VITE_SUPABASE_PUBLISHABLE_KEY') };
}

/** Un email inventado que no ha usado nadie, para que los tests no se pisen. */
export function uniqueEmail(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

interface MailpitMessage {
  ID: string;
  Subject: string;
  To: { Address: string }[];
}

/** Los emails que han llegado a una dirección, el más nuevo primero. */
export async function messagesFor(email: string): Promise<MailpitMessage[]> {
  const response = await fetch(`${MAILPIT}/search?query=${encodeURIComponent(`to:"${email}"`)}`);
  const body = (await response.json()) as { messages: MailpitMessage[] };
  return body.messages;
}

/**
 * El código de 6 dígitos del email más reciente a esa dirección. Espera a que
 * llegue (`count` = cuántos emails tiene que haber ya, para esperar al nuevo).
 */
export async function latestCode(email: string, count = 1): Promise<string> {
  let code = '';
  await expect
    .poll(
      async () => {
        const messages = await messagesFor(email);
        code = /\b(\d{6})\b/.exec(messages[0]?.Subject ?? '')?.[1] ?? '';
        return messages.length >= count && code !== '';
      },
      { timeout: 10_000 },
    )
    .toBe(true);
  return code;
}

export const E2E_PASSWORD = 'e2e-password-123';

/** Crea una cuenta nueva ya confirmada, como si se hubiera registrado desde la app. */
export async function createConfirmedUser(
  prefix: string,
  locale: 'en' | 'es' = 'en',
): Promise<string> {
  const { url, key } = localEnv();
  const email = uniqueEmail(prefix);
  const headers = { apikey: key, 'Content-Type': 'application/json' };

  const signup = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password: E2E_PASSWORD,
      data: { display_name: 'E2E Test', locale, weight_unit: 'kg', terms_version: 'draft-2026-11' },
    }),
  });
  expect(signup.ok).toBe(true);

  const token = await latestCode(email);
  const verify = await fetch(`${url}/auth/v1/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'signup', email, token }),
  });
  expect(verify.ok).toBe(true);
  return email;
}
