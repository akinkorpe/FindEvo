import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landing');
  });

  test('should display the navbar logo and primary CTA', async ({ page }) => {
    // Logo is the "FindEvo" wordmark since the rebrand.
    await expect(page.locator('header').getByText(/findevo/i).first()).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Start free' })).toBeVisible();
  });

  test('header has a Sign in link (visible on desktop, hidden < 640px)', async ({ page, viewport }) => {
    const link = page.locator('header').getByRole('link', { name: 'Sign in' });
    if (viewport && viewport.width < 640) {
      // `hidden sm:inline-flex` — intentional on mobile, "Start free" button covers the CTA.
      await expect(link).toBeHidden();
    } else {
      await expect(link).toBeVisible();
    }
  });

  test('should have working navigation anchor links in header (desktop only)', async ({ page, viewport }) => {
    // Header nav is `hidden md:flex` — only assert on viewports >= 768px.
    test.skip(!viewport || viewport.width < 768, 'header nav is hidden under md breakpoint');
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how');
    await expect(nav.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features');
  });

  test('Sign in link redirects to /signin (desktop only)', async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 640, 'Sign in text link hidden under sm');
    await page.locator('header').getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/signin');
  });

  test('should redirect Start free button to /signin', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Start free' }).click();
    await expect(page).toHaveURL('/signin');
  });

  test('should display HowItWorks section with id="how"', async ({ page }) => {
    await expect(page.locator('#how')).toBeVisible();
  });

  test('should display Features section with id="features"', async ({ page }) => {
    await expect(page.locator('#features')).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });
});
