import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  localEnv,
  rpc,
  signInApi,
} from './supabase-helpers';

// Asignar una plantilla (PR 2.13a), contra Supabase local, en un negocio
// propio para no cambiar las rutinas de ejemplo del seed.

const suffix = () => Date.now().toString().slice(-5);

/** Una clienta nueva del negocio, con un nombre que se distinga en pantalla. */
async function joinedClient(code: string, name: string): Promise<void> {
  const email = await createJoinedClient(code);
  const session = await signInApi(email, E2E_PASSWORD);
  const { url, key } = localEnv();
  const response = await fetch(`${url}/rest/v1/profiles?user_id=eq.${session.userId}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ display_name: name }),
  });
  expect(response.ok).toBe(true);
}

/** Una plantilla semanal de 4 vueltas con el lunes de entreno, creada por la API. */
const template = (name: string) => ({
  name,
  blocks: [
    {
      cycle_days: 7,
      laps: 4,
      days: Array.from({ length: 7 }, (_, index) => ({
        day_number: index + 1,
        kind: index === 0 ? 'training' : 'rest',
        exercises: [],
      })),
    },
  ],
});

/** La fecha de dentro de `days` días en el dispositivo, "AAAA-MM-DD". */
function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${String(date.getFullYear())}-${month}-${String(date.getDate()).padStart(2, '0')}`;
}

async function openAssign(page: Page, name: string): Promise<Locator> {
  await page.getByRole('button', { name: `Assign: ${name}` }).click();
  const dialog = page.getByRole('dialog', { name: `Assign “${name}”` });
  await expect(dialog.getByRole('checkbox').first()).toBeVisible();
  return dialog;
}

async function assign(page: Page, dialog: Locator, clients: string[], count: string) {
  for (const client of clients) {
    await dialog.getByRole('checkbox', { name: new RegExp(client) }).check();
  }
  await dialog.getByRole('button', { name: count }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('asigna una plantilla, avisa de lo que se sustituye y deja la próxima para más adelante', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Asignar ${suffix()}`);
  await joinedClient(business.code, 'Ana Asignar');
  await joinedClient(business.code, 'Bruno Asignar');
  await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: template('Casa'),
  });
  await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: template('Prueba'),
  });

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');

  // Criterio 3: con fecha de hoy, Ana pasa a tener "Casa".
  let dialog = await openAssign(page, 'Casa');
  await expect(dialog.getByText(/^Ends on /)).toBeVisible();
  await assign(page, dialog, ['Ana Asignar'], 'Assign to 1 client');
  await expect(page.getByRole('status')).toHaveText('“Casa” assigned.');

  // Criterio 4: a Ana y a Bruno a la vez; avisa de que Ana ya tiene "Casa".
  dialog = await openAssign(page, 'Prueba');
  await expect(dialog.getByRole('checkbox', { name: /Ana Asignar · Has “Casa”/ })).toBeVisible();
  await dialog.getByRole('checkbox', { name: /Ana Asignar/ }).check();
  await dialog.getByRole('checkbox', { name: /Bruno Asignar/ }).check();
  await expect(dialog.getByRole('note')).toHaveText([
    'Ana Asignar already has “Casa”. It will move to Previous.',
  ]);
  await dialog.getByRole('button', { name: 'Assign to 2 clients' }).click();
  await expect(page.getByRole('status')).toHaveText('“Prueba” assigned.');

  // Criterio 5: "Casa" para Ana dentro de 10 días: queda como próxima y su
  // rutina vigente sigue siendo "Prueba".
  dialog = await openAssign(page, 'Casa');
  await dialog.getByLabel('Start date', { exact: true }).fill(inDays(10));
  await expect(dialog.getByText(/^Starts on /)).toBeVisible();
  await assign(page, dialog, ['Ana Asignar'], 'Assign to 1 client');
  dialog = await openAssign(page, 'Casa');
  await expect(dialog.getByRole('checkbox', { name: /Ana Asignar · Has “Prueba”/ })).toBeVisible();
  await expect(
    dialog.getByRole('checkbox', { name: /Bruno Asignar · Has “Prueba”/ }),
  ).toBeVisible();
});

test('en el móvil la ventana de asignar ocupa la pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const business = await createTestBusiness(`E2E Asignar móvil ${suffix()}`);
  await joinedClient(business.code, 'Carla Asignar');
  await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: template('Casa'),
  });

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  const dialog = await openAssign(page, 'Casa');
  const box = await dialog.boundingBox();
  expect(box?.width).toBe(390);
  await assign(page, dialog, ['Carla Asignar'], 'Assign to 1 client');
  await expect(page.getByRole('status')).toHaveText('“Casa” assigned.');
});

/** La fila de un cliente en "Asignadas". */
const assignedRow = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Clients and their programs' })
    .getByRole('listitem')
    .filter({ hasText: name });

test('"Asignadas" enseña la rutina de cada cliente de Iron Lab, y ninguno de Norte', async ({
  page,
}) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/programs');
  await page.getByRole('button', { name: 'Assigned' }).click();

  // Criterio 1, con las rutinas del seed (PR 2.12).
  await expect(assignedRow(page, 'Ana Ejemplo')).toContainText('Casa + Gym');
  await expect(assignedRow(page, 'Bruno Prueba')).toContainText('Pecho / Espalda y Brazo / Pierna');
  await expect(assignedRow(page, 'Carla Demo')).toContainText('No program');
  // Criterio 7.
  await expect(page.getByText('Diego Ficticio')).toHaveCount(0);
  await expect(page.getByText('Elena Inventada')).toHaveCount(0);
});

test('"Asignadas" de Norte enseña a Diego con su rutina y a Elena con la próxima', async ({
  page,
}) => {
  await signIn(page, 'coach.norte@example.com');
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  await page.getByRole('button', { name: 'Assigned' }).click();

  // Criterio 2: Diego, en modo lista; Elena, como próxima, con su fecha.
  await expect(assignedRow(page, 'Diego Ficticio')).toContainText('Fuerza básica');
  await expect(assignedRow(page, 'Diego Ficticio')).toContainText('List mode');
  await expect(assignedRow(page, 'Elena Inventada')).toContainText('No program');
  await expect(assignedRow(page, 'Elena Inventada')).toContainText(/Next: Fuerza básica, starts /);
  // Fran está dado de baja: no sale.
  await expect(page.getByText('Fran Ejemplo')).toHaveCount(0);
});

test('después de asignar, cambiar la plantilla no cambia la rutina del cliente', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Copia ${suffix()}`);
  await joinedClient(business.code, 'Carla Copia');
  await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: template('Casa'),
  });

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  const dialog = await openAssign(page, 'Casa');
  await assign(page, dialog, ['Carla Copia'], 'Assign to 1 client');

  // Criterio 6: se renombra la plantilla; la rutina de Carla sigue igual.
  await page.getByRole('button', { name: 'Rename: Casa' }).click();
  await page.getByLabel('New name for “Casa”').fill('Casa nueva');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Renamed to “Casa nueva”.');
  await page.getByRole('button', { name: 'Assigned' }).click();
  // Asignada hoy: si hoy no es lunes, va por la semana a medias (D-075).
  const progress = new Date().getDay() === 1 ? 'Week 1' : 'Starting week';
  await expect(assignedRow(page, 'Carla Copia')).toContainText(`Casa · ${progress}`);
  await expect(assignedRow(page, 'Carla Copia')).not.toContainText('Casa nueva');
});
