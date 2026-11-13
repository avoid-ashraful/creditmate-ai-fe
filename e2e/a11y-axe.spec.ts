import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

import { cards } from './fixtures/cards';
import { API_HOST, mockApi } from './helpers/api';

const detailPath = '/card/synthetic-bank-1/synthetic-visa-classic';
const pages = [
  // The current home is a landing page (no inline card list or filter
  // panel); the filter rail is audited via the discovery-driven pages
  // below (search results, categories, advanced search).
  ['home', '/'],
  ['search results', '/?search=Synthetic'],
  ['comparison with three cards', '/compare?ids=1,2,3'],
  ['card detail', detailPath],
  ['report dialog', detailPath],
  ['travel category', '/category/travel'],
  ['Islamic category', '/category/islamic'],
  ['advanced search', '/search?search=Synthetic'],
  ['quiz', '/perfect-card-finder'],
  ['calculator', '/reward-calculator'],
  ['guides', '/guides'],
  ['glossary', '/glossary'],
  ['login', '/login'],
  ['register', '/register'],
  ['account', '/account'],
  ['alerts', '/alerts'],
  ['unsubscribe', '/unsubscribe?token=a11y-token'],
  ['privacy', '/privacy'],
  ['terms', '/terms'],
  ['methodology', '/methodology'],
  ['404', '/a11y-missing-page'],
] as const;

async function mockAccessiblePages(page: Page) {
  await mockApi(page);
  await page.route(`${API_HOST}/credit-cards/advanced-search/**`, route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: path.endsWith('/sort-options/')
        ? { sort_options: [{ key: 'relevance', label: 'Relevance', description: 'Best match' }] }
        : path.endsWith('/categories/')
        ? { categories: [{ slug: 'travel', name: 'Travel' }] }
        : {
            query: 'Synthetic',
            total: cards.length,
            page: 1,
            page_size: 20,
            results: cards,
            facets: {},
            took: 1,
            source: 'database',
            sort_options: [],
            categories: [],
            normalized_query: {},
          },
    });
  });
  const user = { id: 52, email: 'a11y@example.test' };
  await page.route(`${API_HOST}/auth/login/`, route =>
    route.fulfill({ json: { user, access: 'a11y-access', refresh: 'a11y-refresh' } })
  );
  await page.route(`${API_HOST}/auth/token/refresh/`, route =>
    route.fulfill({ json: { access: 'a11y-access' } })
  );
  await page.route(`${API_HOST}/auth/me/`, route => route.fulfill({ json: user }));
  await page.route(`${API_HOST}/alerts/subscriptions/`, route =>
    route.fulfill({
      json: {
        count: 1,
        results: [
          {
            id: 6,
            card: 1,
            card_name: 'Synthetic Visa Classic',
            bank_name: 'Synthetic Bank 1',
            kind: 'any_change',
            created: '2025-01-01T00:00:00Z',
          },
        ],
      },
    })
  );
  // The alerts page also loads bank follows and their change feed; the
  // generic mockApi fallthrough would feed them card-list payloads,
  // which crash the page. This user follows no banks.
  await page.route(/\/alerts\/bank-follows\/($|\?)/, route =>
    route.fulfill({ json: { count: 0, next: null, previous: null, results: [] } })
  );
  await page.route(/\/alerts\/feed\//, route =>
    route.fulfill({
      json: { results: [], page: 1, page_size: 20, has_more: false, seen_at: null },
    })
  );
  await page.route(`${API_HOST}/alerts/preferences/`, route =>
    route.fulfill({ json: { frequency: 'weekly', email_enabled: true } })
  );
  await page.route(`${API_HOST}/alerts/unsubscribe/a11y-token/`, route =>
    route.fulfill({
      json: {
        confirm_required: true,
        is_active: true,
        kind: 'any_change',
        card_name: 'Synthetic Visa Classic',
      },
    })
  );
}

