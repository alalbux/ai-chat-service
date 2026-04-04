import { test, expect } from '@playwright/test';

test.describe('demo smoke', () => {
  test('home renders and can submit when API is up', async ({ page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3000';
    const health = await request.get(`${apiUrl}/health/live`).catch(() => null);
    test.skip(!health?.ok(), 'API not reachable — start API or set NEXT_PUBLIC_API_URL');

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'AI Chat Demo' })).toBeVisible();
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('result')).toContainText('[mock]');
  });
});
