import { expect, Page } from '@playwright/test';

/**
 * The current home page is a landing page (hero + mode/shortlist/verified
 * sections); the card catalogue lives on the discovery page at /cards.
 * These helpers assert the app as it is now — the pre-redesign home,
 * which rendered the card list inline, no longer exists.
 */
export const openHome = async (page: Page) => {
  await page.goto('/');
  await expect(page.locator('main h1')).toBeVisible();
};

export const openDiscovery = async (page: Page, query = '') => {
  await page.goto(`/cards${query}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Credit cards' })).toBeVisible();
};

/** Wait for discovery result cards (the current `.cm-result-card` list). */
export const waitForResults = async (page: Page, count = 4) => {
  await expect(page.locator('.cm-result-card')).toHaveCount(count);
  await expect(page.getByText('Synthetic Visa Classic')).toBeVisible();
};

/** Backwards-compatible alias: the card list this used to wait for on the
 * old home page is the discovery result list now. */
export const waitForCards = waitForResults;

export const addCardsToCompare = async (page: Page, count: number) => {
  const items = page.locator('.card-list-item');
  for (let index = 0; index < count; index += 1) {
    await items.nth(index).locator('.add-to-compare-btn').click();
  }
};
