import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { signIn } from './helpers';
import { E2E_PASSWORD, createJoinedClient, createTestBusiness, localEnv } from './supabase-helpers';

// El logo del coach (PR 1.16, D-051 y D-057), contra Supabase local y su
// Storage de verdad. Cada test crea su propio negocio.

const suffix = () => Date.now().toString().slice(-5);
const MB = 1024 * 1024;

// Un PNG de verdad de 1 × 1 píxeles.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

// La marca de la carcasa: en el menú lateral (escritorio) o en la cabecera
// (móvil y zona de cliente). No la de la vista previa de "Marca".
const SHELL_LOGO = ':is(aside, header) [data-testid="brand-logo"]';
const SHELL_INITIALS = ':is(aside, header) [data-testid="brand-initials"]';

/** El logo de la carcasa que se ve. */
function headerLogo(page: Page): Locator {
  return page.locator(`${SHELL_LOGO}:visible`).first();
}

/**
 * Que la imagen se haya descargado de verdad (la dirección pública funciona):
 * el PNG de prueba mide 1 píxel de ancho; si no cargara, mediría 0.
 */
async function expectLoaded(logo: Locator): Promise<void> {
  await expect(logo).toHaveAttribute('src', /\/storage\/v1\/object\/public\/logos\//);
  await expect(logo).toHaveJSProperty('complete', true);
  await expect(logo).toHaveJSProperty('naturalWidth', 1);
}

/** Subir un archivo directamente a Storage con la sesión del coach, sin pasar por la app. */
async function uploadDirect(token: string, path: string, type: string, body: Buffer) {
  const { url, key } = localEnv();
  return fetch(`${url}/storage/v1/object/logos/${path}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': type },
    body,
  });
}

test('el coach sube su logo: se ve en la vista previa, en su app, en la del cliente y sin sesión; y lo quita', async ({
  page,
  browser,
}) => {
  const business = await createTestBusiness(`E2E Logo ${suffix()}`);
  const client = await createJoinedClient(business.code);

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await page.goto('/coach/settings');
  await expect(page.getByRole('heading', { name: 'Brand' })).toBeVisible();

  // Antes de guardar, solo en la vista previa.
  await page
    .getByLabel('Upload logo')
    .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: TINY_PNG });
  await expect(page.getByTestId('brand-preview').getByTestId('brand-logo')).toHaveAttribute(
    'src',
    /^data:image\/png/,
  );
  await expect(page.locator(SHELL_LOGO)).toHaveCount(0);

  // Al guardar, en la cabecera, descargado de Storage.
  await page.getByRole('button', { name: 'Save brand' }).click();
  await expect(page.getByText('Saved. Your clients will see it')).toBeVisible();
  await expectLoaded(headerLogo(page));
  const logoSrc = (await headerLogo(page).getAttribute('src')) ?? '';
  expect(logoSrc).toContain(`/logos/${business.tenantId}/`);

  // Su cliente lo ve en su app.
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  await signIn(clientPage, client, '/login', E2E_PASSWORD);
  await expect(clientPage.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expectLoaded(headerLogo(clientPage));
  await clientContext.close();

  // Y en la vista previa del código, sin sesión.
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/join?code=${business.code}`);
  await expect(guestPage.getByText(/You're going to train with E2E Logo/)).toBeVisible();
  await expectLoaded(guestPage.locator('main [data-testid="brand-logo"]').first());
  await guestContext.close();

  // "Quitar logo": vuelven las iniciales y el archivo se borra de Storage.
  await page.getByRole('button', { name: 'Remove logo' }).click();
  await page.getByRole('button', { name: 'Save brand' }).click();
  await expect(page.getByText('Saved. Your clients will see it')).toBeVisible();
  await expect(page.locator(SHELL_LOGO)).toHaveCount(0);
  await expect(page.locator(`${SHELL_INITIALS}:visible`).first()).toBeVisible();
  await expect.poll(async () => (await page.request.get(logoSrc)).status()).not.toBe(200);
});

test('con más de 2 MB, o un SVG o un PDF, lo dice', async ({ page }) => {
  const business = await createTestBusiness(`E2E Formato ${suffix()}`);

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await page.goto('/coach/settings');
  const input = page.getByLabel('Upload logo');

  await input.setInputFiles({
    name: 'big.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(3 * MB),
  });
  await expect(page.getByRole('alert')).toHaveText("The logo can't be larger than 2 MB.");

  await input.setInputFiles({
    name: 'logo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
  });
  await expect(page.getByRole('alert')).toHaveText('Format not supported. Use PNG, JPG or WebP.');

  await input.setInputFiles({
    name: 'logo.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await expect(page.getByRole('alert')).toHaveText('Format not supported. Use PNG, JPG or WebP.');
});

test('Storage también lo rechaza aunque no se pase por la app', async () => {
  const business = await createTestBusiness(`E2E Storage ${suffix()}`);
  const other = await createTestBusiness(`E2E Ajeno ${suffix()}`);
  const token = business.coach.token;

  // Lo correcto, sí.
  const ok = await uploadDirect(token, `${business.tenantId}/ok.png`, 'image/png', TINY_PNG);
  expect(ok.ok).toBe(true);

  // Un SVG, no (puede llevar código dentro). Más de 2 MB, tampoco.
  const svg = await uploadDirect(
    token,
    `${business.tenantId}/logo.svg`,
    'image/svg+xml',
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
  );
  expect(svg.ok).toBe(false);
  const big = await uploadDirect(
    token,
    `${business.tenantId}/big.png`,
    'image/png',
    Buffer.alloc(3 * MB),
  );
  expect(big.ok).toBe(false);

  // Y nunca en la carpeta de otro negocio.
  const foreign = await uploadDirect(token, `${other.tenantId}/hack.png`, 'image/png', TINY_PNG);
  expect(foreign.ok).toBe(false);
});
