import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';
import { openHome, waitForCards } from './helpers/navigation';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('homepage search for visa returns matching cards', async ({ page }) => {
  await openHome(page);
  await waitForCards(page);

  const search = page.locator('.search-form input');
  await search.fill('visa');
  await page.locator('.search-form > button[type="submit"]').click();

  await expect(page.locator('.card-list-item')).toHaveCount(3);
  for (const name of [
    'Synthetic Visa Classic',
    'Synthetic Visa Travel',
    'Synthetic Visa Signature',
  ]) {
    await expect(page.getByText(name)).toBeVisible();
  }
  await expect(page.getByText('Synthetic Mastercard Outside Range')).toBeHidden();
});

test('annual fee 0-2000 filter returns only in-range cards', async ({ page }) => {
  await openHome(page);
  await waitForCards(page);

  await page.locator('.filter-header').click();
  await page.locator('#minAnnualFee').fill('0');
  await page.locator('#maxAnnualFee').fill('2000');
  await page.getByRole('button', { name: 'Apply Filters' }).click();

  await expect(page.locator('.card-list-item')).toHaveCount(3);
  await expect(page.getByText('BDT 0')).toBeVisible();
  await expect(page.getByText('BDT 500')).toBeVisible();
  await expect(page.getByText('BDT 2,000')).toBeVisible();
  await expect(page.getByText('Synthetic Mastercard Outside Range')).toBeHidden();
});

test('card detail popup supports image gallery navigation', async ({ page }) => {
  await openHome(page);
  await waitForCards(page);

  await page.locator('.card-list-item').first().click();
  const image = page.locator('.card-full-image');
  await expect(image).toBeVisible();
  await expect(page.locator('.image-counter')).toHaveText('1 / 3');
  await expect(image).toHaveAttribute('src', '/mock-assets/cards/1-1.svg');

  await page.locator('.nav-button.next').click();
  await expect(page.locator('.image-counter')).toHaveText('2 / 3');
  await expect(image).toHaveAttribute('src', '/mock-assets/cards/1-2.svg');

  await page.locator('.nav-button.next').click();
  await expect(page.locator('.image-counter')).toHaveText('3 / 3');
  await expect(image).toHaveAttribute('src', '/mock-assets/cards/1-3.svg');

  await page.locator('.nav-button.next').click();
  await expect(page.locator('.image-counter')).toHaveText('1 / 3');
  await expect(image).toHaveAttribute('src', '/mock-assets/cards/1-1.svg');

  await page.locator('.nav-button.prev').click();
  await expect(page.locator('.image-counter')).toHaveText('3 / 3');
  await expect(image).toHaveAttribute('src', '/mock-assets/cards/1-3.svg');
});

test('an unreachable API exposes the generic error state, not the category-not-found copy', async ({
  page,
}) => {
  await mockApi(page, { status: 503, cards: [] });
  await openHome(page);

  await page.locator('.search-form input').fill('visa');
  await page.locator('.search-form > button[type="submit"]').click();
  // QA #15: an unreachable API is a network error, not an empty category.
  await expect(page.locator('.error-state')).toHaveText(
    'Failed to load credit cards. Please try again later.'
  );
  await expect(page.locator('.card-list-item')).toHaveCount(0);
});

test('a truthful empty API response exposes the no-results state', async ({ page }) => {
  await mockApi(page, { cards: [] });
  await openHome(page);

  const search = page.locator('.search-form input');
  await search.fill('mastercard');
  await page.locator('.search-form > button[type="submit"]').click();
  await expect(page.locator('.no-results')).toBeVisible();
  await expect(page.locator('.card-list-item')).toHaveCount(0);
});
