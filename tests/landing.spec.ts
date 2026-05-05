import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landing');
  });

  test('should display the navbar logo and CTA buttons', async ({ page }) => {
    await expect(page.locator('header').getByText('RedditLeads')).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: 'Start free' })).toBeVisible();
  });

  test('should have working navigation anchor links in header', async ({ page }) => {
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how');
    await expect(nav.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features');
    await expect(nav.getByRole('link', { name: 'Why us' })).toHaveAttribute('href', '#compare');
  });

  test('should redirect Sign in link to /signin', async ({ page }) => {
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

  test('should display Comparison section with id="compare"', async ({ page }) => {
    await expect(page.locator('#compare')).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should be responsive on mobile — desktop nav links hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('header').getByText('RedditLeads')).toBeVisible();
    // header nav is hidden on mobile (md:flex), but hero section also has the link
    await expect(page.locator('header nav').getByRole('link', { name: 'How it works' })).toBeHidden();
  });
});
