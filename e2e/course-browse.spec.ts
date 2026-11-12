import { test, expect } from '@playwright/test';

test.describe('Course Browsing & Search Flow', () => {
  test('should load the courses page and display course catalog', async ({ page }) => {
    await page.goto('/courses');

    // Page should have main content visible
    const mainHeading = page.locator('h1, h2').first();
    await expect(mainHeading).toBeVisible();

    // Search bar or filter should be present
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Next');
      await expect(searchInput).toHaveValue('Next');
    }
  });

  test('should navigate to course details if courses exist', async ({ page }) => {
    await page.goto('/courses');

    // Look for any course link
    const courseLink = page.locator('a[href^="/courses/"]').first();
    if (await courseLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await courseLink.click();
      await expect(page).toHaveURL(/\/courses\/.+/);
    }
  });
});
