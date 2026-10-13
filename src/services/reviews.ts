import { ENV } from '../config/env';

import { ApiResponse } from './api';
import { responseApiError, resilientFetch } from './apiError';

/**
 * Review API response from the backend.
 * Matches DRF serializer output for the reviews endpoint.
 */
export interface ReviewApiResponse {
  id: number;
  card: number;
  rating: number; // 1-5
  title: string;
  body: string;
  pros: string;
  cons: string;
  helpful_count: number;
  reviewer_name: string;
  created: string; // ISO datetime
  modified: string;
}

/**
 * Review summary from the backend.
 * GET /api/v1/reviews/cards/{card_id}/summary/
 */
export interface ReviewSummaryResponse {
  card: number;
  average_rating: number | null;
  review_count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Frontend-friendly review type with normalized fields.
 */
export interface Review {
  id: number;
  cardId: number;
  rating: number;
  title: string;
  body: string;
  pros: string;
  cons: string;
  helpfulCount: number;
  reviewerName: string;
  created: Date;
  modified: Date;
}

/**
 * Input for creating a new review.
 * POST /api/v1/reviews/
 */
export interface CreateReviewInput {
  card: number;
  rating: number; // 1-5
  title: string;
  body: string;
  pros?: string;
  cons?: string;
}

/**
 * Input for updating an existing review.
 * PATCH /api/v1/reviews/mine/{id}/
 */
export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  body?: string;
  pros?: string;
  cons?: string;
}

/**
 * Paginated review list response.
 */
export type ReviewListResponse = ApiResponse<ReviewApiResponse>;

/**
 * Normalize a review from API response to frontend type.
 */
export function transformReview(apiReview: ReviewApiResponse): Review {
  return {
    id: apiReview.id,
    cardId: apiReview.card,
    rating: apiReview.rating,
    title: apiReview.title,
    body: apiReview.body,
    pros: apiReview.pros,
    cons: apiReview.cons,
    helpfulCount: apiReview.helpful_count,
    reviewerName: apiReview.reviewer_name,
    created: new Date(apiReview.created),
    modified: new Date(apiReview.modified),
  };
}

const REVIEWS_ENDPOINT = '/reviews/';

class ReviewsService {
  transformReview(apiReview: ReviewApiResponse): Review {
    return transformReview(apiReview);
  }

  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${ENV.API_BASE_URL}${endpoint}`;

    try {
      const response = await resilientFetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw await responseApiError(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (ENV.ENABLE_API_LOGGING) {
        console.error('Reviews API fetch error:', { url, error });
      }
      throw error;
    }
  }

  /**
   * Get paginated list of approved reviews for a card.
   * GET /api/v1/reviews/?card=<id>&page=<page>
   */
  async getReviews(cardId: number, page = 1): Promise<ReviewListResponse> {
    const params = new URLSearchParams();
    params.append('card', cardId.toString());
    params.append('page', page.toString());

    return this.fetchApi<ReviewListResponse>(`${REVIEWS_ENDPOINT}?${params.toString()}`);
  }

  /**
   * Get review summary (average, count, distribution) for a card.
   * GET /api/v1/reviews/cards/{card_id}/summary/
   */
  async getSummary(cardId: number): Promise<ReviewSummaryResponse> {
    return this.fetchApi<ReviewSummaryResponse>(`/reviews/cards/${cardId}/summary/`);
  }

  /**
   * Create a new review (requires authentication).
   * POST /api/v1/reviews/
   */
  async createReview(input: CreateReviewInput, accessToken: string): Promise<Review> {
    const response = await this.fetchApi<ReviewApiResponse>(REVIEWS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });

    return transformReview(response);
  }

  /**
   * Update an existing review (requires authentication, own review only).
   * PATCH /api/v1/reviews/mine/{id}/
   */
  async updateReview(id: number, input: UpdateReviewInput, accessToken: string): Promise<Review> {
    const response = await this.fetchApi<ReviewApiResponse>(`${REVIEWS_ENDPOINT}mine/${id}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });

    return transformReview(response);
  }

  /**
   * Delete a review (requires authentication, own review only).
   * DELETE /api/v1/reviews/mine/{id}/
   */
  async deleteReview(id: number, accessToken: string): Promise<void> {
    await this.fetchApi<void>(`${REVIEWS_ENDPOINT}mine/${id}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Add a helpful vote to a review (requires authentication; votes cannot be toggled).
   * POST /api/v1/reviews/{id}/helpful/
   */
  async voteHelpful(id: number, accessToken: string): Promise<{ helpful_count: number }> {
    const response = await this.fetchApi<{ helpful_count: number }>(
      `${REVIEWS_ENDPOINT}${id}/helpful/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response;
  }
}

export const reviewsService = new ReviewsService();
