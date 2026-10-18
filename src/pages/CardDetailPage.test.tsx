/* eslint-disable testing-library/no-wait-for-multiple-assertions, testing-library/no-node-access */
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { AuthProvider } from '../hooks/AuthProvider';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { LanguageProvider } from '../locales';
import { apiService } from '../services/api';
import { ReviewApiResponse, reviewsService } from '../services/reviews';
import { CreditCard } from '../types';

import CardDetailPage from './CardDetailPage';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: {
      getCreditCards: jest.fn(),
      transformCreditCard: actual.apiService.transformCreditCard,
    },
  };
});

jest.mock('../services/reviews', () => {
  const actual = jest.requireActual('../services/reviews');
  return {
    ...actual,
    reviewsService: {
      ...actual.reviewsService,
      getSummary: jest.fn(),
      getReviews: jest.fn(),
      transformReview: jest.fn(r => r),
      createReview: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
      voteHelpful: jest.fn(),
    },
  };
});

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockReviewsService = reviewsService as jest.Mocked<typeof reviewsService>;
const APPLY_NOW_BUTTON = 'Apply Now';
const BUTTON_ROLE = 'button';
const analyticsProvider = jest.fn();

const mockCard: CreditCard = {
  id: 1,
  bankId: 1,
  bankName: 'Eastern Bank Limited',
  name: 'EBL Platinum Card',
  annualFee: 5000,
  interestRateApr: 24.5,
  loungeAccessInternational: '6 visits',
  loungeAccessDomestic: '12 visits',
  cashAdvanceFee: '2.5% or BDT 500, whichever is higher',
  latePaymentFee: 'BDT 1000',
  annualFeeWaiverPolicy: {
    spendThreshold: 300000,
    period: 'yearly',
    conditions: 'Must spend BDT 300,000 within the card anniversary year',
  },
  rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent',
  additionalFeatures: ['Feature 1', 'Feature 2'],
  sourceUrl: 'https://www.ebl.com.bd/card',
  isActive: true,
  lastUpdated: new Date('2025-05-15'),
  images: [
    {
      small: '/assets/cards/ebl-platinum-small-1.png',
      full: '/assets/cards/ebl-platinum-full-1.png',
    },
  ],
};

const mockSimilarCard: CreditCard = {
  ...mockCard,
  id: 2,
  name: 'EBL Gold Card',
  annualFee: 2000,
};

const mockReviewSummary = {
  card: 1,
  average_rating: 4.2,
  review_count: 5,
  distribution: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 2 },
};

const mockReviews: ReviewApiResponse[] = [
  {
    id: 1,
    card: 1,
    rating: 5,
    title: 'Excellent card!',
    body: 'Great rewards and lounge access.',
    pros: 'Good rewards',
    cons: 'High annual fee',
    helpful_count: 3,
    reviewer_name: 'John D.',
    created: '2025-01-15T10:00:00Z',
    modified: '2025-06-15T12:00:00Z',
  },
  {
    id: 2,
    card: 1,
    rating: 4,
    title: 'Good value',
    body: 'Worth it for the travel benefits.',
    pros: 'Travel perks',
    cons: '',
    helpful_count: 1,
    reviewer_name: 'Jane S.',
    created: '2025-02-20T14:00:00Z',
    modified: '2025-06-15T12:00:00Z',
  },
];

