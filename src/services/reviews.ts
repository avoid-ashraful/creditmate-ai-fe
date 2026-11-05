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

/** Product types that carry community reviews (Phase 3B). */
export type ReviewProductType = 'card' | 'deposit' | 'loan' | 'account';

/** URL segment per generalised product type (cards keep the legacy routes). */
const PRODUCT_SEGMENTS: Record<Exclude<ReviewProductType, 'card'>, string> = {
  deposit: 'deposits',
  loan: 'loans',
  account: 'accounts',
};

/**
 * Review payload for deposits/loans/accounts.
 * Matches the backend ProductReviewSerializer output.
 */
export interface ProductReviewApiResponse {
  id: number;
  product: number;
  product_type: Exclude<ReviewProductType, 'card'>;
  rating: number;
  title: string;
  body: string;
  pros: string;
  cons: string;
  helpful_count: number;
  reviewer_name: string;
  /** Present only on own-review and moderation responses. */
  status?: 'pending' | 'approved' | 'rejected';
  created: string;
  modified: string;
}

/**
 * Generalised review summary, one shape for all four product types.
 * GET /api/v1/reviews/{segment}/{product_id}/summary/ (cards: /reviews/cards/…)
 */
export interface ProductReviewSummaryResponse {
  product_type: ReviewProductType;
  product: number;
  average_rating: number | null;
  review_count: number;
  approved_count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  community_reviewed: boolean;
}

/** Frontend-friendly product review (any of the four types). */
export interface ProductReview {
  id: number;
  productId: number;
  productType: ReviewProductType;
  rating: number;
  title: string;
  body: string;
  pros: string;
  cons: string;
  helpfulCount: number;
  reviewerName: string;
  status?: 'pending' | 'approved' | 'rejected';
  created: Date;
  modified: Date;
}

export function transformProductReview(apiReview: ProductReviewApiResponse): ProductReview {
  return {
    id: apiReview.id,
    productId: apiReview.product,
    productType: apiReview.product_type,
    rating: apiReview.rating,
    title: apiReview.title,
    body: apiReview.body,
    pros: apiReview.pros,
    cons: apiReview.cons,
    helpfulCount: apiReview.helpful_count,
    reviewerName: apiReview.reviewer_name,
    status: apiReview.status,
    created: new Date(apiReview.created),
    modified: new Date(apiReview.modified),
  };
}

/** Own card review payload (legacy card serializer + status). */
export interface OwnCardReviewApiResponse extends ReviewApiResponse {
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Comment on a review. Matches ReviewCommentSerializer output; the
 * author's own comments additionally carry `status`. Replies are one
 * level deep and nested under their top-level parent.
 */
export interface ReviewCommentApiResponse {
  id: number;
  review: number;
  review_type: ReviewProductType;
  parent: number | null;
  author_name: string;
  /** True when the requesting user authored the comment. */
  is_own?: boolean;
  body: string;
  status?: 'pending' | 'approved' | 'rejected';
  created: string;
  modified: string;
  replies?: ReviewCommentApiResponse[];
}

/** Frontend-friendly comment. */
export interface ReviewComment {
  id: number;
  reviewId: number;
  reviewType: ReviewProductType;
  parent: number | null;
  authorName: string;
  isOwn: boolean;
  body: string;
  status?: 'pending' | 'approved' | 'rejected';
  created: Date;
  modified: Date;
  replies: ReviewComment[];
}

export function transformComment(apiComment: ReviewCommentApiResponse): ReviewComment {
  return {
    id: apiComment.id,
    reviewId: apiComment.review,
    reviewType: apiComment.review_type,
    parent: apiComment.parent,
    authorName: apiComment.author_name,
    isOwn: apiComment.is_own ?? false,
    body: apiComment.body,
    status: apiComment.status,
    created: new Date(apiComment.created),
    modified: new Date(apiComment.modified),
    replies: (apiComment.replies || []).map(transformComment),
  };
}

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

  // ------------------------------------------------------------------
  // Generalised product reviews (Phase 3B): deposits, loans, accounts.
  // ------------------------------------------------------------------

