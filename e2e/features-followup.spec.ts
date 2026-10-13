import { expect, test } from '@playwright/test';

import { API_HOST, mockApi } from './helpers/api';

const user = { id: 52, email: 'e2e@example.test' };
const session = { user, access: 'access-e2e', refresh: 'refresh-e2e' };

async function mockAuth(page: import('@playwright/test').Page) {
  await page.route(`${API_HOST}/auth/**`, async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/register/')) {
      await route.fulfill({ status: 201, json: { detail: 'Verification email sent.' } });
    } else if (path.endsWith('/login/')) {
      await route.fulfill({ json: session });
    } else if (path.endsWith('/logout/')) {
      await route.fulfill({ status: 200, json: { detail: 'Logged out.' } });
    } else if (path.endsWith('/password-reset/')) {
      await route.fulfill({ status: 200, json: { detail: 'ok' } });
    } else if (path.endsWith('/token/refresh/')) {
      await route.fulfill({ json: { access: 'access-refreshed' } });
    } else if (path.endsWith('/me/')) {
      const authorization = route.request().headers().authorization;
      await route.fulfill({
        status: authorization === 'Bearer access-refreshed' ? 200 : 401,
        json: authorization === 'Bearer access-refreshed' ? user : { detail: 'expired' },
      });
    } else {
      await route.fulfill({ status: 200, json: {} });
    }
  });
}

test('register, login, logout and forgot password use mocked auth endpoints', async ({ page }) => {
  await mockApi(page);
  await mockAuth(page);
  await page.goto('/register');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('Strong-pass-123');
  await page.getByLabel(/confirm password/i).fill('Strong-pass-123');
  await page.getByRole('button', { name: /create account|register/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('Strong-pass-123');
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByRole('button', { name: new RegExp(user.email) }).click();
  await page
    .locator('#main-content')
    .getByRole('button', { name: /log out/i })
    .click();
  await expect(page.getByRole('link', { name: /log in/i }).first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('Strong-pass-123');
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/account$/);

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('button', { name: /reset|send/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
});

test('protected account redirects to login and resumes after successful login', async ({
  page,
}) => {
  await mockApi(page);
  await mockAuth(page);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('pw');
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('strong').filter({ hasText: user.email })).toBeVisible();
});

test('stored refresh token refreshes an expired access token after a 401', async ({ page }) => {
  await mockApi(page);
  await mockAuth(page);
  await page.addInitScript(() => sessionStorage.setItem('creditmate.auth.refresh', 'refresh-e2e'));
  await page.goto('/account');
  await expect(page.getByRole('strong').filter({ hasText: user.email })).toBeVisible();
});

test('dark mode persists across reloads', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('reduced motion disables page transition transforms', async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const transition = page.locator('.page-transition');
  await expect(transition).toBeVisible();
  await expect(transition).toHaveCSS('transform', 'none');
});

test('analytics opt-out suppresses tracking after reload', async ({ page }) => {
  test.setTimeout(60_000);
  await mockApi(page);
  const analyticsCalls: string[] = [];
  page.on('request', request => {
    if (/analytics|collect|posthog/i.test(request.url())) analyticsCalls.push(request.url());
  });
  await page.addInitScript(() => localStorage.setItem('creditmate.analytics.optOut', 'true'));
  await page.goto('/');
  await page.reload();
  expect(analyticsCalls).toEqual([]);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('creditmate.analytics.optOut')))
    .toBe('true');
});

test('robots and sitemap are served from the production build', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  const sitemap = await request.get('/sitemap.xml');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain('Sitemap:');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain('<urlset');
});

test('page metadata includes title, canonical and parseable JSON-LD where provided', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/guides');
  await expect(page).toHaveTitle(/guides/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/guides$/);
  const jsonLd = page.locator('script[type="application/ld+json"]');
  await expect(jsonLd).toHaveCount(2);
  for (const script of await jsonLd.all()) {
    const contents = await script.textContent();
    expect(() => JSON.parse(contents || '')).not.toThrow();
  }

  await page.goto('/glossary');
  await expect(page).toHaveTitle(/glossary/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/glossary$/);
});

test('experiment assignment remains stable across reloads', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  const first = await page.evaluate(() => localStorage.getItem('creditmate.experiments.exposures'));
  await page.reload();
  const second = await page.evaluate(() =>
    localStorage.getItem('creditmate.experiments.exposures')
  );
  expect(first).toBeTruthy();
  expect(second).toBe(first);
});

test('guides and glossary routes render their content', async ({ page }) => {
  await mockApi(page);
  await page.goto('/guides');
  await expect(page.getByRole('heading', { name: /guides/i }).first()).toBeVisible();
  await page.goto('/glossary');
  await expect(page.getByRole('heading', { name: 'Financial Terms Glossary' })).toBeVisible();
  await expect(page.getByLabel('Search glossary')).toBeVisible();
});