const renderWithRouter = (
  initialRoute = '/card/eastern-bank-limited/ebl-platinum-card',
  lang: 'en' | 'bn' = 'en'
) => {
  return render(
    <LanguageProvider initialLang={lang}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/card/:bankSlug/:cardSlug" element={<CardDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

describe('CardDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_ANALYTICS_KEY = 'test-key';
    analytics.setProvider(analyticsProvider);
    analytics.optIn();
    mockApiService.getCreditCards.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: mockCard.id,
          bank_id: mockCard.bankId,
          bank_name: mockCard.bankName,
          name: mockCard.name,
          annual_fee: mockCard.annualFee,
          interest_rate_apr: mockCard.interestRateApr,
          lounge_access_international: mockCard.loungeAccessInternational || undefined,
          lounge_access_domestic: mockCard.loungeAccessDomestic || undefined,
          cash_advance_fee: mockCard.cashAdvanceFee,
          late_payment_fee: mockCard.latePaymentFee,
          annual_fee_waiver_policy: mockCard.annualFeeWaiverPolicy,
          reward_points_policy: mockCard.rewardPointsPolicy,
          additional_features: mockCard.additionalFeatures,
          sourceUrl: mockCard.sourceUrl,
          is_active: true,
          modified: '2025-05-15',
          images: mockCard.images,
        },
        {
          id: mockSimilarCard.id,
          bank_id: mockCard.bankId,
          bank_name: mockCard.bankName,
          name: mockSimilarCard.name,
          annual_fee: mockSimilarCard.annualFee,
          interest_rate_apr: mockCard.interestRateApr,
          lounge_access_international: mockCard.loungeAccessInternational || undefined,
          lounge_access_domestic: mockCard.loungeAccessDomestic || undefined,
          cash_advance_fee: mockCard.cashAdvanceFee,
          late_payment_fee: mockCard.latePaymentFee,
          annual_fee_waiver_policy: mockCard.annualFeeWaiverPolicy,
          reward_points_policy: mockCard.rewardPointsPolicy,
          additional_features: [],
          sourceUrl: mockCard.sourceUrl,
          is_active: true,
          modified: '2025-05-15',
          images: mockCard.images,
        },
      ],
    });
    mockReviewsService.getSummary.mockResolvedValue(mockReviewSummary);
    mockReviewsService.getReviews.mockResolvedValue({
      count: mockReviews.length,
      next: null,
      previous: null,
      results: mockReviews,
    });
    mockReviewsService.transformReview.mockImplementation((r: ReviewApiResponse) => ({
      id: r.id,
      cardId: r.card,
      rating: r.rating,
      title: r.title,
      body: r.body,
      pros: r.pros,
      cons: r.cons,
      helpfulCount: r.helpful_count,
      reviewerName: r.reviewer_name,
      created: new Date(r.created),
      modified: new Date(r.modified),
    }));
  });

  afterEach(() => {
    analytics.setProvider(null);
    analytics.optIn();
    process.env.REACT_APP_ANALYTICS_KEY = '';
  });

  test('renders loading state initially', () => {
    renderWithRouter();
    expect(screen.getByText('Loading card details...')).toBeInTheDocument();
  });

  test('renders card details when data loads', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'EBL Platinum Card' })
      ).toBeInTheDocument();
    });

    expect(screen.getAllByText('Eastern Bank Limited').length).toBeGreaterThan(0);
    expect(await screen.findByRole('region', { name: 'Card insight' })).toBeInTheDocument();
    expect(screen.getAllByText(/BDT 5,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('24.5% APR').length).toBeGreaterThan(0);
    const structuredData = screen.getByTestId('card-json-ld');
    expect(JSON.parse(structuredData.textContent || '{}').name).toBe('EBL Platinum Card');
  });

  test('matches slug to card name correctly', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'EBL Platinum Card' })
      ).toBeInTheDocument();
    });
    expect(mockApiService.getCreditCards).toHaveBeenCalledWith({
      searchTerm: 'ebl platinum card',
      page_size: 100,
    });
  });

  test('displays annual fee waiver calculator when applicable', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Fee Waiver Calculator')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/BDT 300,000/).length).toBeGreaterThan(0);
  });

  test('displays specs table with all available fields', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Complete Specifications')).toBeInTheDocument();
    });

    expect(screen.getByText('Cash Advance Fee')).toBeInTheDocument();
    expect(screen.getByText('Late Payment Fee')).toBeInTheDocument();
    expect(screen.getByText('Rewards Policy')).toBeInTheDocument();
  });

  test('displays pros and cons derived from card data', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Pros & Cons')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/international lounge access/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/domestic lounge access/i).length).toBeGreaterThan(0);
  });

  test('displays similar cards from same bank', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Similar Cards from/)).toBeInTheDocument();
    });

    expect(screen.getByText('EBL Gold Card')).toBeInTheDocument();
  });

  test('displays reviews section with summary and reviews', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    });

    // Summary - wait for loading to complete
    await waitFor(
      () => {
        expect(screen.getByText('Average Rating')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(() => {
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('based on 5 reviews')).toBeInTheDocument();
    });

    // Distribution bars
    await waitFor(() => {
      expect(screen.getByText('5★')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 5-star count
    });

    // Review items
    await waitFor(() => {
      expect(screen.getByText('Excellent card!')).toBeInTheDocument();
      expect(screen.getByText('Great rewards and lounge access.')).toBeInTheDocument();
      expect(screen.getByText('John D.')).toBeInTheDocument();
      expect(screen.queryByText('Verified cardholder')).not.toBeInTheDocument();
    });
  });

  test('shows Write a Review button for anonymous user (login prompt)', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText('You need to be logged in to share your experience.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log in/ })).toBeInTheDocument();
    });
  });

  it('has no accessibility violations on the reviews section', async () => {
    const { container } = renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    });

    await expectNoAxeViolations(container);
  }, 15000);

  test('displays Apply Now CTA when sourceUrl is present', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole(BUTTON_ROLE, { name: new RegExp(APPLY_NOW_BUTTON, 'i') })
      ).toBeInTheDocument();
    });
  });

  test('does not apply CTA when sourceUrl is missing', async () => {
    const cardWithoutUrl = { ...mockCard, sourceUrl: '' };
    mockApiService.getCreditCards.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: cardWithoutUrl.id,
          bank_id: cardWithoutUrl.bankId,
          bank_name: cardWithoutUrl.bankName,
          name: cardWithoutUrl.name,
          annual_fee: cardWithoutUrl.annualFee,
          interest_rate_apr: cardWithoutUrl.interestRateApr,
          lounge_access_international: cardWithoutUrl.loungeAccessInternational || undefined,
          lounge_access_domestic: cardWithoutUrl.loungeAccessDomestic || undefined,
          cash_advance_fee: cardWithoutUrl.cashAdvanceFee,
          late_payment_fee: cardWithoutUrl.latePaymentFee,
          annual_fee_waiver_policy: cardWithoutUrl.annualFeeWaiverPolicy,
          reward_points_policy: cardWithoutUrl.rewardPointsPolicy,
          additional_features: cardWithoutUrl.additionalFeatures,
          sourceUrl: '',
          is_active: true,
          modified: '2025-05-15',
          images: cardWithoutUrl.images,
        },
      ],
    });

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'EBL Platinum Card' })
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole(BUTTON_ROLE, { name: new RegExp(APPLY_NOW_BUTTON, 'i') })
    ).not.toBeInTheDocument();
  });

  test('handles missing card data gracefully', async () => {
    mockApiService.getCreditCards.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Card Not Found')).toBeInTheDocument();
    });
  });

  test('handles null annual fee correctly', async () => {
    const cardWithNullFee = { ...mockCard, annualFee: null };
    mockApiService.getCreditCards.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: cardWithNullFee.id,
          bank_id: cardWithNullFee.bankId,
          bank_name: cardWithNullFee.bankName,
          name: cardWithNullFee.name,
          annual_fee: null,
          interest_rate_apr: cardWithNullFee.interestRateApr,
          lounge_access_international: cardWithNullFee.loungeAccessInternational || undefined,
          lounge_access_domestic: cardWithNullFee.loungeAccessDomestic || undefined,
          cash_advance_fee: cardWithNullFee.cashAdvanceFee,
          late_payment_fee: cardWithNullFee.latePaymentFee,
          annual_fee_waiver_policy: cardWithNullFee.annualFeeWaiverPolicy,
          reward_points_policy: cardWithNullFee.rewardPointsPolicy,
          additional_features: cardWithNullFee.additionalFeatures,
          sourceUrl: cardWithNullFee.sourceUrl,
          is_active: true,
          modified: '2025-05-15',
          images: cardWithNullFee.images,
        },
      ],
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getAllByText('Data not available').length).toBeGreaterThan(0);
    });
  });

  test('handles null interest rate correctly', async () => {
    const cardWithNullRate = { ...mockCard, interestRateApr: null };
    mockApiService.getCreditCards.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: cardWithNullRate.id,
          bank_id: cardWithNullRate.bankId,
          bank_name: cardWithNullRate.bankName,
          name: cardWithNullRate.name,
          annual_fee: cardWithNullRate.annualFee,
          interest_rate_apr: null,
          lounge_access_international: cardWithNullRate.loungeAccessInternational || undefined,
          lounge_access_domestic: cardWithNullRate.loungeAccessDomestic || undefined,
          cash_advance_fee: cardWithNullRate.cashAdvanceFee,
          late_payment_fee: cardWithNullRate.latePaymentFee,
          annual_fee_waiver_policy: cardWithNullRate.annualFeeWaiverPolicy,
          reward_points_policy: cardWithNullRate.rewardPointsPolicy,
          additional_features: cardWithNullRate.additionalFeatures,
          sourceUrl: cardWithNullRate.sourceUrl,
          is_active: true,
          modified: '2025-05-15',
          images: cardWithNullRate.images,
        },
      ],
    });

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'EBL Platinum Card' })
      ).toBeInTheDocument();
    });

    const specValues = screen.getAllByText('Data not available');
    expect(specValues.length).toBeGreaterThan(0);
  });

  test('displays additional features when present', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getAllByText('Additional Features').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    mockApiService.getCreditCards.mockRejectedValue(new Error('API Error'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Card Not Found')).toBeInTheDocument();
    });
  });

  test('tracks a privacy-safe Apply Now event', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole(BUTTON_ROLE, { name: new RegExp(APPLY_NOW_BUTTON, 'i') })
      ).toBeInTheDocument();
    });

    const applyButton = screen.getByRole(BUTTON_ROLE, { name: new RegExp(APPLY_NOW_BUTTON, 'i') });
    applyButton.click();

    expect(analyticsProvider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.cardSelect,
      properties: { cardId: mockCard.id },
    });
  });

  test('opens sourceUrl in new tab on Apply Now click', async () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole(BUTTON_ROLE, { name: new RegExp(APPLY_NOW_BUTTON, 'i') })
      ).toBeInTheDocument();
    });

    const applyButton = screen.getByRole(BUTTON_ROLE, { name: new RegExp(APPLY_NOW_BUTTON, 'i') });
    applyButton.click();

    expect(windowOpenSpy).toHaveBeenCalledWith(mockCard.sourceUrl, '_blank', 'noopener,noreferrer');

    windowOpenSpy.mockRestore();
  });

  test('renders card image when available', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });
  });

  test('handles zero annual fee correctly', async () => {
    const cardWithZeroFee = { ...mockCard, annualFee: 0 };
    mockApiService.getCreditCards.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: cardWithZeroFee.id,
          bank_id: cardWithZeroFee.bankId,
          bank_name: cardWithZeroFee.bankName,
          name: cardWithZeroFee.name,
          annual_fee: 0,
          interest_rate_apr: cardWithZeroFee.interestRateApr,
          lounge_access_international: cardWithZeroFee.loungeAccessInternational || undefined,
          lounge_access_domestic: cardWithZeroFee.loungeAccessDomestic || undefined,
          cash_advance_fee: cardWithZeroFee.cashAdvanceFee,
          late_payment_fee: cardWithZeroFee.latePaymentFee,
          annual_fee_waiver_policy: null,
          reward_points_policy: cardWithZeroFee.rewardPointsPolicy,
          additional_features: cardWithZeroFee.additionalFeatures,
          sourceUrl: cardWithZeroFee.sourceUrl,
          is_active: true,
          modified: '2025-05-15',
          images: cardWithZeroFee.images,
        },
      ],
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getAllByText('No annual fee').length).toBeGreaterThan(0);
    });
  });

  test('adds AggregateRating JSON-LD when reviews exist', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    });

    await waitFor(() => {
      const script = document.querySelector('script[data-review-aggregate]');
      expect(script).toBeInTheDocument();
      if (!script) throw new Error('AggregateRating JSON-LD script was not added');
      const data = JSON.parse(script.textContent || '{}');
      expect(data['@type']).toBe('AggregateRating');
      expect(data.ratingValue).toBe(4.2);
      expect(data.reviewCount).toBe(5);
    });
  });
});

