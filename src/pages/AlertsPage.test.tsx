/**
 * Tests for AlertsPage component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

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
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderAlertsPage();
    await waitFor(() => {
      expect(screen.getAllByText('Remove')).toHaveLength(2);
    });
    const removeButtons = screen.getAllByText('Remove');
    await userEvent.click(removeButtons[0]);
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
});
