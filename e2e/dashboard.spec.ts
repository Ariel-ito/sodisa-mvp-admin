import { test, expect } from './fixtures';

test('el dashboard muestra las tarjetas de resumen tras el login', async ({ authedPage: page }) => {
  await page.goto('/');

  await expect(page.getByText('Empresas activas')).toBeVisible();
  await expect(page.getByText('Usuarios SODISA')).toBeVisible();
  await expect(page.getByText('Accesos activos')).toBeVisible();
});

test('el listado de usuarios carga sin error', async ({ authedPage: page }) => {
  await page.goto('/usuarios');

  await expect(page.getByRole('heading', { name: 'Usuarios del portal' })).toBeVisible();
  // Al menos una fila o el estado vacío — nunca un error de carga
  await expect(page.getByText(/error/i)).not.toBeVisible();
});
