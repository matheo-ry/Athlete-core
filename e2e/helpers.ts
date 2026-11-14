import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Ayudas comunes de los tests de extremo a extremo. Usan Supabase local con los
// usuarios inventados de supabase/seed.sql (todos con la contraseña password123).

export const SEED_PASSWORD = 'password123';

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
): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/**
 * Cierra la sesión (en inglés) desde donde está el botón: Ajustes en la zona de
 * coach, Perfil en la de cliente, o la propia pantalla de bienvenida o de
 * "ya no tienes acceso" (PR 1.13).
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
