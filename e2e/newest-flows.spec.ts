import { expect, test, Page } from '@playwright/test';

import { cards } from './fixtures/cards';
import { API_HOST, mockApi } from './helpers/api';

const user = { id: 52, email: 'e2e@example.test' };
const session = { user, access: 'access-e2e', refresh: 'refresh-e2e' };
const savedCards = cards.slice(0, 2).map(({ id, name, bank_name }) => ({ id, name, bank_name }));

async function mockLogin(page: Page) {
  await page.route(`${API_HOST}/auth/login/`, route => route.fulfill({ json: session }));
  await page.route(`${API_HOST}/auth/token/refresh/`, route =>
    route.fulfill({ json: { access: session.access } })
  );
  await page.route(`${API_HOST}/auth/me/`, route => route.fulfill({ json: user }));
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('Strong-pass-123');
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test('save comparison while logged in, rename, delete, and open its public share link', async ({
  page,
}) => {
  await mockApi(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await mockLogin(page);

  let comparisonName = 'Travel shortlist';
  let publicEnabled = false;
  let deleted = false;
  const comparison = () => ({
    id: 17,
    name: comparisonName,
    cards: savedCards,
    is_public: publicEnabled,
    share_token: 'share-e2e-token',
  });

  await page.route(/e2e\.invalid\/api\/v1\/saved\/comparisons\//, async route => {
    const request = route.request();
    if (request.method() === 'POST') {
      expect(request.postDataJSON()).toMatchObject({
        name: 'Travel shortlist',
        card_ids: [1, 2],
      });
      await route.fulfill({ status: 201, json: comparison() });
    } else if (request.method() === 'PATCH') {
      const body = request.postDataJSON();
      if (body.name) comparisonName = body.name;
      if (body.is_public !== undefined) publicEnabled = body.is_public;
      await route.fulfill({ json: comparison() });
    } else if (request.method() === 'DELETE') {
      deleted = true;
      await route.fulfill({ status: 204, body: '' });
    } else {
      await route.fulfill({ json: { results: deleted ? [] : [comparison()] } });
    }
  });
  await page.route(/e2e\.invalid\/api\/v1\/saved\/collections\/$/, route =>
    route.fulfill({ json: { results: [] } })
  );
  await page.route(/e2e\.invalid\/api\/v1\/saved\/shared\/share-e2e-token\/$/, route =>
    route.fulfill({ json: { type: 'comparison', name: comparisonName, cards: savedCards } })
  );

  await page.goto('/compare?ids=1,2');
  await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();
  page.once('dialog', dialog => dialog.accept('Travel shortlist'));
  await page.getByRole('button', { name: 'Save comparison' }).click();
  await expect(page.getByText('Saved.', { exact: true })).toBeVisible();

  await page.goto('/saved');
  await expect(page.getByText('Travel shortlist')).toBeVisible();
  page.once('dialog', dialog => dialog.accept('Holiday cards'));
  await page.getByRole('button', { name: 'Rename' }).first().click();
  await expect(page.getByText('Holiday cards')).toBeVisible();
  await page.getByRole('button', { name: 'Share' }).first().click();
  await page.goto('/shared/share-e2e-token');
  await expect(page.getByRole('heading', { name: 'Holiday cards' })).toBeVisible();
  await expect(page.getByText('Synthetic Visa Classic')).toBeVisible();

  await page.goto('/saved');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await expect(page.getByText('Nothing saved yet.').first()).toBeVisible();
});

test('add and remove a card from a collection', async ({ page }) => {
  await mockApi(page);
  await mockLogin(page);
  let collectionCards: Array<{
    card: (typeof savedCards)[number];
    notes: string;
    created: string;
  }> = [];
  const collection = () => ({
    id: 9,
    name: 'Favorites',
    description: '',
    is_public: false,
    cards: collectionCards,
  });
  await page.route(
    url =>
      url.origin === 'http://e2e.invalid' &&
      url.pathname.startsWith('/api/v1/saved/collections/9/'),
    async route => {
      const url = new URL(route.request().url());
      const request = route.request();
      if (url.pathname === '/api/v1/saved/collections/9/cards/' && request.method() === 'POST') {
        expect(request.postDataJSON()).toEqual({ card_id: 1 });
        const cardId = request.postDataJSON().card_id;
        const card = savedCards.find(savedCard => savedCard.id === cardId);
        if (!card) throw new Error(`Unexpected mocked collection card id: ${cardId}`);
        collectionCards = [
          {
            card,
            notes: '',
            created: '2025-01-01T00:00:00Z',
          },
        ];
        await route.fulfill({ status: 201, json: collection() });
      } else if (
        url.pathname === '/api/v1/saved/collections/9/cards/1/' &&
        request.method() === 'DELETE'
      ) {
        collectionCards = [];
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({ json: collection() });
      }
    }
  );
  await page.goto('/saved/collections/9');
  await page.getByLabel(/add card/i).fill('1');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Synthetic Visa Classic')).toBeVisible();
  await page.getByRole('button', { name: /remove/i }).click();
  await expect(page.getByText('Nothing saved yet.')).toBeVisible();
});

test('watch a card, manage alert frequency, and unsubscribe through the public token URL', async ({
  page,
}) => {
  await mockApi(page);
  await mockLogin(page);
  let subscriptions: Array<Record<string, unknown>> = [];
  let frequency = 'weekly';
  await page.route(
    url => url.origin === 'http://e2e.invalid' && url.pathname === '/api/v1/alerts/subscriptions/',
    async route => {
      if (route.request().method() === 'POST') {
        expect(route.request().postDataJSON()).toEqual({ card: 1, kind: 'any_change' });
        subscriptions = [{ id: 6, card: 1, kind: 'any_change', created: '2025-01-01T00:00:00Z' }];
        await route.fulfill({ status: 201, json: subscriptions[0] });
      } else {
        await route.fulfill({ json: { count: subscriptions.length, results: subscriptions } });
      }
    }
  );
  await page.route(`${API_HOST}/reviews/cards/*/summary/`, route =>
    route.fulfill({
      json: {
        average_rating: null,
        review_count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    })
  );
  await page.route(
    url => url.origin === 'http://e2e.invalid' && url.pathname === '/api/v1/reviews/',
    route =>
      route.fulfill({
        json: { count: 0, next: null, previous: null, results: [] },
      })
  );
  await page.route(
    url =>
      url.origin === 'http://e2e.invalid' &&
      url.pathname === '/api/v1/alerts/subscriptions/6/' &&
      url.search === '',
    async route => {
      expect(route.request().method()).toBe('DELETE');
      subscriptions = [];
      await route.fulfill({ status: 204, body: '' });
    }
  );
  await page.route(`${API_HOST}/alerts/preferences/`, async route => {
    if (route.request().method() === 'PATCH') frequency = route.request().postDataJSON().frequency;
    await route.fulfill({ json: { frequency, email_enabled: true } });
  });
  let unsubscribePosts = 0;
  await page.route(`${API_HOST}/alerts/unsubscribe/e2e-unsubscribe/`, async route => {
    // GET only previews (safe for link scanners); POST cancels after the user confirms.
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          confirm_required: true,
          is_active: true,
          kind: 'any_change',
          card_name: 'Synthetic Visa Classic',
        },
      });
      return;
    }
    expect(route.request().method()).toBe('POST');
    unsubscribePosts += 1;
    await route.fulfill({ json: { detail: 'Subscription cancelled.' } });
  });

  await page.goto('/card/synthetic-bank-1/synthetic-visa-classic');
  await expect(page.getByRole('heading', { name: 'Synthetic Visa Classic' })).toBeVisible();
  // The accessible label changes to "Watching this card" after the optimistic
  // state update, so keep the locator anchored to the stable control class.
  const watchButton = page.locator('button.watch-toggle');
  await expect(watchButton).toBeVisible();
  await expect(watchButton).toHaveAttribute('aria-pressed', 'false');
  await watchButton.click();
  await expect(watchButton).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/alerts');
  await expect(page.getByRole('heading', { name: /alert/i })).toBeVisible();
  await page.getByLabel(/frequency/i).selectOption('daily');
  await page.getByRole('button', { name: /save preferences/i }).click();
  await expect(page.getByRole('alert')).toContainText(/saved/i);
  await page.goto('/unsubscribe?token=e2e-unsubscribe');
  await expect(page.getByRole('button', { name: /unsubscribe me/i })).toBeVisible();
  expect(unsubscribePosts).toBe(0);
  await page.getByRole('button', { name: /unsubscribe me/i }).click();
  await expect(page.getByRole('heading', { name: /unsubscribed/i })).toBeVisible();
  expect(unsubscribePosts).toBe(1);
});

