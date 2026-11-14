import { expect, test } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';

// Test de humo: la app arranca de verdad en un navegador, sin errores, y cada
// usuario ve su zona con la marca de su negocio. Solo datos inventados
// (supabase/seed.sql). Desde el PR 1.4 el tenant y el rol son los reales.

test('la coach de Iron Lab entra en su zona, en rojo y con fondo oscuro, sin errores', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await signIn(page, 'coach.iron@example.com');
  // También es clienta de Norte Strength: elige dónde entrar (D-056).
  await chooseSpace(page, 'Iron Lab');

  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
  await expect(page.getByText('Iron Lab').first()).toBeVisible();
  const root = page.locator('html');
  await expect(root).toHaveAttribute('style', /--brand-primary: #dc2626;/);
  await expect(root).toHaveAttribute('style', /color-scheme: dark;/);
  expect(errors).toEqual([]);
});

test('la coach de Norte Strength ve su marca en verde azulado y con fondo claro', async ({
  page,
}) => {
  await signIn(page, 'coach.norte@example.com');

  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
  await expect(page.getByText('Norte Strength').first()).toBeVisible();
  const root = page.locator('html');
  await expect(root).toHaveAttribute('style', /--brand-primary: #0f766e;/);
  await expect(root).toHaveAttribute('style', /color-scheme: light;/);
});

test('una clienta entra en su zona con la marca de su coach y no puede abrir la de coach', async ({
  page,
}) => {
  await signIn(page, 'ana@example.com');

  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByText('Iron Lab').first()).toBeVisible();

  await page.goto('/coach');
  await expect(page).toHaveURL(/\/client$/);
});

test('un cliente de Norte Strength ve la marca de su coach', async ({ page }) => {
  await signIn(page, 'diego@example.com');

  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #0f766e;/);
});

test('el selector de idioma cambia entre inglés y español', async ({ page }) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Español' }).first().click();
  await expect(page.getByRole('heading', { name: 'Panel del coach' })).toBeVisible();

  await page.getByRole('button', { name: 'English' }).first().click();
  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
});

test('el módulo de ejemplo aparece en el menú y carga sus datos', async ({ page }) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');

  await page.getByRole('link', { name: 'Template' }).first().click();

  await expect(page).toHaveURL(/\/coach\/template$/);
  await expect(page.getByText('Back squat')).toBeVisible();
});
