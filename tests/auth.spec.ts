import { test, expect } from '@playwright/test';

test.describe('Authentication - Sign In Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('should display sign in form with email and password fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

  test('should display Sign in and Sign up tabs', async ({ page }) => {
    const signinTab = page.getByRole('button', { name: 'Sign in', exact: true }).first();
    const signupTab = page.getByRole('button', { name: 'Sign up', exact: true });
    await expect(signinTab).toBeVisible();
    await expect(signupTab).toBeVisible();
  });

  test('should switch to Sign up mode when clicking Sign up tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign up', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toContainText('Create account');
  });

  test('should show validation error on empty email submit', async ({ page }) => {
    await page.locator('form button[type="submit"]').click();
    // Should show inline error for email
    await expect(page.locator('text=/email/i').first()).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('notanemail');
    await page.locator('input[type="password"]').fill('Password1');
    await page.locator('form button[type="submit"]').click();
    // Error text or native validation
    await expect(page.locator('p.text-danger-500, [role="alert"]').first()).toBeVisible();
  });

  test('should accept valid email and password input', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.click();
    await emailInput.fill('test@example.com');
    await passwordInput.click();
    await passwordInput.fill('Password1');
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('Password1');
  });

  test('should display Google sign in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('should display marketing copy on the left panel', async ({ page }) => {
    await expect(page.getByText('Find customers on Reddit')).toBeVisible();
    await expect(page.getByText('No spam')).toBeVisible();
  });

  test('should show password hint when on sign up tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign up', exact: true }).click();
    await expect(page.getByText('At least 8 characters')).toBeVisible();
  });
});
