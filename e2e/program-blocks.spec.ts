import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import { addExercise, openPruebaMonday } from './program-helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  rpc,
  signInApi,
} from './supabase-helpers';

// Varios bloques en el editor (PR 2.16a), contra Supabase local.

const suffix = () => Date.now().toString().slice(-5);

/** La fecha del dispositivo dentro de N dias, AAAA-MM-DD. */
function localDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return String(date.getFullYear()) + '-' + month + '-' + String(date.getDate()).padStart(2, '0');
}

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

test('con dos bloques: "Bloque 1 de 2" en Asignadas, el cliente ve solo el suyo, y reiniciar desde el bloque 2 lo cambia', async ({
  page,
  browser,
}) => {
  const business = await createTestBusiness(`E2E Bloques ${suffix()}`);
  const clientEmail = await createJoinedClient(business.code);
  const client = await signInApi(clientEmail, E2E_PASSWORD);
  const block = (name: string, laps: number | null) => ({
    cycle_days: 2,
    laps,
    days: [
      { day_number: 1, kind: 'training', name, exercises: [] },
      { day_number: 2, kind: 'rest', exercises: [] },
    ],
  });
  const saved = (await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: { name: 'Dos bloques', blocks: [block('Fase A', 3), block('Fase B', null)] },
  })) as { id: string };
  const today = localDate(0);
  await rpc(business.coach, 'assign_program', {
    p_tenant: business.tenantId,
    p_template: saved.id,
    p_clients: [client.userId],
    p_starts_on: today,
    p_mode: 'calendar',
    p_today: today,
  });

  // Criterio 5: en "Asignadas", el bloque en que va y cuándo termina.
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  await page.getByRole('button', { name: 'Assigned' }).click();
  await expect(
    page.getByRole('list', { name: 'Clients and their programs' }).getByRole('listitem'),
  ).toContainText('Dos bloques · Block 1 of 2 · Round 1 of 3');

  // Criterio 6: la clienta ve los días del primer bloque y cuándo empieza el siguiente.
  const context = await browser.newContext();
  const clientPage = await context.newPage();
  await signIn(clientPage, clientEmail, '/login', E2E_PASSWORD);
  await clientPage.getByRole('link', { name: 'Training' }).first().click();
  await expect(clientPage.getByRole('link', { name: 'Day 1 · Fase A' })).toBeVisible();
  await expect(clientPage.getByText(/^The next block starts on /)).toBeVisible();
  await expect(clientPage.getByText('Fase B')).toHaveCount(0);

  // Criterio 7: el coach reinicia desde hoy en el bloque 2.
  await page.goto(`/coach/clients/${client.userId}`);
  await page.getByRole('button', { name: 'Restart from a date' }).click();
  await page.getByLabel('From block').selectOption({ label: 'Block 2' });
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Program restarted.');

  await clientPage.reload();
  await expect(clientPage.getByRole('link', { name: 'Day 1 · Fase B' })).toBeVisible();
  await expect(clientPage.getByText(/^The next block starts on /)).toHaveCount(0);
  await context.close();
});
