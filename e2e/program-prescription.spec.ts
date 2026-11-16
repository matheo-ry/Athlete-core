import { expect, test } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import { addExercise, items, openPruebaMonday } from './program-helpers';

// Series y prescripción del editor (PR 2.10), contra Supabase local.

test('el miércoles de "Casa + Gym" se lee en una línea, y las series distintas aparecen desplegadas', async ({
  page,
}) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/programs');
  await page.getByRole('link', { name: 'Casa + Gym' }).click();
  await page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').nth(2).click();
  await expect(page.getByRole('heading', { name: 'Wednesday', level: 2 })).toBeVisible();

  await expect(items(page).nth(4)).toContainText('5. Machine preacher curl2 × 8-12 · RIR 1 · 2:00');

  const gironda = page.getByRole('group', { name: 'What to do in “Remo Gironda agarre amplio”' });
  await expect(items(page).first()).toContainText('1 × 6-8 · RIR 1 + 2 × 10-12 · RIR 0 · 2:00');
  await expect(gironda.getByRole('group', { name: 'Set 1' }).getByLabel('Reps')).toHaveValue('6-8');
  await expect(gironda.getByRole('group', { name: 'Set 2' }).getByLabel('Reps')).toHaveValue(
    '10-12',
  );
  await expect(gironda.getByRole('group', { name: 'Set 3' }).getByLabel('Reps')).toHaveValue(
    '10-12',
  );

  // La última serie de "Leg extension", al fallo.
  await expect(items(page).nth(5)).toContainText('1 × 8-12 · RIR 1 + 1 × 8-12 · To failure · 2:00');
});

test('escribe 4 series de 10 con 1:30 de descanso, guarda, y después pone la última al fallo', async ({
  page,
}) => {
  await openPruebaMonday(page);
  await addExercise(page, 'lat pull', 'Lat pulldown');
  const editor = page.getByRole('group', { name: 'What to do in “Lat pulldown”' });

  await editor.getByLabel('Sets').selectOption('4');
  await editor.getByLabel('Reps').fill('10');
  await editor.getByRole('button', { name: '1:30' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');

  await page.reload();
  await page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').first().click();
  await expect(items(page).first()).toContainText('1. Lat pulldown4 × 10 · 1:30');
  await expect(editor.getByLabel('Reps')).toHaveValue('10');

  // Criterio 4: se despliega y la última serie pasa a "Al fallo".
  await editor.getByRole('button', { name: 'Different sets' }).click();
  await editor
    .getByRole('group', { name: 'Set 4' })
    .getByLabel('Intensity')
    .selectOption('To failure');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
  await expect(items(page).first()).toContainText('3 × 10 + 1 × 10 · To failure · 1:30');

  // Criterio 8: no hay forma de poner 11 series.
  await expect(editor.getByLabel('Sets').getByRole('option')).toHaveCount(10);

  // Criterio 7: un ejercicio de tiempo pide segundos.
  await addExercise(page, 'plank', 'Plank');
  const plank = page.getByRole('group', { name: 'What to do in “Plank”' });
  await expect(plank.getByLabel('Reps')).toHaveCount(0);
  await plank.getByLabel('Seconds').fill('45');
  await expect(items(page).nth(1)).toContainText('2. Plank3 × 45 s');
});
