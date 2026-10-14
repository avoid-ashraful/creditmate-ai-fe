import { expect, test } from '@playwright/test';

test.describe('Advanced Search - live backend', () => {
  test('API advanced search endpoint works', async ({ request }) => {
    // Use the backend port from environment
    const bePort = process.env.BE_PORT || '4001';
    const response = await request.get(
      `http://127.0.0.1:${bePort}/api/v1/credit-cards/advanced-search/`
    );
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('API advanced search categories endpoint works', async ({ request }) => {
    const bePort = process.env.BE_PORT || '4001';
    const response = await request.get(
      `http://127.0.0.1:${bePort}/api/v1/credit-cards/advanced-search/categories/`
    );
    expect(response.ok()).toBeTruthy();
  });

  test('API advanced search sort options endpoint works', async ({ request }) => {
    const bePort = process.env.BE_PORT || '4001';
    const response = await request.get(
      `http://127.0.0.1:${bePort}/api/v1/credit-cards/advanced-search/sort-options/`
    );
    expect(response.ok()).toBeTruthy();
  });
});
