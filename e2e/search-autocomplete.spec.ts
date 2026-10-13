/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect, Page } from '@playwright/test';

test.describe('Search Autocomplete E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Setup route fixture for typeahead
    await page.route('**/api/v1/credit-cards/typeahead/**', route => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get('q')?.toLowerCase() ?? '';

      const suggestions = [
        { type: 'card', id: 1, label: 'Visa Platinum Card', detail: 'Visa' },
        { type: 'card', id: 2, label: 'Other Rewards Card', detail: 'Chase' },
        { type: 'bank', id: 100, label: 'Chase Bank' },
        { type: 'category', slug: 'travel', label: 'Travel Rewards' },
        { type: 'category', slug: 'cashback', label: 'Cashback Cards' },
      ].filter(
        item =>
          (item.type === 'card' && item.label.toLowerCase().includes(q)) ||
          (item.type === 'bank' && item.label.toLowerCase().includes(q)) ||
          (item.type === 'category' &&
            (item.label.toLowerCase().includes(q) || item.slug.includes(q)))
      );

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions,
          facets: [
            { slug: 'travel', label: 'Travel', count: 5 },
            { slug: 'cashback', label: 'Cashback', count: 3 },
          ],
          didYouMean: q === 'viza' ? 'visa' : null,
        }),
      });
    });

    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('can type and see autocomplete suggestions', async () => {
    const searchInput = page.getByPlaceholderText(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('visa');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 500 });

    const options = page.getByRole('option');
    await expect(options).toHaveCount(1);
    await expect(options.first()).toContainText('Visa Platinum Card');
  });

  test('can select a category suggestion with slug preserved', async () => {
    const searchInput = page.getByPlaceholderText(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('travel');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 500 });

    const travelOption = page.getByRole('option').filter({ hasText: /Travel Rewards/i });
    await expect(travelOption).toBeVisible();
    await travelOption.click();

    await expect(searchInput).toHaveValue('Travel Rewards');
    await expect(listbox).not.toBeVisible();
  });

  test('can select a card suggestion', async () => {
    const searchInput = page.getByPlaceholderText(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('visa');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 500 });

    const visaOption = page.getByRole('option').filter({ hasText: /Visa Platinum Card/i });
    await expect(visaOption).toBeVisible();
    await visaOption.click();

    await expect(searchInput).toHaveValue('Visa Platinum Card');
    await expect(listbox).not.toBeVisible();
  });

  test('respects debounce timing', async () => {
    const searchInput = page.getByPlaceholderText(/Search by card name/i);
    await searchInput.click();
    await searchInput.type('v');

    const listbox = page.queryByRole('listbox');
    await expect(listbox).not.toBeVisible();

    await searchInput.type('isa');
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 500 });
  });

  test('keyboard navigation works', async () => {
    const searchInput = page.getByPlaceholderText(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('travel');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 500 });

    await searchInput.press('ArrowDown');

    const activedescendant = await searchInput.evaluate(el =>
      el.getAttribute('aria-activedescendant')
    );
    expect(activedescendant).toBeTruthy();

    await searchInput.press('Enter');
    await expect(listbox).not.toBeVisible();
  });

  test('Escape key closes suggestions', async () => {
    const searchInput = page.getByPlaceholderText(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('travel');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 500 });

    await searchInput.press('Escape');
    await expect(listbox).not.toBeVisible();
  });
});
