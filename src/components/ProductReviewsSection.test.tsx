/* eslint-disable
  testing-library/no-wait-for-multiple-assertions,
  testing-library/no-wait-for-side-effects,
  testing-library/no-node-access
*/
/**
 * Phase 3B: the generalised review section on a non-card product type
 * (deposit), the Community reviewed state, the author's own pending
 * review state card, and the moderated comments thread.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { useAuth } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales/LanguageContext';
import { authClient } from '../services/auth';
import { reviewsService } from '../services/reviews';

import { ReviewsSection } from './ReviewsSection';

jest.mock('../services/reviews', () => {
  const actual = jest.requireActual('../services/reviews');
  return {
    ...actual,
    reviewsService: {
      getSummary: jest.fn(),
      getReviews: jest.fn(),
      createReview: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
      voteHelpful: jest.fn(),
      transformReview: jest.fn(r => r),
      getProductReviews: jest.fn(),
      getProductSummary: jest.fn(),
      createProductReview: jest.fn(),
      updateProductReview: jest.fn(),
      deleteProductReview: jest.fn(),
      voteProductHelpful: jest.fn(),
      getOwnProductReview: jest.fn().mockResolvedValue(null),
      getComments: jest.fn().mockResolvedValue([]),
      createComment: jest.fn(),
      updateComment: jest.fn(),
      deleteComment: jest.fn(),
      transformProductReview: jest.fn(r => ({
        id: r.id,
        productId: r.product,
        productType: r.product_type,
        rating: r.rating,
        title: r.title,
        body: r.body,
        pros: r.pros,
        cons: r.cons,
        helpfulCount: r.helpful_count,
        reviewerName: r.reviewer_name,
        status: r.status,
        created: new Date(r.created),
        modified: new Date(r.modified),
      })),
      transformComment: jest.fn(c => c),
    },
  };
});

jest.mock('../hooks/AuthProvider', () => {
  const actual = jest.requireActual('../hooks/AuthProvider');
  return {
    ...actual,
    useAuth: jest.fn(),
    AuthProvider: actual.AuthProvider,
  };
});

const mockService = reviewsService as jest.Mocked<typeof reviewsService>;
const mockUseAuth = useAuth as jest.Mock;

const apiReview = {
  id: 11,
  product: 7,
  product_type: 'deposit' as const,
  rating: 4,
  title: 'Reliable FDR',
  body: 'Maturity was credited on time.',
  pros: 'On-time payout',
  cons: '',
  helpful_count: 1,
  reviewer_name: 'Saver',
  created: '2025-03-01T10:00:00Z',
  modified: '2025-03-01T10:00:00Z',
};

const summary = (overrides = {}) => ({
  product_type: 'deposit' as const,
  product: 7,
  average_rating: 4.0,
  review_count: 1,
  approved_count: 1,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
  community_reviewed: false,
  ...overrides,
});

const renderSection = (user: { id: number; email: string } | null = null) => {
  mockUseAuth.mockReturnValue({
    user: user ? { id: user.id, email: user.email } : null,
    status: user ? 'authenticated' : 'anonymous',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  });
  return render(
    <LanguageProvider initialLang="en">
      <MemoryRouter>
        <ReviewsSection
          productType="deposit"
          productId={7}
          productName="Test FDR"
          productUrl="/deposits/test-fdr"
        />
      </MemoryRouter>
    </LanguageProvider>
  );
};

describe('ProductReviewsSection (Phase 3B)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(authClient, 'getAccessToken').mockResolvedValue('mock-access-token');
    mockService.getOwnProductReview.mockResolvedValue(null);
    mockService.getComments.mockResolvedValue([]);
    mockService.getProductSummary.mockResolvedValue(summary());
    mockService.getProductReviews.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [apiReview],
    });
  });

  test('renders the generalised summary and approved reviews for a deposit', async () => {
    renderSection();
    await waitFor(() => {
      expect(screen.getByText('Reliable FDR')).toBeInTheDocument();
    });
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
    expect(mockService.getProductSummary).toHaveBeenCalledWith('deposit', 7);
    expect(mockService.getProductReviews).toHaveBeenCalledWith('deposit', 7, 1);
    expect(screen.queryByText('Community reviewed')).not.toBeInTheDocument();
  });

  test('shows the Community reviewed chip with its not-an-endorsement note at 50+', async () => {
    mockService.getProductSummary.mockResolvedValue(
      summary({ review_count: 52, approved_count: 52, community_reviewed: true })
    );
    renderSection();
    await waitFor(() => {
      expect(screen.getByText('Community reviewed')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/not a CreditMate recommendation or a legal endorsement/)
    ).toBeInTheDocument();
  });

  test('no Community reviewed chip below the threshold', async () => {
    mockService.getProductSummary.mockResolvedValue(
      summary({ review_count: 49, approved_count: 49, community_reviewed: false })
    );
    renderSection();
    await waitFor(() => {
      expect(screen.getByText('Reliable FDR')).toBeInTheDocument();
    });
    expect(screen.queryByText('Community reviewed')).not.toBeInTheDocument();
  });

  test("shows the author's own pending review in a state card, not the public list", async () => {
    mockService.getOwnProductReview.mockResolvedValue({
      id: 21,
      productId: 7,
      productType: 'deposit',
      rating: 2,
      title: 'Still waiting',
      body: 'Account opening took weeks.',
      pros: '',
      cons: 'Slow onboarding',
      helpfulCount: 0,
      reviewerName: 'Me',
      status: 'pending',
      created: new Date('2025-04-01T10:00:00Z'),
      modified: new Date('2025-04-01T10:00:00Z'),
    });
    renderSection({ id: 5, email: 'me@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Your review')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending review')).toBeInTheDocument();
    expect(screen.getByText('Still waiting')).toBeInTheDocument();
    // One review per product: the write button is replaced by the card.
    expect(screen.queryByText('Write a Review')).not.toBeInTheDocument();
  });

  test('an approved own review is shown once — in its state card, not duplicated in the list', async () => {
    mockService.getOwnProductReview.mockResolvedValue({
      id: 11, // same review as the public list fixture
      productId: 7,
      productType: 'deposit',
      rating: 4,
      title: 'Reliable FDR',
      body: 'Maturity was credited on time.',
      pros: 'On-time payout',
      cons: '',
      helpfulCount: 1,
      reviewerName: 'Me',
      status: 'approved',
      created: new Date('2025-03-01T10:00:00Z'),
      modified: new Date('2025-03-01T10:00:00Z'),
    });
    renderSection({ id: 5, email: 'me@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Your review')).toBeInTheDocument();
    });
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getAllByText('Reliable FDR')).toHaveLength(1);
  });

  test('signed-out visitors get the honest login prompt and product-named empty copy', async () => {
    mockService.getProductSummary.mockResolvedValue(
      summary({ review_count: 0, approved_count: 0, average_rating: null })
    );
    mockService.getProductReviews.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    renderSection(null);
    await waitFor(() => {
      // Summary empty state and list empty state both carry the hint.
      expect(screen.getAllByText('Be the first to review Test FDR').length).toBeGreaterThan(0);
    });
    expect(
      screen.getByText('You need to be logged in to share your experience.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  test('comments thread loads on expand, renders approved comments, and posts as pending', async () => {
    const approvedComment = {
      id: 31,
      reviewId: 11,
      reviewType: 'deposit' as const,
      parent: null,
      authorName: 'Saver',
      isOwn: false,
      body: 'Same experience here.',
      created: new Date('2025-03-02T10:00:00Z'),
      modified: new Date('2025-03-02T10:00:00Z'),
      replies: [],
    };
    mockService.getComments.mockResolvedValue([approvedComment]);
    mockService.createComment.mockResolvedValue({
      id: 32,
      reviewId: 11,
      reviewType: 'deposit',
      parent: null,
      authorName: 'Me',
      isOwn: true,
      body: 'Adding my two cents',
      status: 'pending',
      created: new Date('2025-03-03T10:00:00Z'),
      modified: new Date('2025-03-03T10:00:00Z'),
      replies: [],
    });
    renderSection({ id: 5, email: 'me@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Reliable FDR')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    await waitFor(() => {
      expect(screen.getByText('Same experience here.')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Comments are reviewed before they appear publicly, just like reviews.')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: 'Adding my two cents' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    await waitFor(() => {
      expect(mockService.createComment).toHaveBeenCalledWith(
        'deposit',
        11,
        { body: 'Adding my two cents', parent: null },
        'mock-access-token'
      );
    });
    // The author's new comment appears in place, marked pending.
    await waitFor(() => {
      expect(screen.getByText('Pending review')).toBeInTheDocument();
    });
    expect(screen.getByText('Adding my two cents')).toBeInTheDocument();
  });

  test('the section (summary, own state card, comments) has no axe violations', async () => {
    mockService.getOwnProductReview.mockResolvedValue({
      id: 21,
      productId: 7,
      productType: 'deposit',
      rating: 2,
      title: 'Still waiting',
      body: 'Account opening took weeks.',
      pros: '',
      cons: 'Slow onboarding',
      helpfulCount: 0,
      reviewerName: 'Me',
      status: 'pending',
      created: new Date('2025-04-01T10:00:00Z'),
      modified: new Date('2025-04-01T10:00:00Z'),
    });
    mockService.getComments.mockResolvedValue([
      {
        id: 31,
        reviewId: 11,
        reviewType: 'deposit',
        parent: null,
        authorName: 'Saver',
        isOwn: false,
        body: 'Same experience here.',
        created: new Date('2025-03-02T10:00:00Z'),
        modified: new Date('2025-03-02T10:00:00Z'),
        replies: [],
      },
    ]);
    const { container } = renderSection({ id: 5, email: 'me@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Reliable FDR')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Comments/ }));
    await waitFor(() => {
      expect(screen.getByText('Same experience here.')).toBeInTheDocument();
    });
    await expectNoAxeViolations(container);
  });

  test('submitting the write form creates a pending deposit review', async () => {
    mockService.createProductReview.mockResolvedValue({
      id: 22,
      productId: 7,
      productType: 'deposit',
      rating: 5,
      title: 'Great',
      body: 'Loved it',
      pros: '',
      cons: '',
      helpfulCount: 0,
      reviewerName: 'Me',
      status: 'pending',
      created: new Date(),
      modified: new Date(),
    });
    renderSection({ id: 5, email: 'me@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Reliable FDR')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Write a Review' }));
    fireEvent.click(screen.getByRole('button', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText(/Review title/), {
      target: { value: 'Great' },
    });
    fireEvent.change(screen.getByLabelText(/Your review/), {
      target: { value: 'Loved it' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    await waitFor(() => {
      expect(mockService.createProductReview).toHaveBeenCalledWith(
        'deposit',
        expect.objectContaining({ product: 7, rating: 5, title: 'Great', body: 'Loved it' }),
        'mock-access-token'
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText('Your review has been submitted and is pending moderation.')
      ).toBeInTheDocument();
    });
  });
});
