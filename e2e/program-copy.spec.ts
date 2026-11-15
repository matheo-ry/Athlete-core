import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { addExercise, items, openPruebaMonday } from './program-helpers';

// Copiar y duplicar (PR 2.11), contra Supabase local, en un negocio propio.

const days = (page: Page) =>
  page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button');

async function save(page: Page) {
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
}

/** "Prueba" con el lunes "Torso", en casa, y un ejercicio de 3 series de 10. */
async function prepareMonday(page: Page) {
  await openPruebaMonday(page);
  await page.getByLabel('Name (optional)').fill('Torso');
  await page.getByLabel('Place (optional)').fill('Casa');
  await addExercise(page, 'lat pull', 'Lat pulldown');
  await page
    .getByRole('group', { name: 'What to do in “Lat pulldown”' })
    .getByLabel('Reps')
    .fill('10');
}

test('duplica un ejercicio y un día, pega el día en otra rutina y duplica la plantilla', async ({
  page,
}) => {
  await prepareMonday(page);

  // Criterio 1: el ejercicio duplicado aparece debajo, con las mismas series.
  await page.getByRole('button', { name: 'Duplicate: Lat pulldown' }).click();
  await expect(items(page)).toHaveText([/^1\. Lat pulldown3 × 10/, /^2\. Lat pulldown3 × 10/]);

  // Criterio 2: el jueves queda igual que el lunes.
  await page.getByLabel('Duplicate this day to').selectOption({ label: 'Thursday' });
  await page.getByRole('button', { name: 'Duplicate day' }).click();
  await expect(page.getByText('Thursday is now a copy.')).toBeVisible();
  await expect(days(page).nth(3)).toContainText('ThursdayTorso · Casa · 2 exercises · 6 sets');

  // Criterio 3: si el destino ya tiene ejercicios, pregunta antes.
  await page.getByRole('button', { name: 'Duplicate day' }).click();
  await expect(
    page.getByText('Thursday already has 2 exercises. They will be replaced.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Yes, replace' }).click();

  // Criterio 4: se copia el lunes y se pega en el viernes de otra rutina.
  await page.getByRole('button', { name: 'Copy day' }).click();
  await save(page);
  await page.getByRole('link', { name: '← Programs' }).click();
  await page.getByRole('button', { name: 'New template' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Otra');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: 'Otra', level: 1 })).toBeVisible();
  await days(page).nth(4).click();
  await expect(page.getByRole('heading', { name: 'Friday', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Paste the copied day here' }).click();
  await save(page);
  await page.reload();
  await expect(days(page).nth(4)).toContainText('FridayTorso · Casa · 2 exercises · 6 sets');

  // Criterio 5: duplicar la plantilla crea "Copy of Prueba" con los mismos días.
  await page.getByRole('link', { name: '← Programs' }).click();
  await page.getByRole('button', { name: 'Duplicate: Prueba' }).click();
  await expect(page.getByRole('status')).toHaveText('“Copy of Prueba” created.');
  await page.getByRole('link', { name: 'Copy of Prueba' }).click();
  await expect(days(page).nth(0)).toContainText('MondayTorso · Casa · 2 exercises · 6 sets');
  await expect(days(page).nth(3)).toContainText('ThursdayTorso · Casa · 2 exercises · 6 sets');

  // Cambiar la copia no cambia la original.
  await days(page).nth(3).click();
  await expect(page.getByRole('heading', { name: 'Thursday', level: 2 })).toBeVisible();
  await page.getByLabel('Name (optional)').fill('Pierna');
  await save(page);
  await page.getByRole('link', { name: '← Programs' }).click();
  await page.getByRole('link', { name: 'Prueba', exact: true }).click();
  await expect(days(page).nth(3)).toContainText('ThursdayTorso');
});

test('en el móvil se duplica un día en otro y se pega un ejercicio copiado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareMonday(page);
  await page.getByRole('button', { name: 'Copy: Lat pulldown' }).click();
  await page.getByLabel('Duplicate this day to').selectOption({ label: 'Thursday' });
  await page.getByRole('button', { name: 'Duplicate day' }).click();
  await expect(page.getByText('Thursday is now a copy.')).toBeVisible();

  await page.getByRole('button', { name: '← Days' }).click();
  await days(page).nth(3).click();
  await expect(page.getByRole('heading', { name: 'Thursday', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Paste exercise' }).click();
  await expect(items(page)).toHaveText([/^1\. Lat pulldown3 × 10/, /^2\. Lat pulldown3 × 10/]);
  await save(page);
});