test('card detail shows review summary and list; signed-in users can submit and vote', async ({
  page,
}) => {
  await mockApi(page);
  await mockLogin(page);
  await page.route(`${API_HOST}/reviews/cards/*/summary/`, route =>
    route.fulfill({
      json: {
        average_rating: 4.5,
        review_count: 2,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      },
    })
  );
  let voteCount = 3;
  await page.route(
    url => url.pathname === '/api/v1/reviews/',
    async route => {
      if (route.request().method() === 'POST') {
        expect(route.request().postDataJSON()).toMatchObject({
          card: 1,
          rating: 5,
          title: 'Solid card',
        });
        await route.fulfill({
          status: 201,
          json: {
            id: 18,
            card: 1,
            rating: 5,
            title: 'Solid card',
            body: 'Works well.',
            pros: '',
            cons: '',
            helpful_count: 0,
            display_name: user.email,
            created: '2025-01-01T00:00:00Z',
            user: user.id,
            status: 'pending',
          },
        });
      } else {
        await route.fulfill({
          json: {
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                id: 7,
                card: 1,
                rating: 5,
                title: 'Excellent for travel',
                body: 'Airport benefits are useful.',
                pros: 'Lounge access',
                cons: 'Annual fee',
                helpful_count: voteCount,
                display_name: 'Travel fan',
                created: '2025-01-01T00:00:00Z',
                user: 89,
                status: 'approved',
                user_voted_helpful: false,
              },
            ],
          },
        });
      }
    }
  );
  await page.route(`${API_HOST}/reviews/7/helpful/`, route => {
    voteCount += 1;
    return route.fulfill({ json: { helpful_count: voteCount, user_voted_helpful: true } });
  });
  await page.goto('/card/synthetic-bank-1/synthetic-visa-classic');
  await expect(page.getByText('4.5', { exact: true })).toBeVisible();
  await expect(page.getByText('Excellent for travel')).toBeVisible();
  await page.getByRole('button', { name: /mark as helpful/i }).click();
  await expect(page.getByRole('button', { name: /mark as helpful/i })).toContainText('(4)');
  await page.getByRole('button', { name: /write a review/i }).click();
  await page.getByRole('button', { name: '5 stars' }).click();
  await page.getByLabel(/review title/i).fill('Solid card');
  await page.getByLabel(/your review/i).fill('Works well.');
  await page.getByRole('button', { name: /submit review/i }).click();
  await expect(page.getByText(/pending moderation/i).first()).toBeVisible();
});

