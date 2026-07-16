import { test, expect } from './fixtures';

test('la auditoria carga estadisticas y permite filtrar por evento', async ({ authedPage: page }) => {
  await page.goto('/auditoria');

  await expect(page.getByText('Eventos hoy')).toBeVisible();
  await expect(page.getByText('Logins exitosos')).toBeVisible();
  await expect(page.getByText('Logins fallidos')).toBeVisible();
  await expect(page.getByText('Cuentas bloqueadas')).toBeVisible();

  // Nota: los <label> de esta pagina no tienen htmlFor (no asociados
  // semanticamente al input), asi que getByLabel no funciona aqui — se usa
  // getByRole/getByPlaceholder en su lugar.

  // Filtrar por un tipo de evento no debe producir ningun error.
  await page.getByRole('combobox').selectOption({ label: 'Login exitoso' });
  await expect(page.getByText(/error/i)).not.toBeVisible();

  // Buscar por email tampoco debe romper nada, con o sin resultados.
  await page.getByPlaceholder('ejemplo@correo.com').fill('admin@qa.com');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/error/i)).not.toBeVisible();
});
