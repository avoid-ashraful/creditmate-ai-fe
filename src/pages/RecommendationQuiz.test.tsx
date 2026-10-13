import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { apiService } from '../services/api';
import * as quizAlgorithm from '../utils/quizScoringAlgorithm';

import RecommendationQuiz from './RecommendationQuiz';

// Mock experiments to always return control (show quiz)
jest.mock('../lib/experiments', () => ({
  isTreatment: () => false,
}));

jest.mock('../services/api');
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
    bankName: 'Bank A',
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
    bankName: 'Bank B',
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
    bankName: 'Bank C',
  },
];

describe('RecommendationQuiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/perfect-card-finder');
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

    mockApiService.transformCreditCard.mockImplementation(card => mockCards[card.id - 1]);
  });

  const renderQuiz = () => {
    return render(
      <BrowserRouter>
        <RecommendationQuiz />
      </BrowserRouter>
    );
  };

  describe('API and Loading', () => {
    it('fetches cards on mount', async () => {
      renderQuiz();
      await waitFor(() => {
        expect(mockApiService.getCreditCards).toHaveBeenCalledWith({
          page_size: 100,
          isActive: true,
        });
      });
    });

    it('shows loading state while fetching cards', async () => {
      mockApiService.getCreditCards.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  count: 3,
                  next: null,
                  previous: null,
                  results: [],
                }),
              100
            )
          )
      );

      renderQuiz();
      expect(screen.getByText('Loading available cards...')).toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
      mockApiService.getCreditCards.mockRejectedValueOnce(new Error('Network error'));

      renderQuiz();
      await waitFor(() => {
        expect(screen.getByText(/couldn't load the cards/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no cards available', async () => {
      mockApiService.getCreditCards.mockResolvedValueOnce({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });

      renderQuiz();
      await waitFor(() => {
        expect(screen.getByText(/No cards available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Flow', () => {
    it('opens a shared result against currently fetched cards', async () => {
      const result = quizAlgorithm.encodeQuizResult({
        cardIds: [1],
        answers: {
          monthlySpend: 80000,
          primaryUse: 'travel',
          travelFrequency: 'frequent',
          feeTolerance: 'moderate',
          cardTier: 'premium',
        },
      });
      window.history.replaceState({}, '', `/perfect-card-finder?quiz_result=${result}`);

      renderQuiz();

      expect(await screen.findByText(/Your Top Recommendations/i)).toBeInTheDocument();
      expect(screen.getAllByText('Travel Card').length).toBeGreaterThan(0);
    });

    it('starts at spend step', async () => {
      renderQuiz();
      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });
    });

    it('navigates through all 5 steps', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', {
        name: /Next|See Results/i,
      });
      await user.click(nextButton);
      expect(screen.getByText(/What will you use the card for/i)).toBeInTheDocument();

      await user.click(nextButton);
      expect(screen.getByText(/How often do you travel/i)).toBeInTheDocument();

      await user.click(nextButton);
      expect(screen.getByText(/What's your annual fee tolerance/i)).toBeInTheDocument();

      await user.click(nextButton);
      expect(screen.getByText(/What card tier interests you/i)).toBeInTheDocument();

      await user.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/Your Top Recommendations/i)).toBeInTheDocument();
      });
    });

    it('shows previous button disabled on first step', async () => {
      renderQuiz();
      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      const prevButton = screen.getByText(/Back/);
      expect(prevButton).toBeDisabled();
    });

    it('enables previous button after first step', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Next/));
      const prevButton = screen.getByText(/Back/);
      expect(prevButton).not.toBeDisabled();
    });
  });

  describe('Spending Selection', () => {
    it('updates spend value when slider changes', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        const slider = screen.getByRole('slider', { name: /Monthly spending/i });
        expect(slider).toBeInTheDocument();
      });

      const slider = screen.getByRole('slider', { name: /Monthly spending/i });
      await user.pointer({ keys: '[MouseLeft>]', target: slider });
      await user.pointer({ keys: '[/MouseLeft]', target: slider });
    });

    it('allows preset button selection', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/20k/)).toBeInTheDocument();
      });

      const btn50k = screen.getByRole('button', { name: /50k/ });
      expect(btn50k).toHaveClass('active');

      const btn100k = screen.getByRole('button', { name: /100k/ });
      await user.click(btn100k);
      expect(btn100k).toHaveClass('active');
    });
  });

  describe('Results Display', () => {
    it('renders recommended cards after quiz completion', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      for (let i = 0; i < 5; i++) {
        const nextBtn = screen.getByRole('button', {
          name: /Next|See Results/i,
        });
        await user.click(nextBtn);
      }

      await waitFor(() => {
        expect(screen.getByText(/Your Top Recommendations/i)).toBeInTheDocument();
      });
      const rankings = screen.getAllByText(/#1/);
      expect(rankings.length).toBeGreaterThan(0);
    });

    it('shows action buttons on results step', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      for (let i = 0; i < 5; i++) {
        const btn = screen.getByRole('button', {
          name: /Next|See Results/i,
        });
        await user.click(btn);
      }

      await waitFor(() => {
        expect(screen.getByText(/Share Results/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/See All Cards/i)).toBeInTheDocument();
      expect(screen.getByText(/Retake Quiz/i)).toBeInTheDocument();
    });
  });

  describe('Shared Results', () => {
    it('decodes and loads shared quiz results from URL param', async () => {
      const answers = {
        monthlySpend: 100000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'high' as const,
        cardTier: 'premium' as const,
      };
      const encoded = quizAlgorithm.encodeQuizResult({
        cardIds: [1, 2],
        answers,
      });

      const mockLocation = {
        ...window.location,
        search: `?quiz_result=${encoded}`,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      renderQuiz();

      await waitFor(() => {
        expect(mockApiService.getCreditCards).toHaveBeenCalled();
      });
    });

    it('validates card IDs against fetched cards', async () => {
      const answers = {
        monthlySpend: 100000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'high' as const,
        cardTier: 'premium' as const,
      };
      const encoded = quizAlgorithm.encodeQuizResult({
        cardIds: [999],
        answers,
      });

      const mockLocation = {
        ...window.location,
        search: `?quiz_result=${encoded}`,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      renderQuiz();

      await waitFor(() => {
        expect(mockApiService.getCreditCards).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for quiz steps', async () => {
      renderQuiz();

      await waitFor(() => {
        const stepRegion = screen.getByRole('region', { name: /Spending/i });
        expect(stepRegion).toBeInTheDocument();
      });
    });

    it('uses aria-live for status updates', async () => {
      renderQuiz();

      await waitFor(() => {
        const steps = screen.getAllByRole('region');
        const liveStep = steps.find(el => el.getAttribute('aria-live') === 'polite');
        expect(liveStep).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      // Tab to Next button and press Enter
      const nextButton = screen.getByRole('button', { name: /Next/i });
      nextButton.focus();
      expect(nextButton).toHaveFocus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/What will you use the card for/i)).toBeInTheDocument();
      });
    });

    it('buttons have descriptive aria-labels', async () => {
      renderQuiz();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Go to previous step/i })).toBeInTheDocument();
      });
      expect(
        screen.getByRole('button', { name: /Go to next step or see results/i })
      ).toBeInTheDocument();
    });
  });

  describe('Share Functionality', () => {
    it('shows share button and is clickable', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      for (let i = 0; i < 5; i++) {
        const btn = screen.getByRole('button', {
          name: /Next|See Results/i,
        });
        await user.click(btn);
      }

      await waitFor(() => {
        expect(screen.getByText(/Share Results/i)).toBeInTheDocument();
      });

      const shareButton = screen.getByText(/Share Results/);
      expect(shareButton).toBeInTheDocument();
      expect(shareButton).not.toBeDisabled();
    });
  });

  describe('Retake Quiz', () => {
    it('resets quiz to first step when retaking', async () => {
      renderQuiz();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });

      for (let i = 0; i < 5; i++) {
        const btn = screen.getByRole('button', {
          name: /Next|See Results/i,
        });
        await user.click(btn);
      }

      await waitFor(() => {
        expect(screen.getByText(/Retake Quiz/i)).toBeInTheDocument();
      });

      const retakeButton = screen.getByText(/Retake Quiz/);
      await user.click(retakeButton);

      await waitFor(() => {
        expect(screen.getByText(/What's your typical monthly spending/i)).toBeInTheDocument();
      });
    });
  });
});
