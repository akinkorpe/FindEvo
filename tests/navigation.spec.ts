import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  test('root / should redirect somewhere valid', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL('/404');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/landing should be accessible without auth', async ({ page }) => {
    const response = await page.goto('/landing');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL('/landing');
  });

  test('/signin should be accessible without auth', async ({ page }) => {
    const response = await page.goto('/signin');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL('/signin');
  });

  test('protected /dashboard should redirect to signin', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/signin/);
  });

  test('protected /leads should redirect to signin', async ({ page }) => {
    await page.goto('/leads');
    await expect(page).toHaveURL(/signin/);
  });

  test('protected /settings should redirect to signin', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/signin/);
  });

  test('landing page should have correct title', async ({ page }) => {
    await page.goto('/landing');
    await expect(page).toHaveTitle(/RedditLeads/i);
  });
});
