import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Ayudas comunes de los tests de extremo a extremo. Usan Supabase local con los
// usuarios inventados de supabase/seed.sql (todos con la contraseña password123).

export const SEED_PASSWORD = 'password123';

/**
 * Entra con un usuario del seed desde la pantalla de /login y espera a estar
 * dentro: si después el test recarga la página, la sesión ya está guardada.
 */
export async function signIn(page: Page, email: string, path = '/login'): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
