import { test, expect } from './fixtures';

const testEmail = `qa-staff-test-${Date.now()}@sodisa.com`;

test.describe.serial('Crear, editar y eliminar usuario SODISA (staff)', () => {
  test('crear usuario nuevo', async ({ authedPage: page }) => {
    await page.goto('/usuarios/nuevo');
    await page.getByLabel('Nombre completo *').fill('QA Staff Test');
    await page.getByLabel('Correo electrónico *').fill(testEmail);
    await page.getByLabel('Contraseña', { exact: true }).fill('QaTest1234!');
    await page.getByLabel('Rol *').selectOption('support');
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await page.waitForURL(/\/usuarios$/);
    await page.reload();
    await expect(page.getByRole('table').getByText(testEmail)).toBeVisible();
  });

  test('editar el nombre del usuario', async ({ authedPage: page }) => {
    await page.goto('/usuarios');
    await page.getByRole('row', { name: new RegExp(testEmail) }).getByTitle('Editar').click();
    await page.waitForURL(/\/usuarios\/\d+$/);

    await page.getByLabel('Nombre completo *').fill('QA Staff Test (editado)');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await page.waitForURL(/\/usuarios$/);
    await page.reload();
    await expect(page.getByRole('table').getByText('QA Staff Test (editado)')).toBeVisible();
  });

  test('eliminar el usuario creado', async ({ authedPage: page }) => {
    await page.goto('/usuarios');
    await expect(page.getByRole('table').getByText(testEmail)).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('row', { name: new RegExp(testEmail) }).getByTitle('Eliminar usuario').click();

    await page.reload();
    await expect(page.getByRole('table').getByText(testEmail)).not.toBeVisible();
  });
});
