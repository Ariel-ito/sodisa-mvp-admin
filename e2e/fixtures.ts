import { test as base, type Page } from '@playwright/test';

/**
 * El layout del admin llama hydrateToken() (rota el refresh token) en cada
 * montaje de página. Si cada archivo de test abriera su propio browser
 * context desde e2e/.auth/admin.json, el segundo archivo recibiría un
 * refresh token ya revocado por el primero.
 *
 * `authedPage` se crea una sola vez por worker y se comparte entre TODOS
 * los archivos de test que lo importen — la rotación de cookies fluye en
 * vivo dentro de ese único context, nunca se vuelve a leer el archivo
 * estático a mitad de la corrida.
 */
export const test = base.extend<Record<string, never>, { authedPage: Page }>({
  authedPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
      const page = await context.newPage();
      await use(page);
      await context.close();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
