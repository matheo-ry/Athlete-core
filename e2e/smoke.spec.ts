import { expect, test } from '@playwright/test';

// Test de humo: la app arranca de verdad en un navegador, sin errores, y se
// puede usar lo básico. Solo datos inventados.

test('la app carga sin errores y se pasa de la zona de coach a la de cliente', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await page.goto('/');

  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();

  await page.getByTestId('dev-profile-client').click();

  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('el selector de idioma cambia entre inglés y español', async ({ page }) => {
  await page.goto('/coach');
  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.getByRole('heading', { name: 'Panel del coach' })).toBeVisible();

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
});

test('al cambiar de marca cambia el tema de la app', async ({ page }) => {
  await page.goto('/coach');
  // La marca se aplica como variables CSS en la etiqueta <html>.
  const root = page.locator('html');

  await expect(root).toHaveAttribute('style', /--brand-primary: #dc2626;/);

  await page.getByRole('button', { name: 'Norte Strength' }).click();

  await expect(root).toHaveAttribute('style', /--brand-primary: #0f766e;/);
});

test('quien todavía no tiene coach va a la bienvenida con la marca de la plataforma', async ({
  page,
}) => {
  await page.goto('/coach');

  await page.getByTestId('dev-no-tenant').click();

  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  await expect(page.getByText('ATHLETE CORE')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #2563eb;/);
});

test('al recargar en la zona de cliente se sigue viendo como cliente', async ({ page }) => {
  await page.goto('/client');

  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByTestId('dev-profile-client')).toHaveAttribute('aria-pressed', 'true');
});

test('el módulo de ejemplo aparece en el menú y carga sus datos', async ({ page }) => {
  await page.goto('/coach');

  await page.getByRole('link', { name: 'Template' }).click();

  await expect(page).toHaveURL(/\/coach\/template$/);
  await expect(page.getByText('Back squat')).toBeVisible();
});
