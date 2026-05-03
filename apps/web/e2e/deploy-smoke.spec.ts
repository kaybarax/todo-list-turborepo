import { expect, test } from '@playwright/test';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;

test.describe('web deployment smoke test', () => {
  test('homepage renders', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Welcome to Todo App' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Todos' })).toBeVisible();
  });

  test('/todos renders', async ({ page }) => {
    await page.goto('/todos');

    await expect(page.getByRole('heading', { name: 'Todo Management' })).toBeVisible();
    await expect(page.getByText('Create, manage, and sync your todos to blockchain networks.')).toBeVisible();
  });

  test('configured API health endpoint is reachable', async ({ request }) => {
    test.skip(!apiUrl && !process.env.CI, 'Set NEXT_PUBLIC_API_URL or API_URL to smoke test API connectivity.');

    expect(apiUrl, 'NEXT_PUBLIC_API_URL or API_URL must be configured for deployed smoke tests.').toBeTruthy();

    const healthUrl = new URL('/health', apiUrl);
    const response = await request.get(healthUrl.toString(), { timeout: 10000 });

    expect(response.ok(), `Expected ${healthUrl.toString()} to return a 2xx/3xx response.`).toBe(true);
  });

  test('wallet page renders without browser wallet extensions', async ({ page }) => {
    const pageErrors: Error[] = [];

    page.on('pageerror', error => {
      pageErrors.push(error);
    });

    await page.addInitScript(() => {
      Reflect.deleteProperty(window, 'ethereum');
      Reflect.deleteProperty(window, 'solana');
    });
    await page.goto('/wallet');

    await expect(page.getByRole('heading', { name: 'Wallet Connection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Wallet', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect/i }).first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
