import { reviewsService, transformReview, ReviewApiResponse } from './reviews';

describe('reviewsService', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    process.env = { ...originalEnv, REACT_APP_API_BASE_URL: 'http://localhost:8000/api/v1' };
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  describe('transformReview', () => {
    test('transforms API response to frontend type', () => {
      const apiReview: ReviewApiResponse = {
        id: 1,
        card: 5,
        rating: 5,
        title: 'Great card!',
        body: 'Love the rewards.',
        pros: 'Good rewards',
        cons: 'High fee',
        helpful_count: 10,
        display_name: 'Test User',
        created: '2025-01-15T10:30:00Z',
        user: 100,
        status: 'approved',
        user_voted_helpful: true,
      };

      const review = transformReview(apiReview);

      expect(review).toEqual({
        id: 1,
        cardId: 5,
        rating: 5,
        title: 'Great card!',
        body: 'Love the rewards.',
        pros: 'Good rewards',
        cons: 'High fee',
        helpfulCount: 10,
        displayName: 'Test User',
        created: new Date('2025-01-15T10:30:00Z'),
        userId: 100,
        status: 'approved',
        userVotedHelpful: true,
      });
    });

    test('handles missing optional fields', () => {
      const apiReview: ReviewApiResponse = {
        id: 2,
        card: 5,
        rating: 4,
        title: 'Good card',
        body: 'Pretty good.',
        pros: '',
        cons: '',
        helpful_count: 0,
        display_name: 'Another User',
        created: '2025-02-20T14:00:00Z',
        user: 101,
        status: 'pending',
      };

      const review = transformReview(apiReview);

      expect(review.userVotedHelpful).toBeUndefined();
      expect(review.pros).toBe('');
      expect(review.cons).toBe('');
    });
  });

  describe('getSummary', () => {
    test('fetches summary with correct parameters', async () => {
      const mockResponse = {
        average: 4.5,
        count: 10,
        distribution: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await reviewsService.getSummary(123);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/summary/?card=123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      await expect(reviewsService.getSummary(999)).rejects.toThrow('Not found');
    });
  });

  describe('getReviews', () => {
    test('fetches paginated reviews', async () => {
      const mockResponse = {
        count: 25,
        next: 'http://localhost:8000/api/v1/reviews/?card=123&page=2',
        previous: null,
        results: [
          {
            id: 1,
            card: 123,
            rating: 5,
            title: 'Excellent',
            body: 'Great!',
            pros: '',
            cons: '',
            helpful_count: 5,
            display_name: 'User 1',
            created: '2025-01-01T00:00:00Z',
            user: 1,
            status: 'approved',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await reviewsService.getReviews(123, 1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/?card=123&page=1',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    test('uses default page 1 when not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
      });

      await reviewsService.getReviews(123);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/?card=123&page=1',
        expect.any(Object)
      );
    });
  });

  describe('createReview', () => {
    test('posts review with auth token', async () => {
      const input = {
        card: 123,
        rating: 5,
        title: 'Amazing!',
        body: 'Best card ever.',
        pros: 'Everything',
        cons: 'Nothing',
      };

      const mockResponse = {
        id: 10,
        card: 123,
        rating: 5,
        title: 'Amazing!',
        body: 'Best card ever.',
        pros: 'Everything',
        cons: 'Nothing',
        helpful_count: 0,
        display_name: 'Current User',
        created: '2025-06-15T12:00:00Z',
        user: 1,
        status: 'pending',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await reviewsService.createReview(input, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify(input),
        })
      );
      expect(result.id).toBe(10);
      expect(result.status).toBe('pending');
    });

    test('handles optional pros/cons', async () => {
      const input = {
        card: 123,
        rating: 4,
        title: 'Good',
        body: 'Nice card.',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: 11,
            card: 123,
            rating: 4,
            title: 'Good',
            body: 'Nice card.',
            pros: '',
            cons: '',
            helpful_count: 0,
            display_name: 'Current User',
            created: '2025-06-15T12:00:00Z',
            user: 1,
            status: 'pending',
          }),
      });

      const result = await reviewsService.createReview(input, 'test-token');
      expect(result.pros).toBe('');
      expect(result.cons).toBe('');
    });
  });

  describe('updateReview', () => {
    test('patches review with auth token', async () => {
      const input = { rating: 4, title: 'Updated title' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 10,
            card: 123,
            rating: 4,
            title: 'Updated title',
            body: 'Best card ever.',
            pros: 'Everything',
            cons: 'Nothing',
            helpful_count: 0,
            display_name: 'Current User',
            created: '2025-06-15T12:00:00Z',
            user: 1,
            status: 'pending',
          }),
      });

      const result = await reviewsService.updateReview(10, input, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/10/',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify(input),
        })
      );
      expect(result.rating).toBe(4);
      expect(result.title).toBe('Updated title');
    });
  });

  describe('deleteReview', () => {
    test('deletes review with auth token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await reviewsService.deleteReview(10, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/10/',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );
    });
  });

  describe('toggleHelpful', () => {
    test('toggles helpful vote', async () => {
      const mockResponse = { helpful_count: 6, user_voted_helpful: true };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await reviewsService.toggleHelpful(10, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/reviews/10/helpful/',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    test('throws on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(reviewsService.getSummary(1)).rejects.toThrow('Network error');
    });

    test('throws on API error with detail', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Invalid rating value' }),
      });

      await expect(reviewsService.getSummary(1)).rejects.toThrow('Invalid rating value');
    });

    test('throws on API error with field errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ title: ['This field is required.'] }),
      });

      await expect(reviewsService.getSummary(1)).rejects.toThrow('This field is required.');
    });
  });
});
