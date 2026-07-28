import { test, expect } from './fixtures';

// Usa la misma instancia local de SQL Server que ya sirve BIT_PORTAL — solo
// necesitamos que la conexión sea válida para que "Crear empresa" pase el
// guardado, no datos de negocio reales de esta empresa de prueba.
const QA_DB_HOST     = process.env.QA_DB_HOST;
const QA_DB_PORT     = process.env.QA_DB_PORT;
const QA_DB_USERNAME = process.env.QA_DB_USERNAME;
const QA_DB_PASSWORD = process.env.QA_DB_PASSWORD;
const QA_DB_DATABASE = process.env.QA_DB_DATABASE;

test.describe.serial('Crear y eliminar empresa', () => {
  const companyName = `QA Test Company ${Date.now()}`;

  test('crear empresa nueva', async ({ authedPage: page }) => {
    if (!QA_DB_HOST || !QA_DB_PORT || !QA_DB_USERNAME || !QA_DB_PASSWORD || !QA_DB_DATABASE) {
      throw new Error('Faltan QA_DB_* en .env.test');
    }

    await page.goto('/empresas/nueva');
    await page.getByLabel('Nombre *').fill(companyName);
    await page.getByLabel('Host *').fill(QA_DB_HOST);
    await page.getByLabel('Puerto *').fill(QA_DB_PORT);
    await page.getByLabel('Base de datos *').fill(QA_DB_DATABASE);
    await page.getByLabel('Usuario *').fill(QA_DB_USERNAME);
    await page.getByLabel('Contraseña', { exact: false }).fill(QA_DB_PASSWORD);
    await page.getByRole('button', { name: 'Crear empresa' }).click();

    await expect(page).toHaveURL(/\/empresas$/);
    // La vista desktop (tabla) y mobile (cards) coexisten en el DOM — escopamos a la tabla.
    await expect(page.getByRole('table').getByText(companyName)).toBeVisible();
  });

  test('eliminar la empresa creada (zona de peligro)', async ({ authedPage: page }) => {
    await page.goto('/empresas');
    await page.getByRole('row', { name: new RegExp(companyName) }).getByTitle('Editar').click();
    await page.waitForURL(/\/empresas\/\d+$/);

    await expect(page.getByRole('heading', { name: 'Editar empresa' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Zona de peligro' })).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar empresa' }).click();

    await expect(page).toHaveURL(/\/empresas$/);
    // El listado usa SWR y puede tardar en revalidar tras el redirect —
    // forzamos un fetch fresco en vez de confiar en la caché del cliente.
    await page.reload();
    await expect(page.getByRole('table').getByText(companyName)).not.toBeVisible();
  });
});
