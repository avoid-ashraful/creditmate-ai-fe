import { expect, test } from '@playwright/test';

import { cards } from './fixtures/cards';
import { mockApi } from './helpers/api';
import { addCardsToCompare, openHome, waitForCards } from './helpers/navigation';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('three cards compare with all comparison data visible', async ({ page }) => {
  await openHome(page);
  await waitForCards(page);
  await addCardsToCompare(page, 3);
  await expect(page.getByText('3/4')).toBeVisible();

  await page.locator('a.compare-button').click();
  await expect(page).toHaveURL(/\/compare\?ids=1,2,3$/);

  if ((page.viewportSize()?.width || 1024) < 768) {
    const mobileCards = page.locator('.comparison-mobile-card');
    await expect(mobileCards).toHaveCount(3);
    for (const [index, card] of cards.slice(0, 3).entries()) {
      const mobileCard = mobileCards.nth(index);
      await expect(mobileCard.getByRole('heading', { name: card.name })).toBeVisible();
      await expect(mobileCard.getByText(`Synthetic cash fee ${card.id}`)).toBeVisible();
      await expect(mobileCard.getByText(`Synthetic late fee ${card.id}`)).toBeVisible();
      await expect(mobileCard.getByText(`Synthetic waiver condition ${card.id}`)).toBeVisible();
      await mobileCard.locator('summary', { hasText: 'Benefits' }).click();
      await expect(mobileCard.getByText(`Synthetic reward policy ${card.id}`)).toBeVisible();
      await expect(mobileCard.getByText(`Synthetic feature ${card.id}.1`)).toBeVisible();
      await expect(mobileCard.getByText(`Synthetic feature ${card.id}.2`)).toBeVisible();
    }
  } else {
    const table = page.locator('.comparison-table');
    for (const card of cards.slice(0, 3)) {
      await expect(table.getByText(new RegExp(card.name))).toBeVisible();
      await expect(table.getByText(`by ${card.bank_name}`)).toBeVisible();
      await expect(table.getByText(new RegExp(`Synthetic cash fee ${card.id}`))).toBeVisible();
      await expect(table.getByText(new RegExp(`Synthetic late fee ${card.id}`))).toBeVisible();
      await expect(
        table.getByText(new RegExp(`Synthetic waiver condition ${card.id}`))
      ).toBeVisible();
      await expect(table.getByText(new RegExp(`Synthetic reward policy ${card.id}`))).toBeVisible();
      await expect(table.getByText(`Synthetic feature ${card.id}.1`)).toBeVisible();
      await expect(table.getByText(`Synthetic feature ${card.id}.2`)).toBeVisible();
    }

    const annualFeeRow = page.getByRole('row', { name: /^Annual fee BDT/ });
    await expect(annualFeeRow).toContainText('BDT 0');
    await expect(annualFeeRow).toContainText('BDT 500');
    await expect(annualFeeRow).toContainText('BDT 2,000');
    const interestRateRow = page.getByRole('row', { name: /^Interest Rate \(APR\)/ });
    await expect(interestRateRow).toContainText('19%');
    await expect(interestRateRow).toContainText('20%');
    await expect(interestRateRow).toContainText('21%');
  }
});

test('share comparison copies a URL that opens in a new tab', async ({ page, context }) => {
  await mockApi(page, { cards: cards.slice(0, 3) });
  await page.addInitScript(() => {
    window.navigator.clipboard.writeText = async (value: string) => {
      window.__sharedComparison = value;
    };
  });
  await page.goto('/compare?ids=1,2,3');
  await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();
  await page.getByRole('button', { name: 'Share Comparison' }).click();

  const sharedUrl = await page.evaluate(
    () => (window as Window & { __sharedComparison?: string }).__sharedComparison
  );
  expect(sharedUrl).toBeTruthy();
  expect(sharedUrl).toMatch(/\/compare\?ids=1,2,3&cid=[a-z0-9]+$/);

  const newPage = await context.newPage();
  await mockApi(newPage, { cards: cards.slice(0, 3) });
  await newPage.goto(sharedUrl!);
  await expect(newPage).toHaveURL(/\/compare\?ids=1,2,3&cid=/);
  await expect(newPage.locator('.card-chip-name')).toHaveCount(3);
  await expect(newPage.getByText('Comparing Cards3')).toBeVisible();
  await newPage.close();
});

test('comparison network failure remains on a usable empty state', async ({ page }) => {
  await mockApi(page, { abort: true, cards: cards.slice(0, 3) });
  await page.goto('/compare?ids=1,2,3');
  await expect(page.getByRole('heading', { name: 'No Cards Selected' })).toBeVisible();
  await expect(
    page.getByText('Please select credit cards to compare from the home page.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Credit Cards' })).toBeVisible();
});
