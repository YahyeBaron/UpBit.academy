import { Page, expect } from '@playwright/test';

export async function goToHome(page: Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/BIT Academy|E-Learning/i);
}

export async function goToCourses(page: Page) {
  await page.goto('/courses');
  await expect(page.locator('h1, h2')).toBeVisible();
}

export async function searchForCourse(page: Page, query: string) {
  const searchInput = page.locator('input[type="text"][placeholder*="Search" i]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill(query);
  }
}
