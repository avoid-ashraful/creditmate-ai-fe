/**
 * RecommendationQuiz (redesign Phase 2 rebuild, plan Section 4.10).
 *
 * Pins the new contract: constraint questions first (income, Islamic,
 * fee, network, bank), nothing preselected, constraints really filter,
 * results are ResultCards with working shortlist actions, and "See
 * all cards" lands on /cards WITH the answers as filters. Legacy
 * shared links (quiz_result) keep decoding.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { ShortlistProvider } from '../hooks/ShortlistProvider';
import { apiService } from '../services/api';
import { fetchAllBanks } from '../services/banks';
import * as quizAlgorithm from '../utils/quizScoringAlgorithm';

import RecommendationQuiz from './RecommendationQuiz';

jest.mock('../services/api');
jest.mock('../services/banks', () => ({ fetchAllBanks: jest.fn() }));
jest.mock('../utils/seo');

const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve()),
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
  configurable: true,
});

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockFetchBanks = fetchAllBanks as jest.Mock;

const banks = [
  {
    id: 1,
    name: 'Bank A',
    logo: '',
    website: '',
    is_active: true,
    credit_card_count: 1,
    created: '',
    modified: '',
  },
  {
    id: 2,
    name: 'Bank B',
    logo: '',
    website: '',
    is_active: true,
    credit_card_count: 1,
    created: '',
    modified: '',
  },
  {
    id: 3,
    name: 'Bank C',
    logo: '',
    website: '',
    is_active: true,
    credit_card_count: 1,
    created: '',
    modified: '',
  },
];

const mockCards = [
  {
    id: 1,
    name: 'Travel Card',
    annualFee: 5000,
    interestRateApr: 20,
    loungeAccessInternational: '6 visits',
    loungeAccessDomestic: 'Unlimited',
    cashAdvanceFee: '100',
    latePaymentFee: '500',
    annualFeeWaiverPolicy: { spendThreshold: 500000 },
    rewardPointsPolicy: '2x points on travel',
    additionalFeatures: ['travel insurance'],
    sourceUrl: '',
    isActive: true,
    lastUpdated: null,
    images: [],
    bankId: 1,
    bankName: 'Bank A',
    minMonthlyIncome: 30000,
    cardNetwork: 'visa',
    isIslamic: false,
  },
  {
    id: 2,
    name: 'Cashback Card',
    annualFee: 0,
    interestRateApr: 21,
    loungeAccessInternational: null,
    loungeAccessDomestic: null,
    cashAdvanceFee: '150',
    latePaymentFee: '500',
    annualFeeWaiverPolicy: null,
    rewardPointsPolicy: '5% cashback on shopping',
    additionalFeatures: [],
    sourceUrl: '',
    isActive: true,
    lastUpdated: null,
    images: [],
    bankId: 2,
    bankName: 'Bank B',
    minMonthlyIncome: null,
    cardNetwork: 'mastercard',
    isIslamic: false,
  },
  {
    id: 3,
    name: 'Premium Card',
    annualFee: 15000,
    interestRateApr: 18,
    loungeAccessInternational: '10 visits',
    loungeAccessDomestic: '20 visits',
    cashAdvanceFee: '50',
    latePaymentFee: '500',
    annualFeeWaiverPolicy: { spendThreshold: 1000000 },
    rewardPointsPolicy: '5x points on travel, 3x on dining',
    additionalFeatures: ['concierge', 'travel insurance'],
    sourceUrl: '',
    isActive: true,
    lastUpdated: null,
    images: [],
    bankId: 3,
    bankName: 'Bank C',
    minMonthlyIncome: 100000,
    cardNetwork: 'amex',
    isIslamic: false,
  },
];

const renderQuiz = () =>
  render(
    <BrowserRouter>
      <ShortlistProvider>
        <RecommendationQuiz />
      </ShortlistProvider>
    </BrowserRouter>
  );

const clickOption = async (name: string | RegExp) => {
  await userEvent.click(screen.getByRole('button', { name }));
};

const clickNext = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Next|See Results/i }));
};

/** Answer every question with the permissive choice and finish. */
const completeQuiz = async () => {
  await clickOption(/Above BDT 100,000/);
  await clickNext();
  await clickOption('No preference');
  await clickNext();
  await clickOption('High');
  await clickNext();
  await clickOption('No preference');
  await clickNext();
  await clickOption('Any bank');
  await clickNext();
  await clickOption(/50,000/);
  await clickNext();
  await clickOption('Shopping');
  await clickNext();
  await clickOption('Occasional');
  await clickNext();
};

