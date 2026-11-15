import { expect, test } from '@playwright/test';

import { signIn } from './helpers';

// Módulo exercises (PR 2.3), contra Supabase local y los 120 ejercicios de la
// plataforma que el seed reparte a cada negocio. Los tests que cambien
// ejercicios (PR 2.4) deben hacerlo en un negocio propio, no en Norte Strength.

test('el coach ve sus 120 ejercicios por orden alfabético, los busca y los filtra', async ({
  page,
}) => {
  await signIn(page, 'coach.norte@example.com');
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByRole('link', { name: 'Exercises' }).first().click();

  await expect(page).toHaveURL(/\/coach\/exercises$/);
  const rows = page.getByRole('listitem');
  await expect(rows).toHaveCount(120);
  await expect(rows.first()).toContainText('Ab wheel rollout');
  await expect(rows.last()).toContainText('Wrist curl');
  await expect(page.getByRole('button', { name: 'Active 120' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Archived 0' })).toBeVisible();

  await page.getByLabel('Search by name').fill('PULLDOWN');
  await expect(rows).toHaveText([
    /^Close-grip lat pulldown/,
    /^Lat pulldown/,
    /^Neutral-grip lat pulldown/,
  ]);

  await page.getByLabel('Search by name').fill('');
  await page.getByLabel('Muscle group').selectOption({ label: 'Chest' });
  await page.getByLabel('Equipment').selectOption({ label: 'Machine' });
  await expect(rows).toHaveCount(4);

  await page.getByLabel('Search by name').fill('zzzz');
  await expect(page.getByText('No exercise matches')).toBeVisible();
});

test('un cliente no ve "Ejercicios" y /coach/exercises lo devuelve a su zona', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('link', { name: 'Exercises' })).toHaveCount(0);

  await page.goto('/coach/exercises');
  await expect(page).toHaveURL(/\/client$/);
});
