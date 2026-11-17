import { expect, test } from '@playwright/test';

import { signIn } from './helpers';

// Apuntar un entreno (PR 3.5a, D-119 y D-120), contra Supabase local y la
// rutina "Casa + Gym" de Ana (seed). En el navegador, con
// VITE_ALLOW_WEB_WORKOUTS (D-116), como en el CI.

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

  // Criterio 3: 10 kg de lastre con + (lo prescrito) y 12 repeticiones con el teclado.
  const first = sets.first();
  await expect(first).toHaveAttribute('data-done', 'false');
  await first.getByRole('button', { name: 'Increase Added load (kg)' }).click();
  await expect(first.getByRole('textbox', { name: 'Added load (kg)' })).toHaveValue('10');
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
