/**
 * Tests for UnsubscribePage component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { LanguageProvider } from '../locales/LanguageContext';
import { alertsClient } from '../services/alerts';

import UnsubscribePage from './UnsubscribePage';

// Mock alertsClient
jest.mock('../services/alerts', () => ({
  alertsClient: {
    unsubscribe: jest.fn(),
  },
}));

const renderUnsubscribePage = (token = 'valid-token') => {
  return render(
    <MemoryRouter initialEntries={[`/unsubscribe?token=${token}`]}>
      <LanguageProvider>
        <UnsubscribePage />
      </LanguageProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UnsubscribePage', () => {
  it('shows loading state initially', () => {
    renderUnsubscribePage();
    expect(screen.getByText('Unsubscribing…')).toBeInTheDocument();
  });

  it('shows success state after successful unsubscribe', async () => {
    (alertsClient.unsubscribe as jest.Mock).mockResolvedValue({
      detail: 'Unsubscribed successfully',
    });
    renderUnsubscribePage();
    await waitFor(() => {
      expect(
        screen.getByText('You have been unsubscribed from all alert emails.')
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Back to alert settings')).toBeInTheDocument();
  });

  it('shows error state for invalid token', async () => {
    const error = new Error('Invalid token');
    (error as Error & { status: number }).status = 400;
    (alertsClient.unsubscribe as jest.Mock).mockRejectedValue(error);
    renderUnsubscribePage();
    await waitFor(() => {
      expect(
        screen.getByText('This unsubscribe link is invalid or has expired.')
      ).toBeInTheDocument();
    });
  });

  it('shows error state for network error', async () => {
    (alertsClient.unsubscribe as jest.Mock).mockRejectedValue(new TypeError('Network error'));
    renderUnsubscribePage();
    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows error when no token in URL', () => {
    renderUnsubscribePage('');
    expect(
      screen.getByText('This unsubscribe link is invalid or has expired.')
    ).toBeInTheDocument();
  });

  it('has link to home page on error', async () => {
    const error = new Error('Invalid token');
    (error as Error & { status: number }).status = 400;
    (alertsClient.unsubscribe as jest.Mock).mockRejectedValue(error);
    renderUnsubscribePage();
    await waitFor(() => {
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });
  });
});
