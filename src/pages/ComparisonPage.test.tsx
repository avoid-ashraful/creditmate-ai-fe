import { fireEvent, screen, within } from '@testing-library/react';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { server } from '../mocks/jest.setup';
import { renderWithAuth } from '../mocks/renderAuth';

import ComparisonPage from './ComparisonPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ComparisonPage save control', () => {
  it('prompts anonymous visitors to log in', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/compare" element={<ComparisonPage />} />
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
        <Route path="/compare" element={<ComparisonPage />} />
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
        <Route path="/compare" element={<ComparisonPage />} />
      </Routes>,
      { route: '/compare?ids=1' }
    );
    await screen.findByText('Test Credit Card', { selector: '.card-chip-name' });
    expect(screen.getByText('Test Bank', { selector: '.card-chip-bank' })).toBeInTheDocument();
    expect(screen.queryByText(/Bank ID/i)).not.toBeInTheDocument();
  });
});
