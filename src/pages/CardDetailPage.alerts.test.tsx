/**
 * Tests for CardDetailPage watch toggle functionality.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AUTH_STATUS, AuthStatus } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales/LanguageContext';
import { alertsClient } from '../services/alerts';
import { apiService } from '../services/api';

import CardDetailPage from './CardDetailPage';

let mockAuthStatus = 'anonymous';
jest.mock('../hooks/AuthProvider', () => ({
  ...jest.requireActual('../hooks/AuthProvider'),
  useAuth: () => ({ status: mockAuthStatus, user: null }),
}));

// Mock apiService
jest.mock('../services/api', () => ({
  apiService: {
    getCreditCards: jest.fn(),
    transformCreditCard: jest.fn(),
  },
}));

// Mock alertsClient
jest.mock('../services/alerts', () => ({
  alertsClient: {
    listSubscriptions: jest.fn(),
    createSubscription: jest.fn(),
    deleteSubscription: jest.fn(),
  },
}));

// Mock analytics
jest.mock('../lib/analytics', () => ({
  analytics: { track: jest.fn() },
  ANALYTICS_EVENTS: { cardDetailView: 'card_detail_view', pageView: 'page_view' },
}));

const mockCard = {
  id: 5,
  bank_id: 1,
  bank_name: 'Test Bank',
  name: 'Test Card',
  annual_fee: '1000',
  interest_rate_apr: '20',
  lounge_access_international: '5 visits',
  lounge_access_domestic: '3 visits',
  cash_advance_fee: '3%',
  late_payment_fee: '5%',
  annual_fee_waiver_policy: { spendThreshold: 50000, conditions: 'Spend BDT 50,000/year' },
  reward_points_policy: '1 point per BDT 100',
  additional_features: ['Feature 1', 'Feature 2'],
  is_active: true,
  sourceUrl: 'https://example.com',
  modified: '2024-01-15T10:00:00Z',
  images: [{ small: 'small.jpg', full: 'full.jpg' }],
};

const renderCardDetailPage = (authStatus: AuthStatus = AUTH_STATUS.anonymous) => {
  mockAuthStatus = authStatus;
  return render(
    <MemoryRouter initialEntries={['/card/test-bank/test-card']}>
      <LanguageProvider>
        <Routes>
          <Route path="/card/:bankSlug/:cardSlug" element={<CardDetailPage />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  (apiService.transformCreditCard as jest.Mock).mockImplementation(c => ({
    ...c,
    bankName: c.bank_name,
    bankId: c.bank_id,
    annualFee: c.annual_fee ? Number(c.annual_fee) : null,
    interestRateApr: c.interest_rate_apr ? Number(c.interest_rate_apr) : null,
    loungeAccessInternational: c.lounge_access_international || null,
    loungeAccessDomestic: c.lounge_access_domestic || null,
    cashAdvanceFee: c.cash_advance_fee || '',
    latePaymentFee: c.late_payment_fee || '',
    annualFeeWaiverPolicy: c.annual_fee_waiver_policy || null,
    rewardPointsPolicy: c.reward_points_policy || '',
    additionalFeatures: c.additional_features || [],
    isActive: c.is_active,
    sourceUrl: c.sourceUrl || '',
    lastUpdated: c.modified ? new Date(c.modified) : null,
    images: c.images || [],
  }));
  (apiService.getCreditCards as jest.Mock).mockResolvedValue({
    results: [mockCard],
  });
  (alertsClient.listSubscriptions as jest.Mock).mockResolvedValue({ results: [] });
  (alertsClient.createSubscription as jest.Mock).mockResolvedValue({
    id: 1,
    card: 5,
    kind: 'any_change',
    created: '2024-01-15T10:00:00Z',
  });
  (alertsClient.deleteSubscription as jest.Mock).mockResolvedValue(undefined);
});

describe('CardDetailPage - Watch Toggle', () => {
  it('shows login prompt when anonymous', async () => {
    renderCardDetailPage(AUTH_STATUS.anonymous);
    await waitFor(() => {
      expect(
        screen.getByText('Log in to watch this card and get email alerts.')
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('Create an account to watch this card and get email alerts.')
    ).toBeInTheDocument();
    // Each prompt's link is labelled for where it goes.
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register'
    );
    screen
      .getAllByRole('link', { name: 'Log in' })
      .forEach(link => expect(link).toHaveAttribute('href', '/login'));
  });

  it('shows watch button when authenticated and not watching', async () => {
    renderCardDetailPage(AUTH_STATUS.authenticated);
    await waitFor(() => {
      expect(screen.getByText('Watch this card')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Watch this card' })).toBeInTheDocument();
  });

  it('shows watching state when authenticated and already watching', async () => {
    (alertsClient.listSubscriptions as jest.Mock).mockResolvedValue({
      results: [{ id: 1, card: 5, kind: 'any_change', created: '2024-01-15T10:00:00Z' }],
    });
    renderCardDetailPage(AUTH_STATUS.authenticated);
    await waitFor(() => {
      expect(screen.getByText('Watching this card')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Watching this card' })).toBeInTheDocument();
  });

  it('creates subscription when clicking watch button', async () => {
    renderCardDetailPage(AUTH_STATUS.authenticated);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watch this card' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Watch this card' }));
    await waitFor(() => {
      expect(alertsClient.createSubscription).toHaveBeenCalledWith({ card: 5, kind: 'any_change' });
    });
  });

  it('deletes subscription when clicking unwatch button', async () => {
    (alertsClient.listSubscriptions as jest.Mock).mockResolvedValue({
      results: [{ id: 1, card: 5, kind: 'any_change', created: '2024-01-15T10:00:00Z' }],
    });
    renderCardDetailPage(AUTH_STATUS.authenticated);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watching this card' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Watching this card' }));
    await waitFor(() => {
      expect(alertsClient.deleteSubscription).toHaveBeenCalledWith(1);
    });
  });

  it('shows error toast on create failure', async () => {
    (alertsClient.createSubscription as jest.Mock).mockRejectedValue(new Error('Failed'));
    renderCardDetailPage(AUTH_STATUS.authenticated);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watch this card' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Watch this card' }));
    await waitFor(() => {
      expect(screen.getByText('Failed to create subscription')).toBeInTheDocument();
    });
  });
});
