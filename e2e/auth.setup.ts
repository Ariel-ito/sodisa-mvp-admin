import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/admin.json';

setup('login como admin de QA', async ({ page }) => {
  const email = process.env.QA_ADMIN_EMAIL;
  const password = process.env.QA_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Faltan QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD (ver .env.test)');
  }

  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