  transformProductReview(apiReview: ProductReviewApiResponse): ProductReview {
    return transformProductReview(apiReview);
  }

  transformComment(apiComment: ReviewCommentApiResponse): ReviewComment {
    return transformComment(apiComment);
  }

  private segment(type: ReviewProductType): string {
    if (type === 'card') throw new Error('Cards use the legacy review endpoints.');
    return PRODUCT_SEGMENTS[type];
  }

  private authHeaders(accessToken: string): Record<string, string> {
    return { Authorization: `Bearer ${accessToken}` };
  }

  /**
   * Approved reviews for a deposit/loan/account product.
   * GET /api/v1/reviews/{segment}/?product=<id>&page=<page>
   */
  async getProductReviews(
    type: ReviewProductType,
    productId: number,
    page = 1
  ): Promise<ApiResponse<ProductReviewApiResponse>> {
    const params = new URLSearchParams();
    params.append('product', productId.toString());
    params.append('page', page.toString());
    return this.fetchApi<ApiResponse<ProductReviewApiResponse>>(
      `${REVIEWS_ENDPOINT}${this.segment(type)}/?${params.toString()}`
    );
  }

  /**
   * Review summary for any product type, normalised to one shape.
   * Cards read the legacy summary endpoint (which now also returns the
   * generalised keys); other types use their own summary endpoint.
   */
  async getProductSummary(
    type: ReviewProductType,
    productId: number
  ): Promise<ProductReviewSummaryResponse> {
    if (type === 'card') {
      const data = await this.fetchApi<
        ReviewSummaryResponse & Partial<ProductReviewSummaryResponse>
      >(`/reviews/cards/${productId}/summary/`);
      const reviewCount = data.review_count;
      return {
        product_type: 'card',
        product: productId,
        average_rating: data.average_rating,
        review_count: reviewCount,
        approved_count: data.approved_count ?? reviewCount,
        distribution: data.distribution,
        community_reviewed: data.community_reviewed ?? reviewCount >= 50,
      };
    }
    return this.fetchApi<ProductReviewSummaryResponse>(
      `${REVIEWS_ENDPOINT}${this.segment(type)}/${productId}/summary/`
    );
  }

  /**
   * Create a review for a deposit/loan/account product (pending moderation).
   * POST /api/v1/reviews/{segment}/
   */
  async createProductReview(
    type: ReviewProductType,
    input: {
      product: number;
      rating: number;
      title: string;
      body: string;
      pros?: string;
      cons?: string;
    },
    accessToken: string
  ): Promise<ProductReview> {
    const response = await this.fetchApi<ProductReviewApiResponse>(
      `${REVIEWS_ENDPOINT}${this.segment(type)}/`,
      {
        method: 'POST',
        headers: this.authHeaders(accessToken),
        body: JSON.stringify(input),
      }
    );
    return transformProductReview(response);
  }

  /**
   * The signed-in user's own review of a product, any status, or null.
   * Cards: GET /api/v1/reviews/mine/?card=<id>
   * Others: GET /api/v1/reviews/{segment}/mine/?product=<id>
   */
  async getOwnProductReview(
    type: ReviewProductType,
    productId: number,
    accessToken: string
  ): Promise<ProductReview | null> {
    if (type === 'card') {
      const data = await this.fetchApi<ApiResponse<OwnCardReviewApiResponse>>(
        `${REVIEWS_ENDPOINT}mine/?card=${productId}`,
        { headers: this.authHeaders(accessToken) }
      );
      const first = data.results[0];
      if (!first) return null;
      return {
        id: first.id,
        productId: first.card,
        productType: 'card',
        rating: first.rating,
        title: first.title,
        body: first.body,
        pros: first.pros,
        cons: first.cons,
        helpfulCount: first.helpful_count,
        reviewerName: first.reviewer_name,
        status: first.status,
        created: new Date(first.created),
        modified: new Date(first.modified),
      };
    }
    const data = await this.fetchApi<ApiResponse<ProductReviewApiResponse>>(
      `${REVIEWS_ENDPOINT}${this.segment(type)}/mine/?product=${productId}`,
      { headers: this.authHeaders(accessToken) }
    );
    const first = data.results[0];
    return first ? transformProductReview(first) : null;
  }

