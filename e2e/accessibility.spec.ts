import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';
import { openHome, waitForCards } from './helpers/navigation';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('keyboard navigation reaches primary controls and visible labels', async ({ page }) => {
  await openHome(page);
  await waitForCards(page);

  const search = page.locator('.search-form input');
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Search' })).toBeFocused();

  const filterToggle = page.locator('.filter-header .toggle-button');
  await filterToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Min (BDT):')).toBeVisible();
  await expect(page.getByLabel('Max (BDT):')).toBeVisible();
  await expect(page.getByLabel('Or Range (min,max):').nth(0)).toBeVisible();

  const addFirstCard = page.locator('.add-to-compare-btn').first();
  await addFirstCard.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove from Compare' }).first()).toBeFocused();
});

test('ARIA attributes and document landmarks support assistive navigation', async ({ page }) => {
  await openHome(page);
  await waitForCards(page);

  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('nav')).toHaveCount(1);
  await expect(page.getByRole('banner').getByRole('navigation')).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Find Your Perfect Credit Card' })
  ).toBeVisible();
  await expect(page.locator('.search-form input')).toHaveAttribute('type', 'text');
  await page.locator('.filter-header .toggle-button').click();
  await expect(page.locator('#minAnnualFee')).toHaveAttribute('type', 'number');
});