describe('CardDetailPage data display', () => {
  const apiCard = (overrides: Record<string, unknown>) => ({
    id: 1,
    bank_id: 1,
    bank_name: 'Eastern Bank Limited',
    name: 'EBL Platinum Card',
    annual_fee: 5000,
    interest_rate_apr: 24.5,
    cash_advance_fee: '',
    late_payment_fee: '',
    annual_fee_waiver_policy: null,
    reward_points_policy: '',
    additional_features: [],
    is_active: true,
    modified: '2025-05-15',
    images: [],
    ...overrides,
  });

  const showCard = (overrides: Record<string, unknown>, lang: 'en' | 'bn' = 'en') => {
    mockApiService.getCreditCards.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [apiCard(overrides)],
    });
    return renderWithRouter(undefined, lang);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReviewsService.getSummary.mockResolvedValue(mockReviewSummary);
    mockReviewsService.getReviews.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
  });

  test('never renders a literal 0 for a no-fee, 0% APR card', async () => {
    showCard({ annual_fee: 0, interest_rate_apr: 0 });

    expect(await screen.findByRole('heading', { name: 'EBL Platinum Card' })).toBeInTheDocument();
    expect(screen.getAllByText('No annual fee').length).toBeGreaterThan(0);
    const considerations = screen.getByRole('heading', { name: 'Considerations' }).parentElement;
    expect(considerations?.textContent).not.toMatch(/0/);
    expect(document.querySelector('.fee-waiver-section')).not.toBeInTheDocument();
  });

  test('says lounge data is unavailable, not absent, when it is unknown', async () => {
    showCard({});

    await screen.findByRole('heading', { name: 'EBL Platinum Card' });
    expect(screen.getByText('Lounge access data not available')).toBeInTheDocument();
    expect(screen.queryByText('No lounge access included')).not.toBeInTheDocument();
    expect(screen.getAllByText('Unknown').length).toBeGreaterThanOrEqual(2);
  });

  test('says no lounge access only when the bank states there is none', async () => {
    showCard({ lounge_access_international: 0, lounge_access_domestic: 0 });

    await screen.findByRole('heading', { name: 'EBL Platinum Card' });
    expect(screen.getByText('No lounge access included')).toBeInTheDocument();
    expect(screen.getAllByText('None').length).toBeGreaterThanOrEqual(2);
  });

  test('renders the fee waiver policy as a readable list, not JSON', async () => {
    showCard({
      annual_fee_waiver_policy: { spendThreshold: 300000, period: 'yearly', minTransactions: 12 },
    });

    await screen.findByRole('heading', { name: 'EBL Platinum Card' });
    expect(screen.getByText('Spend threshold: BDT 300,000')).toBeInTheDocument();
    expect(screen.getByText('Period: Yearly')).toBeInTheDocument();
    expect(screen.getByText('Min transactions: 12')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\{"spendThreshold/);
  });

  test('shows Bengali labels when the language is Bengali', async () => {
    showCard({ annual_fee: 0 }, 'bn');

    expect(await screen.findByRole('heading', { name: 'সম্পূর্ণ বিবরণ' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'সুবিধা ও বিবেচ্য বিষয়' })).toBeInTheDocument();
    expect(screen.getAllByText('বার্ষিক ফি নেই').length).toBeGreaterThan(0);
    expect(screen.queryByText('Complete Specifications')).not.toBeInTheDocument();
  });
});
