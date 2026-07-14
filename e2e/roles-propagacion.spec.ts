import { test, expect } from './fixtures';

// "cobrador" es el UNICO rol no-sistema (editable) con un usuario real
// asignado (cobrador@local.com en "Local Testing") — el resto de roles no
// son editables (isSystem) o no tienen usuarios, asi que no disparan el
// dialogo de propagacion. Este test agrega un permiso, propaga, verifica,
// y en el segundo test revierte exactamente el mismo cambio propagandolo
// de vuelta — no debe quedar ningun efecto residual sobre ese usuario real.
test.describe.serial('Propagacion de permisos de rol a usuarios', () => {
  test('agregar un permiso a "cobrador" y propagarlo al usuario asignado', async ({ authedPage: page }) => {
    await page.goto('/roles');
    await page.getByRole('row', { name: /cobrador/ }).getByTitle('Editar').click();
    await page.waitForURL(/\/roles\/\d+$/);

    await page.getByRole('checkbox', { name: 'Crear facturas' }).click();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByRole('heading', { name: 'Distribuir cambios a usuarios' })).toBeVisible();
    await expect(page.getByText(/^1$/)).toBeVisible();
    await expect(page.getByText('Se agregarán')).toBeVisible();
    await expect(page.getByText('＋ Crear facturas')).toBeVisible();
    await page.getByRole('button', { name: 'Sí, distribuir cambios' }).click();

    await page.waitForURL(/\/roles$/);
    await page.reload();
    await expect(page.getByRole('row', { name: /cobrador/ }).getByText('2 permisos')).toBeVisible();
  });

  test('revertir el permiso agregado y propagar de vuelta al estado original', async ({ authedPage: page }) => {
    await page.goto('/roles');
    await page.getByRole('row', { name: /cobrador/ }).getByTitle('Editar').click();
    await page.waitForURL(/\/roles\/\d+$/);

    await page.getByRole('checkbox', { name: 'Crear facturas' }).click(); // desmarcar
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByRole('heading', { name: 'Distribuir cambios a usuarios' })).toBeVisible();
    await expect(page.getByText('Se eliminarán')).toBeVisible();
    await expect(page.getByText('－ Crear facturas')).toBeVisible();
    await page.getByRole('button', { name: 'Sí, distribuir cambios' }).click();

    await page.waitForURL(/\/roles$/);
    await page.reload();
    await expect(page.getByRole('row', { name: /cobrador/ }).getByText('1 permisos')).toBeVisible();
  });
});
