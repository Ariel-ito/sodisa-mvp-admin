import { test, expect } from './fixtures';

// Esta pagina edita la cuenta del usuario ACTUALMENTE logueado (admin@qa.com,
// la misma cuenta que usa auth.setup.ts para todos los tests). Por eso:
// - El cambio de nombre se revierte inmediatamente en el mismo test.
// - El cambio de contrasena NUNCA se completa de verdad — solo se prueba la
//   validacion de "las contrasenas no coinciden", que ocurre en el cliente
//   antes de llamar al API. Si se rompiera esta cuenta, se romperian todos
//   los demas tests de la suite (que dependen de este login).
test('el perfil muestra los datos del usuario y permite editar el nombre', async ({ authedPage: page }) => {
  await page.goto('/perfil');

  // "QA" y "Administrador" tambien aparecen en el sidebar — escopamos al
  // contenido principal para evitar el strict-mode violation de Playwright.
  const main = page.getByRole('main');
  await expect(main.getByText('QA')).toBeVisible();
  await expect(main.getByText('Administrador')).toBeVisible();

  const nameInput = page.getByLabel('Nombre completo');
  const originalName = await nameInput.inputValue();

  await nameInput.fill('QA Nombre Temporal');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();

  // Revertir de inmediato al nombre original.
  await nameInput.fill(originalName);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();
  await expect(nameInput).toHaveValue(originalName);
});

test('cambiar contrasena valida que coincidan (sin completar el cambio real)', async ({ authedPage: page }) => {
  await page.goto('/perfil');

  // "Nueva contraseña" es substring de "Confirmar nueva contraseña" — exact:true evita la ambiguedad.
  await page.getByLabel('Contraseña actual').fill('no-importa-para-esta-prueba');
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('NuevaClave1234!');
  await page.getByLabel('Confirmar nueva contraseña').fill('OtraClaveDistinta1234!');
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();

  // Esta validacion es 100% del lado del cliente — nunca llega a tocar el API.
  await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
});
