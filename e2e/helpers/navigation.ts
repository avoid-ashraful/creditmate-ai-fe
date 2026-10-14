import { expect, Page } from '@playwright/test';

export const openHome = async (page: Page) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find Your Perfect Credit Card' })).toBeVisible();
};

export const waitForCards = async (page: Page) => {
  await expect(page.getByRole('heading', { name: /^Credit Cards \(/ })).toBeVisible();
  await expect(page.locator('.card-list-item')).toHaveCount(4);
  await expect(page.getByText('Synthetic Visa Classic')).toBeVisible();
};

export const addCardsToCompare = async (page: Page, count: number) => {
  const items = page.locator('.card-list-item');
  for (let index = 0; index < count; index += 1) {
    await items.nth(index).locator('.add-to-compare-btn').click();
  }
};
