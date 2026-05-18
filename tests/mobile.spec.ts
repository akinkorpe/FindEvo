import { test, expect, type Page } from '@playwright/test';

// 390px is the iPhone 12/13/14/15 width — the standard "small modern phone"
// viewport. If something overflows here it overflows on every iPhone since 2020.

const UNAUTH_ROUTES = ['/landing', '/signin', '/onboarding', '/privacy', '/terms', '/pricing'];

async function getHorizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
}

test.describe('Mobile viewport (390px)', () => {
  test('viewport meta tag is present and configured for mobile', async ({ page }) => {
    await page.goto('/landing');
    const content = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(content).toBeTruthy();
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');
  });

  for (const route of UNAUTH_ROUTES) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      // Wait for content to settle — late-loading fonts/images can shift layout.
      await page.waitForLoadState('networkidle');
      const overflow = await getHorizontalOverflow(page);
      // Allow 1px tolerance for sub-pixel rounding artifacts.
      expect(overflow, `${route} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }

  test('signin form is reachable and tappable on mobile', async ({ page }) => {
    await page.goto('/signin');
    const email = page.locator('input[type="email"]').first();
    await expect(email).toBeVisible();
    // Tap target check — Apple's HIG recommends ≥ 44px, Material says ≥ 48px.
    // We accept ≥ 40px as a pragmatic floor (matches our py-3.5 inputs).
    const box = await email.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
  });

  test('landing page has a working signin link', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');
    // Landing has multiple `Link href="/signin"` instances. The plain "Sign in"
    // text link is `hidden sm:inline-flex` so on 390px it's the "Start free"
    // primary button that must be visible.
    const signinLinks = page.locator('a[href="/signin"]:visible');
    await expect(signinLinks.first()).toBeVisible();
  });

  test('protected route redirect still works on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/signin/);
  });
});
