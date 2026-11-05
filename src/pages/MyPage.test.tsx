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
  savedService: { getComparisons: jest.fn(), getCollections: jest.fn() },
}));
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockComparisons = savedService.getComparisons as jest.Mock;
const mockCollections = savedService.getCollections as jest.Mock;

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
    rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER)))
  );
  await authClient.login({ email: AUTH_USER.email, password: 'pw' });
};

describe('MyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockComparisons.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockCollections.mockResolvedValue([{ id: 9 }]);
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
    const searchLink = screen.getByRole('link', { name: 'Travel hunt' });
    expect(searchLink).toHaveAttribute('href', '/cards?categories=travel');
    expect(screen.getByRole('link', { name: 'View saved items' })).toHaveAttribute(
      'href',
      '/my/saved'
    );
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
