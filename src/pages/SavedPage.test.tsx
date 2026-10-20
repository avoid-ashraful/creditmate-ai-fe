import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { ProtectedRoute } from '../components/ProtectedRoute';
import { AUTH_USER, authUrl } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient } from '../services/auth';

import SavedPage from './SavedPage';

const server = setupServer();
const comparison = {
  id: 7,
  name: 'Weekend trip',
  card_ids: [2, 4],
  cards: [
    { id: 2, name: 'Alpha Card' },
    { id: 4, name: 'Beta Card' },
  ],
  is_public: false,
  share_token: 'share-7',
};
const collection = { id: 9, name: 'Travel cards', description: 'For flights', is_public: false };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
  window.sessionStorage.clear();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
});
afterAll(() => server.close());

const routes = (
  <Routes>
    <Route path="/saved" element={<SavedPage />} />
    <Route path="/login" element={<p>login page</p>} />
  </Routes>
);

const authenticated = async () => {
  // The shared client reads storage only at construction. Establish the session
  // through its login API so both its in-memory and persisted tokens agree.
  authClient.clearLocalSession();
  server.use(
    rest.post(authUrl('login/'), (_req, res, ctx) =>
      res(ctx.json({ access: 'access-1', refresh: 'refresh-1', user: AUTH_USER }))
    ),
    rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER)))
  );
  await authClient.login({ email: AUTH_USER.email, password: 'pw' });
};

describe('SavedPage', () => {
  jest.setTimeout(20000);
  it('lists saved items with headings and accessible action buttons, renames and deletes a comparison', async () => {
    await authenticated();
    let currentName = comparison.name;
    let deleted = false;
    server.use(
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) =>
        res(ctx.json(deleted ? [] : [{ ...comparison, name: currentName }]))
      ),
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) => res(ctx.json([collection]))),
      rest.patch('*/api/v1/saved/comparisons/7/', (req, res, ctx) => {
        currentName = (req.body as { name: string }).name;
        return res(ctx.json({ ...comparison, name: currentName }));
      }),
      rest.delete('*/api/v1/saved/comparisons/7/', (_req, res, ctx) => {
        deleted = true;
        return res(ctx.status(204));
      })
    );
    const prompt = jest.spyOn(window, 'prompt').mockReturnValue('Renamed trip');
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/saved' });

    expect(
      await screen.findByRole('heading', { name: 'Saved comparisons & collections' })
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Comparisons' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Collections' })).toBeVisible();
    expect(await screen.findByText('Weekend trip')).toBeVisible();
    expect(screen.getByText('Alpha Card, Beta Card')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Travel cards' })).toHaveAttribute(
      'href',
      '/saved/collections/9'
    );
    expect(screen.getAllByRole('button', { name: 'Rename' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Copy share link' })).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Rename' })[0]);
    await waitFor(() => expect(screen.getByText('Renamed trip')).toBeVisible());
    expect(prompt).toHaveBeenCalledWith('Rename', 'Weekend trip');
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(screen.queryByText('Renamed trip')).not.toBeInTheDocument());
  });

  it('makes a private comparison public before copying its share link', async () => {
    await authenticated();
    let shareUpdate: unknown;
    server.use(
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) => res(ctx.json([comparison]))),
      rest.patch('*/api/v1/saved/comparisons/7/', (req, res, ctx) => {
        shareUpdate = req.body;
        return res(ctx.json({ ...comparison, is_public: true }));
      }),
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) => res(ctx.json([])))
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/saved' });

    await user.click(await screen.findByRole('button', { name: 'Copy share link' }));
    await waitFor(() => expect(shareUpdate).toEqual({ is_public: true }));
    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toMatch(/\/shared\/share-7$/)
    );
  });

  it('publishes a collection and copies its anonymous collection URL', async () => {
    await authenticated();
    const user = userEvent.setup();
    server.use(
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) => res(ctx.json([collection]))),
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) => res(ctx.json([]))),
      rest.patch('*/api/v1/saved/collections/9/', async (req, res, ctx) => {
        expect(await req.json()).toEqual({ is_public: true });
        return res(ctx.json({ ...collection, is_public: true, slug: 'travel-cards' }));
      })
    );
    renderWithAuth(routes, { route: '/saved' });
    await user.click(await screen.findByRole('button', { name: 'Copy share link' }));
    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toMatch(
        /\/saved\/shared\/collections\/travel-cards$/
      )
    );
  });

  it('reports an API limit error when creating a collection', async () => {
    await authenticated();
    let shareUpdate: unknown;
    server.use(
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) =>
        res(ctx.json([{ ...comparison, share_token: null }]))
      ),
      rest.patch('*/api/v1/saved/comparisons/7/', (req, res, ctx) => {
        shareUpdate = req.body;
        return res(ctx.json({ ...comparison, is_public: true }));
      }),
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) => res(ctx.json([]))),
      rest.post('*/api/v1/saved/collections/', (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ name: ['You have reached the collection limit.'] }))
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/saved' });

    await user.click(await screen.findByRole('button', { name: 'Copy share link' }));
    await waitFor(() => expect(shareUpdate).toEqual({ is_public: true }));
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Another collection');
    await user.click(screen.getByRole('button', { name: 'New collection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You have reached the collection limit.'
    );
  });

  it('shows empty and load-error states with status and alert roles', async () => {
    await authenticated();
    server.use(
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) =>
        res(ctx.delay(100), ctx.json([]))
      ),
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) => res(ctx.json([])))
    );
    const { unmount } = renderWithAuth(routes, { route: '/saved' });
    expect(screen.getByRole('status')).toHaveTextContent('Loading saved items…');
    expect(await screen.findAllByText('Nothing saved yet.')).toHaveLength(2);
    unmount();

    await authenticated();
    server.use(
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) => res(ctx.status(500))),
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) => res(ctx.json([])))
    );
    renderWithAuth(routes, { route: '/saved' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.'
    );
  });

  it('redirects to login with the saved page return path when the session expires', async () => {
    await authenticated();
    server.use(
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) =>
        res(ctx.status(401), ctx.json({ detail: 'expired' }))
      ),
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) =>
        res(ctx.status(401), ctx.json({ detail: 'expired' }))
      ),
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) =>
        res(ctx.status(401), ctx.json({ detail: 'expired' }))
      )
    );
    const LoginDestination = () => {
      const location = useLocation();
      const from = (location.state as { from?: string } | null)?.from ?? 'none';
      return <p>login page; from={from}</p>;
    };
    const protectedRoutes = (
      <Routes>
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    );

    renderWithAuth(protectedRoutes, { route: '/saved?tab=collections' });

    expect(await screen.findByText('login page; from=/saved?tab=collections')).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Saved comparisons & collections' })
    ).not.toBeInTheDocument();
  });
});
