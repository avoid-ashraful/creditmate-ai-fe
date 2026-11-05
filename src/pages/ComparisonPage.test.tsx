import { fireEvent, screen, within } from '@testing-library/react';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { ShortlistProvider } from '../hooks/ShortlistProvider';
import { server } from '../mocks/jest.setup';
import { renderWithAuth } from '../mocks/renderAuth';

import ComparisonPage from './ComparisonPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// The page reads the shortlist workspace when no comparison is in the
// URL, so it renders inside the provider like the app does.
const page = (
  <ShortlistProvider>
    <ComparisonPage />
  </ShortlistProvider>
);

describe('ComparisonPage save control', () => {
  it('points the empty-state "Browse Credit Cards" link at /cards', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/compare" element={page} />
      </Routes>,
      { route: '/compare' }
    );
    const browse = await screen.findByRole('link', { name: 'Browse Credit Cards' });
    expect(browse).toHaveAttribute('href', '/cards');
  });

  it('prompts anonymous visitors to log in', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/compare" element={page} />
        <Route path="/login" element={<p>login destination</p>} />
      </Routes>,
      { route: '/compare?ids=1' }
    );
    const button = await screen.findByRole('button', { name: 'Save comparison' });
    fireEvent.click(button);
    expect(await screen.findByText('login destination')).toBeInTheDocument();
  });

  it('filters the table with the Differences only toggle and prints from the export button', async () => {
    const printSpy = jest.fn();
    window.print = printSpy;
    renderWithAuth(
      <Routes>
        <Route path="/compare" element={page} />
      </Routes>,
      { route: '/compare?ids=1,2' }
    );

    const toggle = await screen.findByRole('checkbox', { name: 'Differences only' });
    expect(toggle).not.toBeChecked();

    const tableRegion = screen.getByRole('region', { name: 'Compare card features' });
    const rowsBefore = within(tableRegion).getAllByRole('row').length;
    expect(within(tableRegion).getByRole('rowheader', { name: 'Annual fee' })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    const rowsAfter = within(tableRegion).getAllByRole('row').length;
    expect(rowsAfter).toBeLessThan(rowsBefore);
    expect(within(tableRegion).getByRole('rowheader', { name: 'Annual fee' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("names each compared card's bank instead of showing its numeric id", async () => {
    renderWithAuth(
      <Routes>
        <Route path="/compare" element={page} />
      </Routes>,
      { route: '/compare?ids=1' }
    );
    await screen.findByText('Test Credit Card', { selector: '.card-chip-name' });
    expect(screen.getByText('Test Bank', { selector: '.card-chip-bank' })).toBeInTheDocument();
    expect(screen.queryByText(/Bank ID/i)).not.toBeInTheDocument();
  });
});

describe('ComparisonPage shortlist workspace (Phase 3)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('frames the workspace with the flat shortlist header, not the comparison hero', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/compare" element={page} />
      </Routes>,
      { route: '/compare' }
    );
    expect(await screen.findByRole('heading', { name: 'Your shortlist' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Credit Card Comparison' })
    ).not.toBeInTheDocument();
  });

  it('teaches what shortlisting is for when the shortlist is empty', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/compare" element={page} />
      </Routes>,
      { route: '/compare' }
    );
    expect(await screen.findByText(/Nothing is shortlisted yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Credit Cards' })).toHaveAttribute(
      'href',
      '/cards'
    );
  });

  it('groups the shortlist by vertical and launches compare from the cards group', async () => {
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
        {
          vertical: 'cards',
          key: '43',
          name: 'Second Card',
          bankName: 'Other Bank',
          detailHref: '/cards/second',
          cardId: 43,
        },
        {
          vertical: 'deposits',
          key: 'example-fdr',
          name: 'Example FDR',
          bankName: 'Example Bank',
          detailHref: '/deposits/example-fdr',
        },
      ])
    );
    const { container } = renderWithAuth(
      <Routes>
        <Route path="/compare" element={page} />
      </Routes>,
      { route: '/compare' }
    );
    expect(await screen.findByRole('link', { name: /Example Card/ })).toBeInTheDocument();
    await expectNoAxeViolations(container);
    expect(screen.getByRole('link', { name: /Example FDR/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Compare these cards/ })).toHaveAttribute(
      'href',
      '/compare?ids=42,43'
    );
  });
});
