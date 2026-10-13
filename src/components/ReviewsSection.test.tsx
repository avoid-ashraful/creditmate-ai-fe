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
      toggleHelpful: jest.fn(),
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
  average: 4.2,
  count: 5,
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
    display_name: 'John D.',
    created: '2025-01-15T10:00:00Z',
    user: 101,
    status: 'approved' as const,
    user_voted_helpful: false,
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
    display_name: 'Jane S.',
    created: '2025-02-20T14:00:00Z',
    user: 102,
    status: 'approved' as const,
    user_voted_helpful: true,
  },
  {
    id: 3,
    card: 1,
    rating: 3,
    title: 'Okay card',
    body: 'Average experience overall.',
    pros: 'Decent support',
    cons: 'Limited rewards',
    helpful_count: 0,
    display_name: 'Bob W.',
    created: '2025-03-10T12:00:00Z',
    user: 103,
    status: 'pending' as const,
    user_voted_helpful: false,
  },
];

const mockReviews = mockApiReviews.map(r => ({
  ...r,
  cardId: r.card,
  helpfulCount: r.helpful_count,
  displayName: r.display_name,
  created: new Date(r.created),
  userId: r.user,
  userVotedHelpful: r.user_voted_helpful,
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
      displayName: r.display_name,
      created: new Date(r.created),
      userId: r.user,
      userVotedHelpful: r.user_voted_helpful,
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
        average: null,
        count: 0,
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

    test('shows pending moderation badge for pending reviews', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Pending moderation')).toBeInTheDocument();
      });
    });

    test('shows verified badge for approved reviews', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getAllByText('Verified cardholder')).toHaveLength(2);
      });
    });

    test('displays helpful vote button with count', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Mark as helpful/ })).toHaveLength(2);
        expect(screen.getByText('(3)')).toBeInTheDocument(); // helpful count for first review
      });
    });

    test('shows voted state when user has voted', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Marked helpful/ })).toBeInTheDocument();
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
        expect(screen.getByText('0/100 characters')).toBeInTheDocument();
        expect(screen.getByText('0/5000 characters')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Summarize your experience in a few words');
      fireEvent.change(titleInput, { target: { value: 'Test title' } });

      await waitFor(() => {
        expect(screen.getByText('10/100 characters')).toBeInTheDocument();
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
        status: 'pending',
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

  describe('Edit review flow', () => {
    test('allows editing own review', async () => {
      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.getByText('Excellent card!')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Edit/ }));

      await waitFor(() => {
        expect(screen.getByText('Edit your review')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Excellent card!')).toBeInTheDocument();
      });
    });

    test('does not show edit button for other users reviews', async () => {
      renderWithProviders({ user: { id: 999, email: 'other@example.com' } });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete review flow', () => {
    test('allows deleting own review with confirmation', async () => {
      mockReviewsService.deleteReview.mockResolvedValue(undefined);

      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.getByText('Excellent card!')).toBeInTheDocument();
      });

      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      fireEvent.click(screen.getByRole('button', { name: /Delete/ }));

      await waitFor(() => {
        expect(mockReviewsService.deleteReview).toHaveBeenCalledWith(1, 'mock-access-token');
      });

      window.confirm = originalConfirm;
    });

    test('does not show delete button for other users reviews', async () => {
      renderWithProviders({ user: { id: 999, email: 'other@example.com' } });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
      });
    });
  });

  describe('Helpful vote', () => {
    test('prompts login for anonymous user', async () => {
      renderWithProviders();

      const helpfulBtn = await screen.findAllByRole('button', { name: /Mark as helpful/ });
      fireEvent.click(helpfulBtn[0]);

      // The anonymous action should not call the authenticated vote endpoint.
      expect(mockReviewsService.toggleHelpful).not.toHaveBeenCalled();
    });

    test('toggles helpful vote for authenticated user', async () => {
      mockReviewsService.toggleHelpful.mockResolvedValue({
        helpful_count: 4,
        user_voted_helpful: true,
      });

      renderWithProviders({ user: { id: 101, email: 'test@example.com' } });

      const helpfulBtn = await screen.findAllByRole('button', { name: /Mark as helpful/ });
      fireEvent.click(helpfulBtn[0]);

      await waitFor(() => {
        expect(mockReviewsService.toggleHelpful).toHaveBeenCalledWith(1, 'mock-access-token');
      });
    });
  });

  describe('Pagination', () => {
    test('shows pagination when multiple pages', async () => {
      mockReviewsService.getReviews.mockResolvedValue({
        count: 25,
        next: null,
        previous: null,
        results: Array.from({ length: 10 }, (_, i) => ({ ...mockApiReviews[0], id: i + 1 })),
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
          count: 25,
          next: null,
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({ ...mockApiReviews[0], id: i + 1 })),
        })
        .mockResolvedValueOnce({
          count: 25,
          next: null,
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({ ...mockApiReviews[0], id: i + 11 })),
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
        count: 25,
        next: null,
        previous: null,
        results: Array.from({ length }, (_, i) => ({ ...mockApiReviews[0], id: start + i })),
      });
      mockReviewsService.getReviews
        .mockResolvedValueOnce(page(1, 10))
        .mockResolvedValueOnce(page(11, 10))
        .mockResolvedValueOnce(page(21, 5));

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
        average: null,
        count: 0,
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
