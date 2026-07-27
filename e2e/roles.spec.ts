import { test, expect } from './fixtures';

const roleName = `qa-test-role-${Date.now()}`;

test.describe.serial('Crear, editar y eliminar rol', () => {
  test('crear rol nuevo', async ({ authedPage: page }) => {
    await page.goto('/roles/nuevo');
    await page.getByLabel('Nombre interno *').fill(roleName);
    await page.getByLabel('Descripción').fill('Rol de prueba creado por Playwright');
    await page.getByRole('checkbox', { name: 'Ver lista de facturas' }).click();
    await page.getByRole('button', { name: 'Crear rol' }).click();

    await page.waitForURL(/\/roles$/);
    await page.reload();
    await expect(page.getByRole('table').getByText(roleName)).toBeVisible();
  });

  test('editar permisos del rol (sin usuarios asignados, sin dialogo de propagacion)', async ({ authedPage: page }) => {
    await page.goto('/roles');
    await page.getByRole('row', { name: new RegExp(roleName) }).getByTitle('Editar').click();
    await page.waitForURL(/\/roles\/\d+$/);

    await expect(page.getByRole('heading', { name: 'Editar rol' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Crear facturas' }).click();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    // Sin usuarios con este rol asignado, no debe aparecer el dialogo de propagacion.
    await expect(page.getByRole('heading', { name: 'Distribuir cambios a usuarios' })).not.toBeVisible();
    await page.waitForURL(/\/roles$/);
    await page.reload();
    await expect(page.getByRole('row', { name: new RegExp(roleName) }).getByText('2 permisos')).toBeVisible();
  });

  test('eliminar el rol creado', async ({ authedPage: page }) => {
    await page.goto('/roles');
    await expect(page.getByRole('table').getByText(roleName)).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('row', { name: new RegExp(roleName) }).getByTitle('Eliminar rol').click();

    await page.reload();
    await expect(page.getByRole('table').getByText(roleName)).not.toBeVisible();
  });
});
