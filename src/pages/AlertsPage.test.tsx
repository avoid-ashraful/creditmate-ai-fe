/**
 * Tests for AlertsPage component.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { AuthProvider } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales/LanguageContext';
import { alertsClient } from '../services/alerts';

import AlertsPage from './AlertsPage';

jest.mock('../hooks/AuthProvider', () => ({
  ...jest.requireActual('../hooks/AuthProvider'),
  useAuth: () => ({ status: 'authenticated', user: null }),
}));

// Mock alertsClient
jest.mock('../services/alerts', () => ({
  alertsClient: {
    listSubscriptions: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    deleteSubscription: jest.fn(),
    listBankFollows: jest.fn(),
    unfollowBank: jest.fn(),
    getBankFollowFeed: jest.fn(),
  },
}));

// Mock analytics
jest.mock('../lib/analytics', () => ({
  analytics: { track: jest.fn() },
  ANALYTICS_EVENTS: { pageView: 'page_view' },
}));

const mockSubscriptions = [
  {
    id: 1,
    card: 5,
    card_name: 'Test Card',
    bank_name: 'Test Bank',
    kind: 'any_change',
    created: '2024-01-15T10:00:00Z',
  },
  { id: 2, card: undefined, kind: 'new_card', created: '2024-01-10T10:00:00Z' },
];

const mockPreferences = { frequency: 'daily', email_enabled: true };

const mockBankFollows = [
  { id: 1, bank: 7, bank_name: 'BRAC Bank', created: '2024-02-01T10:00:00Z' },
];

const renderAlertsPage = () => {
  return render(
    <MemoryRouter initialEntries={['/alerts']}>
      <LanguageProvider>
        <AuthProvider>
          <AlertsPage />
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  (alertsClient.listSubscriptions as jest.Mock).mockResolvedValue({ results: mockSubscriptions });
  (alertsClient.getPreferences as jest.Mock).mockResolvedValue(mockPreferences);
  (alertsClient.updatePreferences as jest.Mock).mockResolvedValue(mockPreferences);
  (alertsClient.deleteSubscription as jest.Mock).mockResolvedValue(undefined);
  (alertsClient.listBankFollows as jest.Mock).mockResolvedValue({ results: [] });
  (alertsClient.unfollowBank as jest.Mock).mockResolvedValue(undefined);
  (alertsClient.getBankFollowFeed as jest.Mock).mockResolvedValue({
    results: [],
    page: 1,
    page_size: 20,
    has_more: false,
  });
});

describe('AlertsPage', () => {
  it('shows loading state initially', () => {
    renderAlertsPage();
    expect(screen.getByText('Loading subscriptions…')).toBeInTheDocument();
  });

  it('shows subscriptions list after loading', async () => {
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getByText('Your Subscriptions')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Card (Test Bank)')).toBeInTheDocument();
    expect(screen.getByText('Any change')).toBeInTheDocument(); // alert kind
    expect(screen.getByText('New cards')).toBeInTheDocument(); // alert kind
  });

  it('shows preferences section', async () => {
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Email notifications')).toBeInTheDocument();
  });

  it('allows changing frequency preference', async () => {
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Delivery frequency');
    await userEvent.selectOptions(select, 'weekly');
    expect(select).toHaveValue('weekly');
  });

  it('allows toggling email notifications', async () => {
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getByLabelText('Email notifications')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Email notifications');
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('saves preferences on button click', async () => {
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getByText('Save preferences')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Save preferences'));
    await waitFor(() => {
      expect(alertsClient.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'daily', email_enabled: true })
      );
    });
  });

  it('shows toast on successful save', async () => {
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getByText('Save preferences')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Save preferences'));
    await waitFor(() => {
      expect(screen.getByText('Preferences saved')).toBeInTheDocument();
    });
  });

  it('deletes subscription on button click', async () => {
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getAllByText('Remove')).toHaveLength(2);
    });
    const removeButtons = screen.getAllByText('Remove');
    await userEvent.click(removeButtons[0]);
    // Deletion is confirmed in the designed dialog (no window.confirm).
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    await waitFor(() => {
      expect(alertsClient.deleteSubscription).toHaveBeenCalledWith(1);
    });
  });

  it('shows empty state when no subscriptions', async () => {
    (alertsClient.listSubscriptions as jest.Mock).mockResolvedValue({ results: [] });
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getByText('No subscriptions yet')).toBeInTheDocument();
    });
  });

  it('shows error state on load failure', async () => {
    (alertsClient.listSubscriptions as jest.Mock).mockRejectedValue(new Error('Network error'));
    renderAlertsPage();
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load alert settings. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('shows followed banks after loading', async () => {
    (alertsClient.listBankFollows as jest.Mock).mockResolvedValue({ results: mockBankFollows });
    renderAlertsPage();
    expect(await screen.findByText('BRAC Bank')).toBeInTheDocument();
    expect(screen.getByText('Banks you follow')).toBeInTheDocument();
  });

  it('shows the honest empty state when the user follows no banks', async () => {
    renderAlertsPage();
    expect(await screen.findByText(/You are not following any bank yet/)).toBeInTheDocument();
  });

  it('shows an error with retry — not the empty state — when followed banks fail to load', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (alertsClient.listBankFollows as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ results: mockBankFollows });
    renderAlertsPage();

    expect(
      await screen.findByText('We could not load the banks you follow. Please try again.')
    ).toBeInTheDocument();
    // A load failure must never masquerade as "you follow nothing".
    expect(screen.queryByText(/You are not following any bank yet/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('BRAC Bank')).toBeInTheDocument();
    expect(alertsClient.listBankFollows).toHaveBeenCalledTimes(2);
  });

  it('renders the bank-follow change feed with old and new values, dated and sourced', async () => {
    (alertsClient.listBankFollows as jest.Mock).mockResolvedValue({ results: mockBankFollows });
    (alertsClient.getBankFollowFeed as jest.Mock).mockResolvedValue({
      results: [
        {
          id: 'cards:11',
          vertical: 'cards',
          product_name: 'BRAC Bank Platinum Credit Card',
          product_key: '42',
          bank_id: 7,
          bank_name: 'BRAC Bank',
          field_name: 'annual_fee',
          old_value: 1500,
          new_value: 2000,
          source: null,
          changed_at: '2026-10-01T10:00:00Z',
        },
        {
          id: 'loans:3',
          vertical: 'loans',
          product_name: 'BRAC Bank Personal Loan',
          product_key: 'brac-personal-loan',
          bank_id: 7,
          bank_name: 'BRAC Bank',
          field_name: 'rate_max',
          old_value: null,
          new_value: 13.5,
          source: 'Bangladesh Bank lending chart',
          changed_at: '2026-09-15T10:00:00Z',
        },
      ],
      page: 1,
      page_size: 20,
      has_more: false,
    });
    const { container } = renderAlertsPage();

    expect(await screen.findByText('Changes at banks you follow')).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'BRAC Bank Platinum Credit Card' })
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
    expect(screen.getByText(/1500/)).toBeInTheDocument();
    expect(screen.getByText(/2000/)).toBeInTheDocument();
    // A null on one side of a change is "Not published", never blanked.
    expect(screen.getByText(/Not published/)).toBeInTheDocument();
    expect(screen.getByText(/Source: Bangladesh Bank lending chart/)).toBeInTheDocument();
  });

  it('appends the next feed page when the API says there is more', async () => {
    (alertsClient.listBankFollows as jest.Mock).mockResolvedValue({ results: mockBankFollows });
    const entry = (id: string, name: string) => ({
      id,
      vertical: 'cards',
      product_name: name,
      product_key: '42',
      bank_id: 7,
      bank_name: 'BRAC Bank',
      field_name: 'annual_fee',
      old_value: 1500,
      new_value: 2000,
      source: null,
      changed_at: '2026-10-01T10:00:00Z',
    });
    (alertsClient.getBankFollowFeed as jest.Mock)
      .mockResolvedValueOnce({
        results: [entry('cards:1', 'First Change Card')],
        page: 1,
        page_size: 1,
        has_more: true,
      })
      .mockResolvedValueOnce({
        results: [entry('cards:2', 'Second Change Card')],
        page: 2,
        page_size: 1,
        has_more: false,
      });
    renderAlertsPage();

    expect(await screen.findByText('First Change Card')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Load more changes' }));
    expect(await screen.findByText('Second Change Card')).toBeInTheDocument();
    expect(alertsClient.getBankFollowFeed).toHaveBeenCalledWith(2);
  });

  it('says no changes yet when followed banks have no recorded changes', async () => {
    (alertsClient.listBankFollows as jest.Mock).mockResolvedValue({ results: mockBankFollows });
    renderAlertsPage();
    expect(
      await screen.findByText('No changes have been recorded at the banks you follow yet.')
    ).toBeInTheDocument();
  });
});
