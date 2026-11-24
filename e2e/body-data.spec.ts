import { expect, test } from '@playwright/test';

import { signIn } from './helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  select,
  signInApi,
} from './supabase-helpers';

// Peso corporal y medidas (PR 3.9b, D-126 y D-127), contra Supabase local y en
// el navegador (la web también apunta peso). Cada test crea su propio negocio y
// su cliente: no cambia nada del seed.

const suffix = () => Date.now().toString().slice(-5);

/** Lo que hay en una tabla de salud, leído con la propia sesión del cliente (respeta el RLS). */
async function ownRows(email: string, table: string, columns: string) {
  const session = await signInApi(email, E2E_PASSWORD);
  return select(session, `${table}?select=${columns}&order=measured_on.desc`);
}

test('sin permiso se pide al apuntar, el peso y las medidas salen en su historial y retirarlo los borra', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Cuerpo ${suffix()}`);
  const email = await createJoinedClient(business.code);

  await signIn(page, email, '/login', E2E_PASSWORD, { showHealthConsentPrompt: true });

  // Criterio 1: con "Ahora no", al ir a apuntar el peso se vuelve a pedir.
  const dialog = page.getByRole('dialog', { name: 'Your health data' });
  await dialog.getByRole('button', { name: 'Not now' }).click();
  await expect(dialog).toBeHidden();

  // Inicio: invita a apuntar el primer peso.
  await expect(page.getByTestId('body-weight-card-last')).toContainText(
    "You haven't logged your weight yet.",
  );
  await page.getByRole('link', { name: 'Log weight' }).click();
  await expect(page).toHaveURL(/\/client\/body$/);

  // Criterio 4: en la web, apunto mi peso (en kg, con coma).
  await page.getByLabel('Weight (kg)').fill('85,5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeVisible();
  expect(await ownRows(email, 'body_weights', 'weight_kg')).toEqual([]);
  await dialog.getByRole('button', { name: 'I agree' }).click();

  await expect(page.getByText('Weight logged.')).toBeVisible();
  await expect(page.getByTestId('body-weight-last')).toContainText('85.5 kg · logged on');
  await expect
    .poll(async () => ownRows(email, 'body_weights', 'weight_kg'))
    .toEqual([{ weight_kg: 85.5 }]);

  // Inicio: el último peso y "Update".
  await page.goto('/client');
  await expect(page.getByTestId('body-weight-card-last')).toContainText('85.5 kg · logged on');
  await expect(page.getByRole('link', { name: 'Update' })).toBeVisible();

  // Criterio 3: cintura 82 cm y brazo derecho 38 salen en su historial.
  await page.getByRole('link', { name: 'Measurements' }).click();
  await expect(page).toHaveURL(/\/client\/body\?tab=measurements$/);
  await page.getByLabel('Measurement').selectOption('waist');
  await page.getByLabel('Value (cm)').fill('82');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Measurement logged.')).toBeVisible();
  await page.getByLabel('Measurement').selectOption('arm-right');
  await page.getByLabel('Value (cm)').fill('38');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByTestId('measure-waist')).toContainText('82 cm');
  await expect(page.getByTestId('measure-arm-right')).toContainText('38 cm');
  await expect
    .poll(async () => ownRows(email, 'body_measurements', 'kind,side,value_cm'))
    .toEqual(
      expect.arrayContaining([
        { kind: 'waist', side: null, value_cm: 82 },
        { kind: 'arm', side: 'right', value_cm: 38 },
      ]),
    );

  // Apuntar el mismo día otra vez sustituye lo anterior (una medida por día).
  await page.getByLabel('Measurement').selectOption('waist');
  await page.getByLabel('Value (cm)').fill('81,5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('measure-waist')).toContainText('81.5 cm');
  await expect(page.getByTestId('measure-waist').getByRole('listitem')).toHaveCount(1);

  // Un dato apuntado por error se borra, con una pregunta antes.
  await page
    .getByTestId('measure-arm-right')
    .getByRole('button', { name: /^Delete/ })
    .click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page.getByTestId('measure-arm-right')).toBeHidden();

  // Criterio 5: retirar el permiso, con confirmación, borra el peso y las medidas.
  await page.goto('/client/profile');
  await page.getByRole('button', { name: 'Withdraw permission' }).click();
  await page.getByRole('button', { name: 'Withdraw and delete' }).click();
  await expect(page.getByTestId('health-consent-status')).toContainText('Permission withdrawn on');
  await expect.poll(async () => ownRows(email, 'body_weights', 'weight_kg')).toEqual([]);
  await expect.poll(async () => ownRows(email, 'body_measurements', 'kind')).toEqual([]);

  // Y la pantalla no enseña nada de lo borrado.
  await page.goto('/client/body');
  await expect(page.getByTestId('body-weight-last')).toContainText(
    "You haven't logged your weight yet.",
  );
});
