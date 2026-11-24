import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Ayudas comunes de los tests de extremo a extremo. Usan Supabase local con los
// usuarios inventados de supabase/seed.sql (todos con la contraseña password123).

export const SEED_PASSWORD = 'password123';

/**
 * Un cliente sin el permiso de datos de salud ve la ventana del consentimiento
 * al entrar (D-126) y tapa lo que hay debajo. Los tests que no hablan de ella
 * la cierran con "Not now", igual que haría un usuario con prisa, en cuanto
 * sale y antes de cada clic.
 */
async function dismissHealthConsentPrompt(page: Page): Promise<void> {
  await page.addLocatorHandler(
    page.getByRole('dialog', { name: /^(Your health data|Tus datos de salud)$/ }),
    (dialog) => dialog.getByRole('button', { name: /^(Not now|Ahora no)$/ }).click(),
  );
}

interface SignInOptions {
  /** `true` si el test quiere ver la ventana del consentimiento (por defecto se cierra sola). */
  showHealthConsentPrompt?: boolean;
}

/**
 * Entra desde la pantalla de /login (por defecto, con la contraseña del seed) y
 * espera a estar dentro: si después el test recarga la página, la sesión ya
 * está guardada.
 */
export async function signIn(
  page: Page,
  email: string,
  path = '/login',
  password = SEED_PASSWORD,
  options: SignInOptions = {},
): Promise<void> {
  if (options.showHealthConsentPrompt !== true) {
    await dismissHealthConsentPrompt(page);
  }
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/**
 * Con varios espacios y ninguno elegido en este navegador, la app pregunta
 * dónde entrar (D-056): se elige uno por el nombre del negocio. Le pasa, por
 * ejemplo, a coach.iron@example.com, dueña de Iron Lab y clienta de Norte.
 */
export async function chooseSpace(page: Page, businessName: string): Promise<void> {
  await expect(page).toHaveURL(/\/select$/);
  await page.getByRole('button', { name: new RegExp(businessName) }).click();
  await expect(page).not.toHaveURL(/\/select$/);
}

/**
 * Cierra la sesión (en inglés) desde donde está el botón: Ajustes en la zona de
 * coach, Perfil en la de cliente, o la propia pantalla de bienvenida, de
 * "ya no tienes acceso" o del selector de espacio (PR 1.13 y 1.14).
 */
export async function signOut(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForURL((url) => url.pathname !== '/');
  const { pathname } = new URL(page.url());
  if (pathname.startsWith('/coach')) {
    await page.goto('/coach/settings');
  } else if (pathname.startsWith('/client')) {
    await page.goto('/client/profile');
  }
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
}
