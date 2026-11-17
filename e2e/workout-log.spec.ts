import { expect, test } from '@playwright/test';

import { signIn } from './helpers';

// Apuntar un entreno (PR 3.5a, D-119 y D-120), contra Supabase local y la
// rutina "Casa + Gym" de Ana (seed). En el navegador, con
// VITE_ALLOW_WEB_WORKOUTS (D-116), como en el CI.

test.describe.configure({ mode: 'serial' });

test('Ana inicia el lunes, apunta la serie 1 y la sigue viendo al recargar', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);

  // Criterio 1: "Hoy toca" lleva "Iniciar entreno" (si hoy no es descanso);
  // el lunes se empieza desde "Entreno".
  await page.getByRole('link', { name: 'Training' }).first().click();
  await page.getByRole('list', { name: 'Days of your program' }).getByRole('link').first().click();
  await page.getByRole('link', { name: 'Start workout' }).click();
  await page.getByRole('button', { name: 'Start workout' }).click();

  // Criterio 2: los 7 ejercicios y "0/20 series".
  await expect(page.getByText('0/20 sets')).toBeVisible();
  const exercises = page.getByRole('list', { name: 'Workout exercises' }).getByRole('link');
  await expect(exercises).toHaveCount(7);
  await exercises.first().click();
  await expect(page.getByRole('heading', { name: 'Flexiones con mochila' })).toBeVisible();
  await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
  const sets = page.getByRole('listitem', { name: /^Set \d$/ });
  await expect(sets).toHaveCount(3);

  // Criterio 3: el lastre con + y 12 repeticiones con el teclado. Ana ya hizo
  // este día (seed), así que el primer + pone lo gris de la vez anterior, no lo
  // prescrito (D-120, D-146). Lo gris llega después de pintar la pantalla: se
  // espera a que salga para no pulsar antes (con lo prescrito daba 10 o 0
  // según quién llegara primero). Con 0 kg de lastre, lo gris son solo las
  // repeticiones ("10 (1)"); con lastre, "2.5 × 12 (1)".
  const first = sets.first();
  await expect(first).toHaveAttribute('data-done', 'false');
  const previous = first.getByTestId('previous');
  await expect(previous).toBeVisible();
  const previousLoad = /^([\d.]+) × /.exec((await previous.textContent()) ?? '')?.[1] ?? '0';
  await first.getByRole('button', { name: 'Increase Added load (kg)' }).click();
  await expect(first.getByRole('textbox', { name: 'Added load (kg)' })).toHaveValue(previousLoad);
  await first.getByRole('textbox', { name: 'Reps' }).fill('12');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(first).toHaveAttribute('data-done', 'true');

  // Se guarda en el dispositivo al instante: al recargar sigue ahí.
  await page.reload();
  const again = page.getByRole('listitem', { name: 'Set 1' });
  await expect(again.getByRole('textbox', { name: 'Reps' })).toHaveValue('12');
  await expect(again).toHaveAttribute('data-done', 'true');

  await page.getByRole('link', { name: 'Back to summary' }).click();
  await expect(page.getByText('1/20 sets')).toBeVisible();
  await expect(page.getByRole('img', { name: '1 of 3 sets done' })).toBeVisible();

  // Terminar (el cierre completo llega en el PR 3.6): vuelve al inicio sin entreno abierto.
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page).toHaveURL(/\/client$/);
});

test('desmarcar, volver al mismo ejercicio al abrir y la vez anterior en gris (PR 3.5b)', async ({
  page,
}) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=1');
  await page.getByRole('button', { name: 'Start workout' }).click();
  const exercises = page.getByRole('list', { name: 'Workout exercises' }).getByRole('link');
  await exercises.nth(1).click();
  await expect(page.getByText('Exercise 2 of 7')).toBeVisible();

  // Criterio 4: apuntar y desmarcar.
  const first = page.getByRole('listitem', { name: 'Set 1' });
  await first.getByRole('textbox', { name: 'Reps' }).fill('9');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(first).toHaveAttribute('data-done', 'true');
  await first.getByRole('button', { name: 'Unmark set 1' }).click();
  await expect(first).toHaveAttribute('data-done', 'false');
  await first.getByRole('textbox', { name: 'Reps' }).fill('8');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');

  // "+ Serie".
  await page.getByRole('button', { name: '+ Set' }).click();
  await expect(page.getByRole('listitem', { name: /^Set \d$/ })).toHaveCount(4);

  // Criterio 6: al abrir la app, directo al mismo ejercicio, con lo apuntado.
  await page.goto('/client');
  await expect(page).toHaveURL(/\/client\/workout\?exercise=2$/);
  await expect(
    page.getByRole('listitem', { name: 'Set 1' }).getByRole('textbox', { name: 'Reps' }),
  ).toHaveValue('8');

  // Se termina: la próxima vez, en gris lo de hoy, y "Igual" lo copia (criterio 7).
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=1');
  await page.getByRole('button', { name: 'Start workout' }).click();
  await page.getByRole('list', { name: 'Workout exercises' }).getByRole('link').nth(1).click();
  const again = page.getByRole('listitem', { name: 'Set 1' });
  await expect(again.getByTestId('previous')).toHaveText(/(^| )8$/);
  await again.getByRole('button', { name: 'Same' }).click();
  await expect(again.getByRole('textbox', { name: 'Reps' })).toHaveValue('8');
  await expect(again).toHaveAttribute('data-done', 'true');
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
});

test('Bruno ve los pesos en libras (criterio 5)', async ({ page }) => {
  await signIn(page, 'bruno@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=1');
  await page.getByRole('button', { name: 'Start workout' }).click();
  await page.getByRole('list', { name: 'Workout exercises' }).getByRole('link').first().click();
  await expect(
    page.getByRole('listitem', { name: 'Set 1' }).getByRole('textbox', { name: 'Weight (lb)' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
});
