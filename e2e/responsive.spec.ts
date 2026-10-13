import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';
import { openHome, waitForCards } from './helpers/navigation';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('homepage adapts to mobile, tablet, and desktop layouts', async ({ page }) => {
  await openHome(page);
  await waitForCards(page);

  const mainContent = page.locator('.main-content');
  const searchForm = page.locator('.search-form');
  const cards = page.locator('.cards-container');
  const cardName = page.locator('.card-name').first();

  const width = page.viewportSize()?.width ?? 0;
  expect(width).toBeGreaterThan(0);

  if (width! <= 768) {
    await expect(mainContent).toHaveCSS('grid-template-columns', /^380px/);
    await expect(searchForm).toHaveCSS('max-width', '100%');
  } else if (width! <= 992) {
    await expect(mainContent).toHaveCSS('grid-template-columns', /^786px/);
  } else {
    await expect(mainContent).toHaveCSS('grid-template-columns', /^340px/);
  }

  await expect(cards).toBeVisible();
  await expect(cardName).toBeVisible();
  await expect(page.locator('.comparison-bar')).toBeHidden();
});
