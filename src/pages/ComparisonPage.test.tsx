import { fireEvent, screen } from '@testing-library/react';
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
});
