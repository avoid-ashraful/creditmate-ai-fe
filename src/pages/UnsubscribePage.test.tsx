/**
 * Tests for UnsubscribePage component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { LanguageProvider } from '../locales/LanguageContext';
import { alertsClient } from '../services/alerts';

import UnsubscribePage from './UnsubscribePage';

// Mock alertsClient
jest.mock('../services/alerts', () => ({
  alertsClient: {
    getUnsubscribePreview: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

const preview = {
  confirm_required: true,
  is_active: true,
  kind: 'fee_change',
  card_name: 'Test Credit Card',
};

const httpError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status }) as Error & { status: number };

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
  (alertsClient.getUnsubscribePreview as jest.Mock).mockResolvedValue(preview);
});

describe('UnsubscribePage', () => {
  it('shows loading state initially', () => {
    renderUnsubscribePage();
    expect(screen.getByText('Loading your subscription…')).toBeInTheDocument();
  });

  it('shows what will be cancelled and does not unsubscribe until the button is clicked', async () => {
    renderUnsubscribePage();

    expect(
      await screen.findByText('This link is for: Fee changes — Test Credit Card')
    ).toBeInTheDocument();
    expect(alertsClient.getUnsubscribePreview).toHaveBeenCalledWith('valid-token');
    expect(alertsClient.unsubscribe).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Unsubscribe me' })).toBeInTheDocument();
  });

  it('warns when the alert is already off', async () => {
    (alertsClient.getUnsubscribePreview as jest.Mock).mockResolvedValue({
      ...preview,
      is_active: false,
    });
    renderUnsubscribePage();

    expect(await screen.findByText(/already off/)).toBeInTheDocument();
  });

  it('shows success state only after the confirm click posts the unsubscribe', async () => {
    (alertsClient.unsubscribe as jest.Mock).mockResolvedValue({
      detail: 'Unsubscribed successfully',
    });
    const user = userEvent;
    renderUnsubscribePage();

    await user.click(await screen.findByRole('button', { name: 'Unsubscribe me' }));

    await waitFor(() => {
      expect(
        screen.getByText('You have been unsubscribed from all alert emails.')
      ).toBeInTheDocument();
    });
    expect(alertsClient.unsubscribe).toHaveBeenCalledTimes(1);
    expect(alertsClient.unsubscribe).toHaveBeenCalledWith('valid-token');
    expect(screen.getByText('Back to alert settings')).toBeInTheDocument();
  });

  it('shows error state for an invalid token on preview', async () => {
    (alertsClient.getUnsubscribePreview as jest.Mock).mockRejectedValue(httpError(404));
    renderUnsubscribePage();
    await waitFor(() => {
      expect(
        screen.getByText('This unsubscribe link is invalid or has expired.')
      ).toBeInTheDocument();
    });
    expect(alertsClient.unsubscribe).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('shows an error when confirming fails', async () => {
    (alertsClient.unsubscribe as jest.Mock).mockRejectedValue(new TypeError('Network error'));
    const user = userEvent;
    renderUnsubscribePage();

    await user.click(await screen.findByRole('button', { name: 'Unsubscribe me' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows error state for a network error on preview', async () => {
    (alertsClient.getUnsubscribePreview as jest.Mock).mockRejectedValue(
      new TypeError('Network error')
    );
    renderUnsubscribePage();
    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows error when no token in URL and calls no endpoint', () => {
    renderUnsubscribePage('');
    expect(
      screen.getByText('This unsubscribe link is invalid or has expired.')
    ).toBeInTheDocument();
    expect(alertsClient.getUnsubscribePreview).not.toHaveBeenCalled();
  });

  it('has link to home page on error', async () => {
    (alertsClient.getUnsubscribePreview as jest.Mock).mockRejectedValue(httpError(400));
    renderUnsubscribePage();
    await waitFor(() => {
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });
  });
});
