import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { ToastProvider } from '../components/ui';
import { ShortlistProvider } from '../hooks/ShortlistProvider';
import { AUTH_USER, authUrl } from '../mocks/auth';
import { server } from '../mocks/jest.setup';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient } from '../services/auth';
import { savedService } from '../services/saved';
import { saveSearch } from '../services/savedSearches';

import MyPage from './MyPage';

jest.mock('../services/saved', () => ({
  savedService: {
    getComparisons: jest.fn(),
    getCollections: jest.fn(),
    getScenarios: jest.fn(),
    deleteScenario: jest.fn(),
  },
}));
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockComparisons = savedService.getComparisons as jest.Mock;
const mockCollections = savedService.getCollections as jest.Mock;
const mockScenarios = savedService.getScenarios as jest.Mock;

/**
 * Stateful stand-in for the Phase 3 server saved-searches API: import
 * de-duplicates on name+path+query like the backend, list returns the
 * rows, delete removes one. The page's hook exercises the real flow
 * (import the device list on sign-in, then read the server rows).
 */
interface ServerSearchRow {
  id: number;
  name: string;
  path: string;
  query: string;
  created: string;
}
let serverSearches: ServerSearchRow[] = [];
let nextSearchId = 1;

const savedSearchHandlers = [
  rest.get('*/api/v1/saved/searches/', (_req, res, ctx) =>
    res(
      ctx.json({
        count: serverSearches.length,
        next: null,
        previous: null,
        results: serverSearches,
      })
    )
  ),
  rest.post('*/api/v1/saved/searches/import/', async (req, res, ctx) => {
    const body = (await req.json()) as {
      searches: Array<{ name: string; path: string; query: string }>;
    };
    let imported = 0;
    body.searches.forEach(entry => {
      const exists = serverSearches.some(
        row => row.name === entry.name && row.path === entry.path && row.query === entry.query
      );
      if (!exists) {
        serverSearches.push({ id: nextSearchId++, created: '2026-11-05T00:00:00Z', ...entry });
        imported += 1;
      }
    });
    return res(
      ctx.json({ imported, skipped: body.searches.length - imported, results: serverSearches })
    );
  }),
  rest.delete('*/api/v1/saved/searches/:id/', (req, res, ctx) => {
    const id = Number(req.params.id);
    serverSearches = serverSearches.filter(row => row.id !== id);
    return res(ctx.status(204));
  }),
];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

const routes = (
  <ShortlistProvider>
    <ToastProvider>
      <Routes>
        <Route path="/my" element={<MyPage />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </ToastProvider>
  </ShortlistProvider>
);

const authenticated = async () => {
  authClient.clearLocalSession();
  server.use(
    rest.post(authUrl('login/'), (_req, res, ctx) =>
      res(ctx.json({ access: 'access-1', refresh: 'refresh-1', user: AUTH_USER }))
    ),
    rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER))),
    ...savedSearchHandlers
  );
  await authClient.login({ email: AUTH_USER.email, password: 'pw' });
};

describe('MyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    serverSearches = [];
    nextSearchId = 1;
    mockComparisons.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockCollections.mockResolvedValue([{ id: 9 }]);
    mockScenarios.mockResolvedValue([]);
  });

  it('explains itself to signed-out visitors instead of bouncing to login', async () => {
    renderWithAuth(routes, { route: '/my' });
    expect(
      await screen.findByText('Sign in to see your saved searches, items and alerts.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('groups shortlist, saved searches, saved items, alerts and profile', async () => {
    await authenticated();
    saveSearch(AUTH_USER.id, { name: 'Travel hunt', path: '/cards', query: 'categories=travel' });
    window.localStorage.setItem(
      'creditmate.shortlist.v1',
      JSON.stringify([
        {
          vertical: 'cards',
          key: '42',
          name: 'Example Card',
          bankName: 'Example Bank',
          detailHref: '/cards/example',
          cardId: 42,
        },
      ])
    );
    renderWithAuth(routes, { route: '/my' });

    expect(await screen.findByRole('heading', { name: 'My CreditMate' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your shortlist' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Example Card/ })).toBeInTheDocument();
    // The device-saved search is imported to the account on sign-in and
    // then read back from the server rows (Phase 3).
    const searchLink = await screen.findByRole('link', { name: 'Travel hunt' });
    expect(searchLink).toHaveAttribute('href', '/cards?categories=travel');
    expect(screen.getByRole('link', { name: 'View saved items' })).toHaveAttribute(
      'href',
      '/my/saved'
    );
  });

  it('labels the saved-item counts with what they count', async () => {
    await authenticated();
    renderWithAuth(routes, { route: '/my' });
    // 2 comparisons and 1 collection from the mocked saved service — the
    // numbers must carry their labels, not sit as bare "2 · 1".
    expect(await screen.findByText('2 comparisons · 1 collections')).toBeInTheDocument();
  });

  it('deletes a saved search through the confirm dialog, with a toast', async () => {
    const user = userEvent.setup();
    await authenticated();
    saveSearch(AUTH_USER.id, { name: 'Travel hunt', path: '/cards', query: 'categories=travel' });
    renderWithAuth(routes, { route: '/my' });

    await user.click(await screen.findByRole('button', { name: 'Delete saved search' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete saved search' }));
    expect(await screen.findByText('Saved search deleted.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Travel hunt' })).not.toBeInTheDocument();
  });
});
