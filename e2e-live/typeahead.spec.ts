import { expect, test } from '@playwright/test';

test.describe('Typeahead / Search Autocomplete - live backend', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Find Your Perfect Credit Card|Start Your Card Search/i })
    ).toBeVisible();
  });

  test('shows suggestions when typing in search box', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('Smoke');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 10000 });

    // Should have suggestions
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();

    // Should contain card suggestions
    await expect(options.first()).toContainText('Smoke Card');
  });

  test('can select a card suggestion', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('Smoke');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 10000 });

    const cardOption = page.getByRole('option').filter({ hasText: /Smoke Card 01/i });
    await expect(cardOption).toBeVisible();
    await cardOption.click();

    await expect(searchInput).toHaveValue('Smoke Card 01');
    await expect(listbox).not.toBeVisible();
  });

  test('can select a category suggestion and apply filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search by card name/i);
    await searchInput.click();
    await searchInput.fill('travel');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 10000 });

    const travelOption = page.getByRole('option').filter({ hasText: /Travel/i });
    await expect(travelOption).toBeVisible();
    await travelOption.click();

    // Should navigate to category page or apply filter
    await expect(listbox).not.toBeVisible();
  });
});
