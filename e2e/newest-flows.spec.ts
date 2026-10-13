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
  await page.route(/e2e\.invalid\/api\/v1\/saved\/collections\/9\//, async route => {
    const url = new URL(route.request().url());
    const request = route.request();
    if (url.pathname === '/api/v1/saved/collections/9/cards/' && request.method() === 'POST') {
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
    } else if (url.pathname === '/api/v1/saved/collections/9/cards/1/') {
      collectionCards = [];
      await route.fulfill({ status: 204, body: '' });
    } else {
      await route.fulfill({ json: collection() });
    }
  });
  await page.goto('/saved/collections/9');
  await page.getByLabel(/add card/i).fill('1');
  await page.getByRole('button', { name: /create/i }).click();
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
  await page.route(`${API_HOST}/alerts/subscriptions/`, async route => {
    if (route.request().method() === 'POST') {
      subscriptions = [{ id: 6, card: 1, kind: 'any_change', created: '2025-01-01T00:00:00Z' }];
      await route.fulfill({ status: 201, json: subscriptions[0] });
    } else {
      await route.fulfill({ json: { count: subscriptions.length, results: subscriptions } });
    }
  });
  await page.route(`${API_HOST}/alerts/subscriptions/6/`, async route => {
    subscriptions = [];
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route(`${API_HOST}/alerts/preferences/`, async route => {
    if (route.request().method() === 'PATCH') frequency = route.request().postDataJSON().frequency;
    await route.fulfill({ json: { frequency, email_enabled: true } });
  });
  await page.route(`${API_HOST}/alerts/unsubscribe/e2e-unsubscribe/`, async route => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: { detail: 'Unsubscribed' } });
  });

  await page.goto('/card/synthetic-bank-1/synthetic-visa-classic');
  const watchButton = page.getByRole('button', { name: /watch this card/i });
  await expect(watchButton).toHaveAttribute('aria-pressed', 'false');
  await watchButton.click({ force: true });
  await expect(page.getByRole('button', { name: /watching this card/i })).toBeVisible();
  await page.goto('/alerts');
  await expect(page.getByRole('heading', { name: /alert/i })).toBeVisible();
  await page.getByLabel(/frequency/i).selectOption('daily');
  await page.getByRole('button', { name: /save preferences/i }).click();
  await expect(page.getByRole('alert')).toContainText(/saved/i);
  await page.goto('/unsubscribe?token=e2e-unsubscribe');
  await expect(page.getByRole('heading', { name: /unsubscribed/i })).toBeVisible();
});

test('card detail shows review summary and list; signed-in users can submit and vote', async ({
  page,
}) => {
  await mockApi(page);
  await mockLogin(page);
  await page.route(`${API_HOST}/reviews/summary/**`, route =>
    route.fulfill({
      json: { average: 4.5, count: 2, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } },
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
  await expect(page.getByRole('button', { name: /marked helpful/i })).toBeVisible();
  await page.getByRole('button', { name: /write a review/i }).click();
  await page.getByRole('button', { name: '5 stars' }).click();
  await page.getByLabel(/review title/i).fill('Solid card');
  await page.getByLabel(/your review/i).fill('Works well.');
  await page.getByRole('button', { name: /submit review/i }).click();
  await expect(page.getByText(/pending moderation/i).first()).toBeVisible();
});

test('anonymous review actions prompt login', async ({ page }) => {
  await mockApi(page);
  await page.route(`${API_HOST}/reviews/summary/**`, route =>
    route.fulfill({
      json: { average: 4.5, count: 2, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } },
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

test('initialize home search from URL and expose card filters', async ({ page }) => {
  await mockApi(page);
  await page.goto('/?search=Synthetic%20Visa');
  await expect(page.getByRole('heading', { name: 'Find Your Perfect Credit Card' })).toBeVisible();
  await expect(page.getByText('Synthetic Visa Classic')).toBeVisible();
  await expect(page.getByRole('combobox', { name: /search credit cards/i })).toHaveValue(
    'Synthetic Visa'
  );
  await page.getByRole('button', { name: /expand/i }).click();
  await expect(page.getByRole('heading', { name: 'Filter Options' })).toBeVisible();
});
