/* eslint-disable
  testing-library/no-wait-for-multiple-assertions,
  testing-library/no-wait-for-side-effects,
  testing-library/no-node-access
*/
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider, useAuth } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales/LanguageContext';
import { authClient } from '../services/auth';
import { ReviewApiResponse, reviewsService } from '../services/reviews';

import { ReviewsSection } from './ReviewsSection';

jest.mock('../services/reviews', () => {
  const actual = jest.requireActual('../services/reviews');
  return {
    ...actual,
    reviewsService: {
      ...actual.reviewsService,
      getSummary: jest.fn(),
      getReviews: jest.fn(),
      createReview: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
      voteHelpful: jest.fn(),
      transformReview: jest.fn(r => r),
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

const mockReviewsService = reviewsService as jest.Mocked<typeof reviewsService>;
const mockUseAuth = useAuth as jest.Mock;

const mockSummary = {
  card: 1,
  average_rating: 4.2,
  review_count: 5,
  distribution: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 2 },
};

const mockApiReviews: ReviewApiResponse[] = [
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
    modified: '2025-01-15T10:00:00Z',
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

const mockReviews = mockApiReviews.map(r => ({
  ...r,
  cardId: r.card,
  helpfulCount: r.helpful_count,
  reviewerName: r.reviewer_name,
  created: new Date(r.created),
  modified: new Date(r.modified),
}));

const renderWithProviders = (
  props: {
    user?: { id: number; email: string } | null;
    initialRoute?: string;
  } = {}
) => {
  const { user = null, initialRoute = '/card/test-bank/test-card' } = props;

  mockUseAuth.mockReturnValue({
    user: user ? { id: user.id, email: user.email } : null,
    status: user ? 'authenticated' : 'anonymous',
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  });

  return render(
    <LanguageProvider initialLang="en">
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route
              path="/card/:bankSlug/:cardSlug"
              element={
                <ReviewsSection
                  cardId={1}
                  cardName="Test Card"
                  cardUrl="/card/test-bank/test-card"
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

describe('ReviewsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(authClient, 'getAccessToken').mockResolvedValue('mock-access-token');
    mockReviewsService.getSummary.mockResolvedValue(mockSummary);
    mockReviewsService.getReviews.mockResolvedValue({
      count: mockApiReviews.length,
      next: null,
      previous: null,
      results: mockApiReviews,
    });
    mockReviewsService.transformReview.mockImplementation((r: ReviewApiResponse) => ({
      ...r,
      cardId: r.card,
      helpfulCount: r.helpful_count,
      reviewerName: r.reviewer_name,
      created: new Date(r.created),
      modified: new Date(r.modified),
    }));
  });

  describe('Loading state', () => {
    test('shows loading spinner while fetching summary', () => {
      let resolveSummary: ((value: typeof mockSummary) => void) | undefined;
      mockReviewsService.getSummary.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveSummary = resolve;
          })
      );
      mockReviewsService.getReviews.mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });

      renderWithProviders();

      expect(screen.getAllByText('Loading reviews...')).toHaveLength(2);

      act(() => {
        resolveSummary?.(mockSummary);
      });
    });
  });

  describe('Summary display', () => {
    test('renders average rating and review count', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Average Rating')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('4.2')).toBeInTheDocument();
      });

      expect(screen.getByText('based on 5 reviews')).toBeInTheDocument();
    });

    test('shows distribution bars for each star rating', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('5★')).toBeInTheDocument();
        expect(screen.getByText('4★')).toBeInTheDocument();
        expect(screen.getByText('3★')).toBeInTheDocument();
        expect(screen.getByText('2★')).toBeInTheDocument();
        expect(screen.getByText('1★')).toBeInTheDocument();
      });

      expect(document.querySelectorAll('.distribution-count')[0]).toHaveTextContent('2');
      expect(document.querySelectorAll('.distribution-count')[1]).toHaveTextContent('1');
    });

    test('shows empty state when no reviews', async () => {
      mockReviewsService.getSummary.mockResolvedValue({
        card: 1,
        average_rating: null,
        review_count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      mockReviewsService.getReviews.mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getAllByText('No reviews yet')).toHaveLength(2);
        expect(screen.getAllByText('Be the first to review this card')).toHaveLength(2);
      });
    });
  });

  describe('Review list', () => {
    test('renders review items with correct content', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Excellent card!')).toBeInTheDocument();
        expect(screen.getByText('Great rewards and lounge access.')).toBeInTheDocument();
        expect(screen.getByText('Good rewards')).toBeInTheDocument();
        expect(screen.getByText('High annual fee')).toBeInTheDocument();
        expect(screen.getByText('John D.')).toBeInTheDocument();
      });
    });

    test('displays helpful vote button with count', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Mark as helpful/ })).toHaveLength(2);
        expect(screen.getByText('(3)')).toBeInTheDocument(); // helpful count for first review
      });
    });
  });

  describe('Write review flow (authenticated)', () => {
    test('shows write review button for authenticated user', async () => {
      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Write a Review/ })).toBeInTheDocument();
      });
    });

    test('opens form when write review button clicked', async () => {
      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Write a Review/ })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Write a Review/ }));

      await waitFor(() => {
        expect(screen.getByText('Write your review')).toBeInTheDocument();
        expect(screen.getByLabelText(/Your rating/)).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('Summarize your experience in a few words')
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText('Share your detailed experience with this card...')
        ).toBeInTheDocument();
      });
    });

    test('shows validation errors for empty required fields', async () => {
      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      fireEvent.click(await screen.findByRole('button', { name: /Write a Review/ }));

      fireEvent.click(await screen.findByRole('button', { name: /Submit review/ }));

      await waitFor(() => {
        expect(screen.getByText('Please select a rating')).toBeInTheDocument();
        expect(screen.getByText('Please enter a review title')).toBeInTheDocument();
        expect(screen.getByText('Please write your review')).toBeInTheDocument();
      });
    });

    test('shows character counters for title and body', async () => {
      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      fireEvent.click(await screen.findByRole('button', { name: /Write a Review/ }));

      await waitFor(() => {
        expect(screen.getByText('0/120 characters')).toBeInTheDocument();
        expect(screen.getByText('0/5000 characters')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Summarize your experience in a few words');
      fireEvent.change(titleInput, { target: { value: 'Test title' } });

      await waitFor(() => {
        expect(screen.getByText('10/120 characters')).toBeInTheDocument();
      });
    });

    test('submits review successfully', async () => {
      mockReviewsService.createReview.mockResolvedValue({ ...mockReviews[0], id: 4 });

      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      fireEvent.click(await screen.findByRole('button', { name: /Write a Review/ }));

      // Fill form
      const stars = screen.getAllByRole('button', { name: /star/ });
      fireEvent.click(stars[4]); // 5 stars

      const titleInput = screen.getByPlaceholderText('Summarize your experience in a few words');
      fireEvent.change(titleInput, { target: { value: 'Amazing card!' } });

      const bodyInput = screen.getByPlaceholderText(
        'Share your detailed experience with this card...'
      );
      fireEvent.change(bodyInput, {
        target: { value: 'This card is absolutely amazing with great benefits.' },
      });

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /Submit review/ }));
      });

      await waitFor(() => {
        expect(mockReviewsService.createReview).toHaveBeenCalledWith(
          expect.objectContaining({
            card: 1,
            rating: 5,
            title: 'Amazing card!',
            body: 'This card is absolutely amazing with great benefits.',
          }),
          'mock-access-token'
        );
      });
    });

    test('shows pending moderation notice after submit', async () => {
      mockReviewsService.createReview.mockResolvedValue({
        ...mockReviews[0],
        id: 4,
      });

      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /Write a Review/ }));
      });

      const stars = screen.getAllByRole('button', { name: /star/ });
      fireEvent.click(stars[4]);

      const titleInput = screen.getByPlaceholderText('Summarize your experience in a few words');
      fireEvent.change(titleInput, { target: { value: 'Amazing card!' } });

      const bodyInput = screen.getByPlaceholderText(
        'Share your detailed experience with this card...'
      );
      fireEvent.change(bodyInput, {
        target: { value: 'This card is absolutely amazing with great benefits.' },
      });

      fireEvent.click(await screen.findByRole('button', { name: /Submit review/ }));

      await waitFor(() => {
        expect(
          screen.getByText('Your review has been submitted and is pending moderation.')
        ).toBeInTheDocument();
      });
    });

    test('cancels form and returns to list', async () => {
      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      fireEvent.click(await screen.findByRole('button', { name: /Write a Review/ }));

      fireEvent.click(await screen.findByRole('button', { name: /Cancel/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Write a Review/ })).toBeInTheDocument();
        expect(screen.queryByText('Write your review')).not.toBeInTheDocument();
      });
    });
  });

  describe('Write review flow (anonymous)', () => {
    test('shows login prompt for anonymous user', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(
          screen.getByText('You need to be logged in to share your experience.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log in/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create an account/ })).toBeInTheDocument();
      });
    });
  });

  describe('Helpful vote', () => {
    test('prompts login for anonymous user', async () => {
      renderWithProviders();

      const helpfulBtn = await screen.findAllByRole('button', { name: /Mark as helpful/ });
      fireEvent.click(helpfulBtn[0]);

      // The anonymous action should not call the authenticated vote endpoint.
      expect(mockReviewsService.voteHelpful).not.toHaveBeenCalled();
    });

    test('adds a helpful vote for authenticated user', async () => {
      mockReviewsService.voteHelpful.mockResolvedValue({
        helpful_count: 4,
      });

      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      const helpfulBtn = await screen.findAllByRole('button', { name: /Mark as helpful/ });
      fireEvent.click(helpfulBtn[0]);

      await waitFor(() => {
        expect(mockReviewsService.voteHelpful).toHaveBeenCalledWith(1, 'mock-access-token');
      });
    });
  });

  describe('Pagination', () => {
    test('shows pagination when multiple pages', async () => {
      mockReviewsService.getReviews.mockResolvedValue({
        count: 45,
        next: null,
        previous: null,
        results: Array.from({ length: 20 }, (_, i) => ({ ...mockApiReviews[0], id: i + 1 })),
      });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Next page/ })).toBeInTheDocument();
      });
    });

    test('navigates to next page', async () => {
      mockReviewsService.getReviews
        .mockResolvedValueOnce({
          count: 45,
          next: null,
          previous: null,
          results: Array.from({ length: 20 }, (_, i) => ({ ...mockApiReviews[0], id: i + 1 })),
        })
        .mockResolvedValueOnce({
          count: 45,
          next: null,
          previous: null,
          results: Array.from({ length: 20 }, (_, i) => ({ ...mockApiReviews[0], id: i + 11 })),
        });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Next page/ })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Next page/ }));

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
        expect(mockReviewsService.getReviews).toHaveBeenCalledWith(1, 2);
      });
    });

    test('keeps page count based on the first page size on a short final page', async () => {
      const page = (start: number, length: number) => ({
        count: 45,
        next: null,
        previous: null,
        results: Array.from({ length }, (_, i) => ({ ...mockApiReviews[0], id: start + i })),
      });
      mockReviewsService.getReviews
        .mockResolvedValueOnce(page(1, 20))
        .mockResolvedValueOnce(page(21, 20))
        .mockResolvedValueOnce(page(41, 5));

      renderWithProviders();
      fireEvent.click(await screen.findByRole('button', { name: /Next page/ }));
      fireEvent.click(await screen.findByRole('button', { name: /Next page/ }));

      await waitFor(() => {
        expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Next page/ })).toBeDisabled();
      });
    });
  });

  describe('JSON-LD AggregateRating', () => {
    test('adds JSON-LD script when reviews exist', async () => {
      renderWithProviders();

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

    test('does not add JSON-LD when no reviews', async () => {
      mockReviewsService.getSummary.mockResolvedValue({
        card: 1,
        average_rating: null,
        review_count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      mockReviewsService.getReviews.mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });

      renderWithProviders();

      await waitFor(() => {
        const script = document.querySelector('script[data-review-aggregate]');
        expect(script).not.toBeInTheDocument();
      });
    });
  });
});