  /** Update an own product review (returns it to pending moderation). */
  async updateProductReview(
    type: ReviewProductType,
    id: number,
    input: UpdateReviewInput,
    accessToken: string
  ): Promise<ProductReview> {
    if (type === 'card') {
      const updated = await this.updateReview(id, input, accessToken);
      return { ...updated, productId: updated.cardId, productType: 'card' };
    }
    const response = await this.fetchApi<ProductReviewApiResponse>(
      `${REVIEWS_ENDPOINT}${this.segment(type)}/mine/${id}/`,
      {
        method: 'PATCH',
        headers: this.authHeaders(accessToken),
        body: JSON.stringify(input),
      }
    );
    return transformProductReview(response);
  }

  /** Delete an own product review. */
  async deleteProductReview(
    type: ReviewProductType,
    id: number,
    accessToken: string
  ): Promise<void> {
    if (type === 'card') {
      await this.deleteReview(id, accessToken);
      return;
    }
    await this.fetchApi<void>(`${REVIEWS_ENDPOINT}${this.segment(type)}/mine/${id}/`, {
      method: 'DELETE',
      headers: this.authHeaders(accessToken),
    });
  }

  /** Helpful vote on a deposit/loan/account review. */
  async voteProductHelpful(
    type: ReviewProductType,
    id: number,
    accessToken: string
  ): Promise<{ helpful_count: number }> {
    if (type === 'card') {
      return this.voteHelpful(id, accessToken);
    }
    return this.fetchApi<{ helpful_count: number }>(
      `${REVIEWS_ENDPOINT}${this.segment(type)}/${id}/helpful/`,
      { method: 'POST', headers: this.authHeaders(accessToken) }
    );
  }

  // ------------------------------------------------------------------
  // Comments on reviews (all four product types).
  // ------------------------------------------------------------------

  /**
   * Comment thread for one review. Approved comments are public; when a
   * token is supplied the author's own pending comments are included
   * (with their status).
   * GET /api/v1/reviews/comments/{type}/{review_id}/
   */
  async getComments(
    type: ReviewProductType,
    reviewId: number,
    accessToken?: string | null
  ): Promise<ReviewComment[]> {
    const data = await this.fetchApi<{
      count: number;
      results: ReviewCommentApiResponse[];
    }>(
      `${REVIEWS_ENDPOINT}comments/${type}/${reviewId}/`,
      accessToken ? { headers: this.authHeaders(accessToken) } : {}
    );
    return data.results.map(transformComment);
  }

  /** Post a comment (or one-level reply). Starts pending moderation. */
  async createComment(
    type: ReviewProductType,
    reviewId: number,
    input: { body: string; parent?: number | null },
    accessToken: string
  ): Promise<ReviewComment> {
    const response = await this.fetchApi<ReviewCommentApiResponse>(
      `${REVIEWS_ENDPOINT}comments/${type}/${reviewId}/`,
      {
        method: 'POST',
        headers: this.authHeaders(accessToken),
        body: JSON.stringify(input),
      }
    );
    return transformComment(response);
  }

  /** Edit an own comment (returns it to pending moderation). */
  async updateComment(
    id: number,
    input: { body: string },
    accessToken: string
  ): Promise<ReviewComment> {
    const response = await this.fetchApi<ReviewCommentApiResponse>(
      `${REVIEWS_ENDPOINT}comments/mine/${id}/`,
      {
        method: 'PATCH',
        headers: this.authHeaders(accessToken),
        body: JSON.stringify(input),
      }
    );
    return transformComment(response);
  }

  /** Delete an own comment. */
  async deleteComment(id: number, accessToken: string): Promise<void> {
    await this.fetchApi<void>(`${REVIEWS_ENDPOINT}comments/mine/${id}/`, {
      method: 'DELETE',
      headers: this.authHeaders(accessToken),
    });
  }
}

export const reviewsService = new ReviewsService();
