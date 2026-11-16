import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import { addExercise, openPruebaMonday } from './program-helpers';

// Varios bloques en el editor (PR 2.16a), contra Supabase local.

const blocks = (page: Page) =>
  page.getByRole('list', { name: 'Blocks of the program' }).getByRole('button');
const days = (page: Page) =>
  page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button');

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
}

test('"Casa + Gym", con un solo bloque, no enseña la fila de bloques', async ({ page }) => {
  // Criterio 1.
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/programs');
  await page.getByRole('link', { name: 'Casa + Gym' }).click();
  await expect(days(page)).toHaveCount(7);
  await expect(page.getByRole('list', { name: 'Blocks of the program' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'No end date' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('añade bloques, les pone duración, los ordena y se guardan así', async ({ page }) => {
  await openPruebaMonday(page);
  await addExercise(page, 'lat pull', 'Lat pulldown');

  // Criterio 2: el primero dura 4 semanas; el segundo es una copia.
  await page.getByRole('button', { name: '4 weeks' }).click();
  await expect(page.getByText('28 days in total.')).toBeVisible();
  await page.getByRole('button', { name: 'Duplicate the last one' }).click();
  await expect(blocks(page)).toHaveText(['Block 14 weeks', 'Block 24 weeks']);
  await expect(blocks(page).nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(days(page).first()).toContainText('1 exercise · 3 sets');

  // Se le cambia un ejercicio al segundo; el primero no cambia.
  await days(page).first().click();
  await page.getByRole('button', { name: 'Replace: Lat pulldown' }).click();
  await page.getByLabel('Search by name').fill('leg press');
  await page
    .getByRole('list', { name: 'Replace “Lat pulldown”' })
    .getByRole('button', { name: /^Leg press ?Weight/ })
    .click();
  await save(page);

  // Criterio 3: un tercero, con un ciclo de 8 días y 2 vueltas: 16 días.
  await page.getByRole('button', { name: 'Empty block' }).click();
  await expect(blocks(page)).toHaveCount(3);
  await page.getByLabel('Days in the cycle').fill('8');
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.getByLabel('Rounds').fill('2');
  await expect(page.getByText('16 days in total.')).toBeVisible();

  // Criterio 4: sube al segundo puesto y, tras guardar y recargar, sigue ahí.
  await page.getByRole('button', { name: 'Move block 3 earlier' }).click();
  await expect(blocks(page)).toHaveText(['Block 14 weeks', 'Block 22 rounds', 'Block 34 weeks']);
  await save(page);
  await page.reload();
  await expect(blocks(page)).toHaveText(['Block 14 weeks', 'Block 22 rounds', 'Block 34 weeks']);

  // Cada bloque conserva lo suyo: el primero "Lat pulldown"; el tercero, "Leg press".
  await blocks(page).nth(0).click();
  await days(page).first().click();
  await expect(page.getByText('1. Lat pulldown', { exact: true })).toBeVisible();
  await blocks(page).nth(2).click();
  await days(page).first().click();
  await expect(page.getByText('1. Leg press', { exact: true })).toBeVisible();
});

test('en el móvil se añade un bloque y se quita con confirmación', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPruebaMonday(page);
  await page.getByRole('button', { name: '← Days' }).click();
  await page.getByRole('button', { name: 'Empty block' }).click();
  await expect(blocks(page)).toHaveCount(2);
  await page.getByRole('button', { name: 'Remove block 2' }).click();
  await expect(page.getByText('Remove block 2 with all its days and exercises?')).toBeVisible();
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page.getByRole('list', { name: 'Blocks of the program' })).toHaveCount(0);
});
