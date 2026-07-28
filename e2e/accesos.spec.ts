import { test, expect } from './fixtures';

// "Local Testing" (id=1) — empresa de prueba ya existente en el sistema,
// no una que creemos/borremos nosotros (ver empresas.spec.ts para ese flujo).
const COMPANY_ID = 1;
const testEmail = `qa-access-test-${Date.now()}@example.com`;

test.describe.serial('Crear, editar y eliminar acceso de usuario a empresa', () => {
  test('crear acceso nuevo', async ({ authedPage: page }) => {
    await page.goto(`/empresas/${COMPANY_ID}/usuarios/nuevo`);
    await page.getByLabel('Email *').fill(testEmail);
    await page.getByLabel('Nombre').fill('QA Access Test');
    await page.getByLabel('Contraseña', { exact: true }).fill('QaTest1234!');
    await page.getByRole('button', { name: 'Crear acceso' }).click();

    await page.waitForURL(new RegExp(`/empresas/${COMPANY_ID}/usuarios$`));
    await expect(page.getByRole('table').getByText(testEmail)).toBeVisible();
  });

  test('asignar un rol al acceso creado', async ({ authedPage: page }) => {
    await page.goto(`/empresas/${COMPANY_ID}/usuarios`);
    await page.getByRole('row', { name: new RegExp(testEmail) }).getByTitle('Editar acceso').click();
    await page.waitForURL(/\/usuarios\/\d+$/);

    await expect(page.getByRole('heading', { name: 'Editar acceso' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Vendedor' }).click();
    // Roles con permisos disparan un dialogo de confirmacion antes de aplicarse.
    await expect(page.getByRole('heading', { name: 'Agregar rol' })).toBeVisible();
    await page.getByRole('button', { name: 'Sí, agregar rol' }).click();

    await expect(page.getByRole('checkbox', { name: 'Vendedor' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await page.waitForURL(new RegExp(`/empresas/${COMPANY_ID}/usuarios$`));
    // El listado usa SWR y puede tardar en revalidar tras el redirect.
    await page.reload();
    await expect(page.getByRole('row', { name: new RegExp(testEmail) }).getByText('vendedor')).toBeVisible();
  });

  test('eliminar el acceso creado', async ({ authedPage: page }) => {
    await page.goto(`/empresas/${COMPANY_ID}/usuarios`);
    await expect(page.getByRole('table').getByText(testEmail)).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('row', { name: new RegExp(testEmail) }).getByTitle('Eliminar acceso').click();

    await page.reload();
    await expect(page.getByRole('table').getByText(testEmail)).not.toBeVisible();
  });
});
