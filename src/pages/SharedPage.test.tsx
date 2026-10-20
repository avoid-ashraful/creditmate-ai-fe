import { render, screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { LanguageProvider } from '../locales';

import SharedPage from './SharedPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderCollection = () =>
  render(
    <MemoryRouter initialEntries={['/saved/shared/collections/travel']}>
      <LanguageProvider>
        <Routes>
          <Route
            path="/saved/shared/collections/:slug"
            element={<SharedPage kind="collection" />}
          />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>
  );

it('opens a collection share anonymously through the collection endpoint', async () => {
  server.use(
    rest.get('*/api/v1/saved/shared/collections/travel/', (req, res, ctx) => {
      expect(req.headers.get('authorization')).toBeNull();
      return res(
        ctx.json({
          name: 'Travel shortlist',
          description: 'For the next trip',
          slug: 'travel',
          cards: [{ card: { id: 42, name: 'Travel Card' }, notes: '' }],
        })
      );
    })
  );
  renderCollection();
  expect(await screen.findByRole('heading', { name: 'Travel shortlist' })).toBeVisible();
  expect(screen.getByText('Travel Card')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('shows the unavailable state when a collection share is private or revoked', async () => {
  server.use(
    rest.get('*/api/v1/saved/shared/collections/travel/', (_req, res, ctx) =>
      res(ctx.status(404), ctx.json({ detail: 'Not found.' }))
    )
  );
  renderCollection();
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Travel shortlist' })).not.toBeInTheDocument();
});