test('anonymous review actions prompt login', async ({ page }) => {
  await mockApi(page);
  await page.route(`${API_HOST}/reviews/cards/*/summary/`, route =>
    route.fulfill({
      json: {
        average_rating: 4.5,
        review_count: 2,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      },
    })
  );
  await page.route(
    url => url.pathname === '/api/v1/reviews/',
    route =>
      route.fulfill({
        json: {
          count: 1,
          results: [
            {
              id: 7,
              card: 1,
              rating: 5,
              title: 'Excellent for travel',
              body: 'Airport benefits are useful.',
              pros: '',
              cons: '',
              helpful_count: 3,
              display_name: 'Travel fan',
              created: '2025-01-01T00:00:00Z',
              user: 89,
              status: 'approved',
            },
          ],
        },
      })
  );
  await page.goto('/card/synthetic-bank-1/synthetic-visa-classic');
  await expect(page.getByRole('region', { name: /log in to write a review/i })).toBeVisible();
  await page.getByRole('button', { name: /mark as helpful/i }).click();
  await expect(page.getByRole('status')).toContainText(/log in to vote/i);
});

test('advanced search filters, sorting, and URL state', async ({ page }) => {
  await mockApi(page);
  const requested: URL[] = [];
  await page.route(
    url =>
      url.origin === 'http://e2e.invalid' &&
      url.pathname.startsWith('/api/v1/credit-cards/advanced-search/'),
    async route => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/sort-options/')) {
        await route.fulfill({
          json: {
            sort_options: [
              { key: 'relevance', label: 'Relevance', description: 'Best match' },
              { key: 'annual_fee', label: 'Annual Fee (Low to High)', description: 'Ascending' },
            ],
          },
        });
      } else if (url.pathname.endsWith('/categories/')) {
        await route.fulfill({ json: { categories: [{ slug: 'travel', name: 'Travel' }] } });
      } else {
        requested.push(url);
        const feeMin = Number(url.searchParams.get('annual_fee_min') || 0);
        const feeMax = Number(url.searchParams.get('annual_fee_max') || Infinity);
        const results = cards.filter(
          card => Number(card.annual_fee) >= feeMin && Number(card.annual_fee) <= feeMax
        );
        await route.fulfill({
          json: {
            query: '',
            total: results.length,
            page: 1,
            page_size: 20,
            results,
            facets: {},
            took: 1,
            source: 'database',
            sort_options: [],
            categories: [],
            normalized_query: {},
          },
        });
      }
    }
  );
  await page.goto('/search?search=Synthetic');
  await expect(page.getByRole('heading', { name: 'Advanced Search' })).toBeVisible();
  await expect(page.getByText('Synthetic Visa Classic')).toBeVisible();
  await page.getByLabel('Min', { exact: true }).first().fill('1');
  await page.getByLabel('Max', { exact: true }).first().fill('1000');
  await expect(page).toHaveURL(/annual_fee_min=1/);
  await expect(page).toHaveURL(/annual_fee_max=1000/);
  await page.getByLabel('Sort results by').selectOption('annual_fee');
  await expect(page).toHaveURL(/ordering=annual_fee/);
  await expect
    .poll(() =>
      requested.some(
        url =>
          url.searchParams.get('ordering') === 'annual_fee' &&
          url.searchParams.get('annual_fee_min') === '1'
      )
    )
    .toBeTruthy();
});