describe('RecommendationQuiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/perfect-card-finder');
    mockFetchBanks.mockResolvedValue(banks);
    mockApiService.getCreditCards.mockResolvedValue({
      count: mockCards.length,
      next: null,
      previous: null,
      results: mockCards.map(card => ({
        id: card.id,
        name: card.name,
        annual_fee: card.annualFee?.toString() || null,
        interest_rate_apr: card.interestRateApr?.toString() || null,
        lounge_access_international: card.loungeAccessInternational || undefined,
        lounge_access_domestic: card.loungeAccessDomestic || undefined,
        cash_advance_fee: card.cashAdvanceFee,
        late_payment_fee: card.latePaymentFee,
        annual_fee_waiver_policy: card.annualFeeWaiverPolicy,
        reward_points_policy: card.rewardPointsPolicy,
        additional_features: card.additionalFeatures,
        is_active: card.isActive,
        bank_name: card.bankName,
        images: card.images,
      })),
    });
    mockApiService.transformCreditCard.mockImplementation(card => mockCards[card.id - 1] as never);
  });

  describe('API and loading', () => {
    it('fetches cards on mount', async () => {
      renderQuiz();
      await waitFor(() => expect(mockApiService.getCreditCards).toHaveBeenCalled());
    });

    it('shows error state when API fails', async () => {
      mockApiService.getCreditCards.mockRejectedValue(new Error('API Error'));
      renderQuiz();
      expect(await screen.findByText(/couldn't load the cards/i)).toBeInTheDocument();
    });

    it('shows empty state when no cards available', async () => {
      mockApiService.getCreditCards.mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });
      renderQuiz();
      expect(await screen.findByText(/No cards available/i)).toBeInTheDocument();
    });
  });

  describe('question flow', () => {
    it('starts at the income constraint question with nothing preselected', async () => {
      renderQuiz();
      expect(await screen.findByText(/What is your monthly income/i)).toBeInTheDocument();
      const options = screen.getAllByRole('button', { name: /BDT/ });
      options.forEach(option => expect(option).toHaveAttribute('aria-pressed', 'false'));
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    });

    it('asks constraint questions before preference questions', async () => {
      renderQuiz();
      await screen.findByText(/What is your monthly income/i);
      await clickOption(/Up to BDT 30,000/);
      await clickNext();
      expect(await screen.findByText(/Shariah-compliant/i)).toBeInTheDocument();
      await clickOption('Islamic cards only');
      await clickNext();
      expect(await screen.findByText(/annual fee tolerance/i)).toBeInTheDocument();
      await clickOption('No fees');
      await clickNext();
      expect(await screen.findByText(/card network/i)).toBeInTheDocument();
      await clickOption('Visa');
      await clickNext();
      expect(await screen.findByText(/specific bank/i)).toBeInTheDocument();
      await clickOption('Any bank');
      await clickNext();
      // Only now do preference questions start.
      expect(await screen.findByText(/typical month/i)).toBeInTheDocument();
    });

    it('previous button is disabled on the first step and enabled later', async () => {
      renderQuiz();
      await screen.findByText(/What is your monthly income/i);
      expect(screen.getByRole('button', { name: /Back/i })).toBeDisabled();
      await clickOption(/Up to BDT 30,000/);
      await clickNext();
      expect(await screen.findByText(/Shariah-compliant/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back/i })).toBeEnabled();
    });

    it('preference steps can be skipped without inventing an answer', async () => {
      renderQuiz();
      await screen.findByText(/What is your monthly income/i);
      await clickOption(/Above BDT 100,000/);
      await clickNext();
      await clickOption('No preference');
      await clickNext();
      await clickOption('High');
      await clickNext();
      await clickOption('No preference');
      await clickNext();
      await clickOption('Any bank');
      await clickNext();
      // Spend step: skip it, then skip use and travel too.
      expect(await screen.findByText(/typical month/i)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(await screen.findByText(/Your Top Recommendations/i)).toBeInTheDocument();
    });
  });

  describe('results', () => {
    it('renders recommended cards with reasons and working shortlist actions', async () => {
      renderQuiz();
      await screen.findByText(/What is your monthly income/i);
      await completeQuiz();
      expect(await screen.findByText(/Your Top Recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/cards match your answers/)).toBeInTheDocument();
      const shortlistButtons = screen.getAllByRole('button', { name: /shortlist/i });
      expect(shortlistButtons.length).toBeGreaterThan(0);
      await userEvent.click(shortlistButtons[0]);
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /in shortlist/i }).length).toBeGreaterThan(0)
      );
    });

    it('constraints really filter: a no-fee answer excludes fee-charging cards', async () => {
      renderQuiz();
      await screen.findByText(/What is your monthly income/i);
      await clickOption(/Above BDT 100,000/);
      await clickNext();
      await clickOption('No preference');
      await clickNext();
      await clickOption('No fees');
      await clickNext();
      await clickOption('No preference');
      await clickNext();
      await clickOption('Any bank');
      await clickNext();
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(await screen.findByText(/Your Top Recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/1 cards match your answers/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cashback Card' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Premium Card' })).not.toBeInTheDocument();
      // The applied filter is shown as a chip.
      expect(screen.getByText('No annual fee')).toBeInTheDocument();
    });

    it('"See All Cards" navigates to /cards WITH the quiz filters applied', async () => {
      renderQuiz();
      await screen.findByText(/What is your monthly income/i);
      await clickOption(/Up to BDT 30,000/);
      await clickNext();
      await clickOption('Islamic cards only');
      await clickNext();
      await clickOption('No fees');
      await clickNext();
      await clickOption('Visa');
      await clickNext();
      await clickOption('Bank A');
      await clickNext();
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
      const seeAll = await screen.findByRole('button', { name: /See All Cards/i });
      await userEvent.click(seeAll);
      expect(window.location.pathname).toBe('/cards');
      const params = new URLSearchParams(window.location.search);
      expect(params.get('max_min_monthly_income')).toBe('30000');
      expect(params.get('include_unknown_income')).toBe('true');
      expect(params.get('is_islamic')).toBe('true');
      expect(params.get('no_annual_fee')).toBe('true');
      expect(params.get('card_network')).toBe('visa');
      expect(params.get('bank_ids')).toBe('1');
    });

    it('shows share and retake actions; retake returns to the first question unanswered', async () => {
      renderQuiz();
      await screen.findByText(/What is your monthly income/i);
      await completeQuiz();
      expect(await screen.findByText(/Share Results/i)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /Retake Quiz/i }));
      expect(await screen.findByText(/What is your monthly income/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    });
  });

  describe('shared results', () => {
    it('decodes and loads shared quiz results from URL param', async () => {
      const answers = {
        monthlySpend: 100000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'high' as const,
        cardTier: 'premium' as const,
      };
      const encoded = quizAlgorithm.encodeQuizResult({ cardIds: [1, 3], answers });
      window.history.replaceState({}, '', `/perfect-card-finder?quiz_result=${encoded}`);
      renderQuiz();
      expect(await screen.findByText(/Your Top Recommendations/i)).toBeInTheDocument();
    });

    it('ignores a shared link whose cards no longer exist', async () => {
      const answers = {
        monthlySpend: 100000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'high' as const,
        cardTier: 'premium' as const,
      };
      const encoded = quizAlgorithm.encodeQuizResult({ cardIds: [999], answers });
      window.history.replaceState({}, '', `/perfect-card-finder?quiz_result=${encoded}`);
      renderQuiz();
      expect(await screen.findByText(/What is your monthly income/i)).toBeInTheDocument();
    });
  });
});
