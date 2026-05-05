import { test, expect } from '@playwright/test';

test.describe('UI & Accessibility', () => {
  test('landing page has no broken images', async ({ page }) => {
    await page.goto('/landing');
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      if (src) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('sign in email input is present and interactive', async ({ page }) => {
    await page.goto('/signin');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
  });

  test('sign in password input is present and interactive', async ({ page }) => {
    await page.goto('/signin');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();
  });

  test('sign in form submit button is visible and enabled by default', async ({ page }) => {
    await page.goto('/signin');
    const submitBtn = page.locator('form button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('landing page CTA buttons are keyboard focusable', async ({ page }) => {
    await page.goto('/landing');
    await page.locator('header').getByRole('link', { name: 'Start free' }).focus();
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });

  test('landing page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/landing');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('sign in page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/signin');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('sign in page has alert role for form errors', async ({ page }) => {
    await page.goto('/signin?error=invalid_credentials');
    // Filter out the Next.js route announcer — only the visible error alert
    const alert = page.locator('[role="alert"]').filter({ hasText: /.+/ }).first();
    await expect(alert).toBeVisible();
  });
});
