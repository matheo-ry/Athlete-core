import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { signIn } from './helpers';
import { E2E_PASSWORD, createJoinedClient, createTestBusiness, rpc } from './supabase-helpers';

// Lo que ve el cliente de su rutina (PR 2.15), contra Supabase local y las
// rutinas asignadas del seed (PR 2.12).

const suffix = () => Date.now().toString().slice(-5);

/** Entra y abre "Entreno". Carla usa la app en español (seed). */
async function openTraining(page: Page, email: string, label = 'Training') {
  await signIn(page, email);
  await expect(page).toHaveURL(/\/client$/);
  await page.getByRole('link', { name: label }).first().click();
  await expect(page.getByRole('heading', { name: label, level: 1 })).toBeVisible();
}

test('Ana ve "Hoy toca" de "Casa + Gym", abre el miércoles y un ejercicio, todo en lectura', async ({
  page,
}) => {
  await openTraining(page, 'ana@example.com');

  // Criterio 1: los siete días; hoy es el día de la semana del dispositivo.
  const days = page.getByRole('list', { name: 'Days of your program' }).getByRole('link');
  await expect(days).toHaveCount(7);
  // "Casa + Gym": descanso el martes, el jueves y el domingo.
  const isRest = [0, 2, 4].includes(new Date().getDay());
  await expect(
    page.getByRole('main').getByText(isRest ? 'Today: rest' : 'Today', { exact: true }),
  ).toBeVisible();

  // Criterio 2.
  await days.nth(2).click();
  const exercises = page.getByRole('list', { name: 'Exercises of the day' }).getByRole('link');
  await expect(exercises).toHaveCount(8);
  await expect(exercises.first()).toContainText('1. Remo Gironda agarre amplio');

  // Criterio 3.
  await exercises.first().click();
  await expect(page.getByRole('heading', { name: 'Remo Gironda agarre amplio' })).toBeVisible();
  const sets = page.getByRole('list', { name: 'Sets' }).getByRole('listitem');
  await expect(sets).toHaveCount(3);
  await expect(sets.nth(0)).toContainText('Set 1: 6-8');
  await expect(sets.nth(1)).toContainText('Set 2: 10-12');
  await expect(sets.nth(2)).toContainText('Set 3: 10-12');

  // Criterio 7: nada que editar ni apuntar.
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Edit|Save|Log|Start/ })).toHaveCount(0);

  // Criterio 8 (kilos): el lastre de "Flexiones con mochila", el lunes.
  await page.getByRole('link', { name: '← Day' }).click();
  await page.getByRole('link', { name: '← Training' }).click();
  await days.nth(0).click();
  await expect(
    page.getByRole('list', { name: 'Exercises of the day' }).getByRole('link').first(),
  ).toContainText('10 kg');
});

test('Diego, en modo lista, ve sus días de entreno en orden y sin "Hoy toca"', async ({ page }) => {
  await openTraining(page, 'diego@example.com');
  // Criterio 4: "Fuerza básica" entrena el lunes, el miércoles y el viernes.
  await expect(page.getByText('Your training days')).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Days of your program' }).getByRole('link'),
  ).toHaveCount(3);
  await expect(page.getByRole('main').getByText('Today', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('main').getByText('Today: rest')).toHaveCount(0);
});

test('Carla no tiene rutina', async ({ page }) => {
  // Criterio 5, en español.
  await openTraining(page, 'carla@example.com', 'Entreno');
  await expect(page.getByText('Tu coach aún no te ha asignado una rutina')).toBeVisible();
});

test('Elena ve "Tu rutina empieza el…"', async ({ page }) => {
  // Criterio 6.
  await openTraining(page, 'elena@example.com');
  await expect(page.getByText(/^Your program starts on /)).toBeVisible();
});

test('el coach asigna una plantilla y la clienta la ve al entrar', async ({ page, browser }) => {
  const business = await createTestBusiness(`E2E Entreno ${suffix()}`);
  const clientEmail = await createJoinedClient(business.code);
  await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: {
      name: 'Mi primera rutina',
      blocks: [
        {
          cycle_days: 2,
          laps: null,
          days: [
            { day_number: 1, kind: 'training', name: 'Torso', exercises: [] },
            { day_number: 2, kind: 'training', name: 'Pierna', exercises: [] },
          ],
        },
      ],
    },
  });

  // El coach asigna desde la lista de plantillas.
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  await page.getByRole('button', { name: 'Assign: Mi primera rutina' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: /E2E Test/ }).check();
  await dialog.getByRole('button', { name: 'Assign to 1 client' }).click();
  await expect(page.getByRole('status')).toHaveText('“Mi primera rutina” assigned.');

  // La clienta entra en otro navegador y la ve.
  const context = await browser.newContext();
  const clientPage = await context.newPage();
  await signIn(clientPage, clientEmail, '/login', E2E_PASSWORD);
  await expect(clientPage).toHaveURL(/\/client$/);
  await clientPage.getByRole('link', { name: 'Training' }).first().click();
  await expect(clientPage.getByText('Mi primera rutina')).toBeVisible();
  // Empieza hoy: el día 1 del ciclo.
  await expect(clientPage.getByRole('link', { name: 'Day 1 · Torso' })).toBeVisible();
  await context.close();
});
