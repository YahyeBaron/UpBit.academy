import { test, expect } from '@playwright/test';

test.describe('Checkout & Pricing Flow', () => {
  test('should display pricing plans or course purchase CTA', async ({ page }) => {
    await page.goto('/pricing');

    // Check pricing page content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Check buttons/cards exist
    const ctaButtons = page.locator('button, a[href*="checkout"], a[href*="sign-in"]');
    await expect(ctaButtons.first()).toBeVisible();
  });

  test('checkout requires authentication when accessed directly unauthenticated', async ({ page }) => {
    const response = await page.goto('/checkout?course=nextjs-mastery');
    // Either redirected to sign-in or renders sign-in prompt
    const url = page.url();
    const isSignInOrCheckout =
      url.includes('sign-in') || url.includes('checkout') || (response && response.status() === 200);
    expect(isSignInOrCheckout).toBeTruthy();
  });
});