async function audit(page: Page, name: string) {
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  await test.info().attach(`${name}-axe`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  expect
    .soft(
      results.violations.map(({ id, nodes }) => ({
        id,
        nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
      }))
    )
    .toEqual([]);

  // Axe cannot determine the language of passages. Check actual rendered text,
  // including content inherited through wrappers, rather than just <html lang>.
  // The language-neutral Taka currency symbol (U+09F3) is not a Bengali passage.
  const untaggedBengali = await page.locator('body').evaluate(body => {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const failures: string[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (
        parent &&
        !parent.closest('script, style') &&
        /[\u0980-\u09ef]/.test(node.textContent || '') &&
        parent.closest('[lang]')?.getAttribute('lang') !== 'bn'
      ) {
        failures.push(node.textContent?.trim() || '');
      }
    }
    return failures;
  });
  expect(untaggedBengali).toEqual([]);
}

for (const lang of ['en', 'bn'] as const) {
  test.describe(`${lang} WCAG 2.1 AA`, () => {
    test.beforeEach(async ({ page }) => {
      await mockAccessiblePages(page);
      await page.addInitScript(
        ({ lang }) => {
          localStorage.setItem('user-lang', lang);
          localStorage.setItem('creditmate-theme', 'light');
        },
        { lang }
      );
    });

    for (const [name, path] of pages) {
      test(`${name} has no axe violations`, async ({ page }) => {
        if (name === 'account' || name === 'alerts') {
          await page.goto('/login');
          await page.locator('input[type="email"]').fill('a11y@example.test');
          await page.locator('input[type="password"]').fill('Strong-pass-123');
          await page.locator('button[type="submit"]').click();
          // Login lands on /account, which redirects to /my/profile.
          await expect(page).toHaveURL(/\/my\/profile$/);
        }
        await page.goto(path);
        if (
          ['search results', 'travel category', 'Islamic category', 'advanced search'].includes(
            name
          )
        ) {
          // These routes all fold into the discovery page, whose result
          // list is `.cm-result-card` (the axe mock returns all four
          // fixture cards for every discovery query).
          await expect(page.locator('.cm-result-card')).toHaveCount(4);
        }
        if (name === 'comparison with three cards') {
          await expect(
            page.locator(
              (page.viewportSize()?.width ?? 1280) < 768
                ? '.comparison-mobile-cards'
                : '.comparison-table'
            )
          ).toBeVisible();
        }
        if (name === 'report dialog') {
          await page.locator('.report-issue-btn').click();
          await expect(page.getByRole('dialog')).toBeVisible();
        }
        if (name === 'alerts') {
          await expect(page.locator('#frequency')).toBeVisible();
          await expect(page.locator('.subscription-card')).toHaveCount(1);
        }
        if (name === 'unsubscribe') {
          await expect(page.locator('main button')).toBeVisible();
        }
        await audit(page, name);
      });
    }

    for (const [name, path] of [
      ['home', '/'],
      ['card detail', detailPath],
    ] as const) {
      test(`dark ${name} has no axe violations`, async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('creditmate-theme', 'dark'));
        await page.goto(path);
        await expect(page.locator('html')).toHaveClass(/dark/);
        await audit(page, `dark ${name}`);
      });
    }
  });
}

for (const lang of ['en', 'bn'] as const) {
  test(`${lang} keyboard order, language preference, and dialog focus`, async ({ page }) => {
    await mockAccessiblePages(page);
    await page.addInitScript(() => {
      if (!localStorage.getItem('user-lang')) localStorage.setItem('user-lang', 'en');
      localStorage.setItem('creditmate-theme', 'light');
    });
    await page.goto('/');
    // The shell language toggle names the *other* language in its label.
    const langToggle = page.locator('.cm-lang-toggle').first();
    await expect(langToggle).toBeVisible();
    if (lang === 'bn') {
      await langToggle.click();
      await expect(langToggle).toHaveAttribute('aria-label', /English/);
    }
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    // Reload to verify stored language and begin the tab sequence at the document.
    await page.reload();
    await expect(page.locator('.cm-lang-toggle').first()).toHaveAttribute(
      'aria-label',
      lang === 'bn' ? /English/ : /বাংলা/
    );
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.cm-skip-link');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    expect(
      await page
        .locator('[tabindex]')
        .evaluateAll(elements =>
          elements.some(element => Number(element.getAttribute('tabindex')) > 0)
        )
    ).toBe(false);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    // From the document start, the shell rail follows the skip link:
    // logo, search, then the mode links. A fresh navigation resets the
    // tab starting point (after the skip-link jump it sits at <main>).
    await page.goto('/');
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.cm-rail-logo')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.cm-rail-search')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.cm-rail-mode-link').first()).toBeFocused();

    // Both custom dialogs must contain Tab/Shift+Tab, close on Escape, and
    // return focus to the element that opened them. The details popup
    // opens from a bank hub's card list in the current IA.
    await page.goto('/bank/synthetic-bank-1');
    await expect(page.locator('.card-list-item')).toHaveCount(1);
    const popupTrigger = page.locator('.view-details-btn').first();
    await popupTrigger.focus();
    await page.keyboard.press('Enter');
    await assertDialogKeyboard(page);
    await expect(popupTrigger).toBeFocused();
    await page.goto(detailPath);
    const reportTrigger = page.locator('.report-issue-btn');
    await reportTrigger.focus();
    await page.keyboard.press('Enter');
    await assertDialogKeyboard(page);
    await expect(reportTrigger).toBeFocused();
    await page.route(`${API_HOST}/credit-cards/1/report-issue/`, route =>
      route.fulfill({ status: 201, json: { detail: 'Received' } })
    );
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.locator('#report-message')).toBeFocused();
    await expect(dialog.locator('#report-message')).toHaveAttribute('aria-invalid', 'true');
    await dialog.locator('#report-message').fill('The fee needs checking.');
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.getByRole('status')).toBeVisible();
    await expect(dialog.getByRole('button')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(reportTrigger).toBeFocused();
  });
}

async function assertDialogKeyboard(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const controls = dialog.locator('a[href], button:not([disabled]), input, select, textarea');
  await expect(controls.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(controls.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(controls.first()).toBeFocused();
  await controls.last().focus();
  await page.keyboard.press('Tab');
  await expect(controls.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
}
