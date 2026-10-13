import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales';
import { AuthClient, authClient } from '../services/auth';

interface RenderAuthOptions {
  /** Entry path for the router. */
  route?: string;
  /** Router state, for example `{ from: '/compare' }`. */
  state?: unknown;
  lang?: 'en' | 'bn';
  /** Defaults to the shared app client, which is what the pages use. */
  client?: AuthClient;
}

/** Split `/path?query` into the pathname and search fields the router expects. */
const toLocation = (route: string) => {
  const url = new URL(route, 'http://localhost');
  return { pathname: url.pathname, search: url.search };
};

/**
 * Render routes inside a router, language provider and auth provider. Tests
 * pass a `<Routes>` tree so navigation can be asserted by the page it reaches.
 */
export const renderWithAuth = (
  routes: React.ReactNode,
  { route = '/', state, lang = 'en', client = authClient }: RenderAuthOptions = {}
) =>
  render(
    <MemoryRouter initialEntries={[{ ...toLocation(route), state }]}>
      <LanguageProvider initialLang={lang}>
        <AuthProvider client={client}>{routes}</AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
