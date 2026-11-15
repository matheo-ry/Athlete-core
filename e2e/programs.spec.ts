import { expect, test } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import { E2E_PASSWORD, createTestBusiness } from './supabase-helpers';

// Módulo programs (PR 2.7), contra Supabase local y las plantillas del seed.
// Los tests que cambian plantillas lo hacen en un negocio propio.

const suffix = () => Date.now().toString().slice(-5);

test('el coach ve "Programs" entre "Clients" y "Exercises", con las dos plantillas de Iron Lab', async ({
  page,
}) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  const nav = page.getByRole('navigation').first();
  await expect(nav.getByRole('link')).toContainText(['Clients', 'Programs', 'Exercises']);
  await nav.getByRole('link', { name: 'Programs' }).click();

  await expect(page).toHaveURL(/\/coach\/programs$/);
  const rows = page.getByRole('listitem');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Casa + Gym');
  await expect(rows.first()).toContainText('Weekly · 4 training days');
  await expect(rows.last()).toContainText('Pecho / Espalda y Brazo / Pierna');
  await expect(rows.last()).toContainText('8-day cycle · 4 training days');
});

test('cada coach solo ve sus plantillas', async ({ page }) => {
  await signIn(page, 'coach.norte@example.com');
  await page.goto('/coach/programs');

  const rows = page.getByRole('listitem');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Fuerza básica');
});

test('un cliente no ve "Programs" y /coach/programs lo devuelve a su zona', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('link', { name: 'Programs' })).toHaveCount(0);

  await page.goto('/coach/programs');
  await expect(page).toHaveURL(/\/client$/);
});

test('un negocio nuevo no tiene plantillas; crea una, la renombra, la archiva y la recupera', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Rutinas ${suffix()}`);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  await expect(page.getByText("You don't have any templates yet")).toBeVisible();

  await page.getByRole('button', { name: 'New template' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Prueba');
  await page.getByLabel('Days in the cycle').fill('10');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('status')).toHaveText('“Prueba” created.');
  await expect(page.getByRole('listitem')).toContainText('10-day cycle · 0 training days');

  await page.getByRole('button', { name: 'Rename: Prueba' }).click();
  await page.getByLabel('New name for “Prueba”').fill('Prueba 2');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Renamed to “Prueba 2”.');
  await page.reload();
  await expect(page.getByRole('listitem')).toContainText('Prueba 2');

  await page.getByRole('button', { name: 'Archive: Prueba 2' }).click();
  await expect(page.getByRole('button', { name: 'Active 0' })).toBeVisible();
  await page.getByRole('button', { name: 'Archived 1' }).click();
  await page.getByRole('button', { name: 'Recover: Prueba 2' }).click();
  await expect(page.getByRole('button', { name: 'Active 1' })).toBeVisible();
});
