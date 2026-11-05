import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import { useLanguage } from '../locales';
import { formatGregorianDate, pluralize } from '../locales/format';
import { getReviewsCopy } from '../locales/reviews';
import type { Language } from '../locales/types';
import { ApiError, authClient } from '../services/auth';
import {
  ProductReview,
  ProductReviewSummaryResponse,
  ReviewComment,
  ReviewProductType,
  reviewsService,
} from '../services/reviews';
import { Review } from '../types';
import { aggregateRatingJsonLd } from '../utils/structuredData';

import { ResendVerification } from './ResendVerification';
import './ReviewsSection.css';
import './ProductReviews.css';

interface ReviewsSectionProps {
  /** Product type under review; cards keep the original endpoints. */
  productType?: ReviewProductType;
  productId: number;
  productName: string;
  productUrl: string;
}

/** Adapt a generalised product review to the legacy list-item shape. */
const toListReview = (review: ProductReview): Review => ({
  id: review.id,
  cardId: review.productId,
  rating: review.rating,
  title: review.title,
  body: review.body,
  pros: review.pros,
  cons: review.cons,
  helpfulCount: review.helpfulCount,
  reviewerName: review.reviewerName,
  created: review.created,
  modified: review.modified,
});

/** Moderation state chip (in-place state card grammar: icon + word). */
const ReviewStateChip: React.FC<{
  status: 'pending' | 'approved' | 'rejected';
  copy: ReturnType<typeof getReviewsCopy>;
}> = ({ status, copy }) => {
  if (status === 'approved') {
    return (
      <span className="review-state-chip review-state-approved">
        <span aria-hidden="true">✅</span> {copy.stateApproved}
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="review-state-chip review-state-rejected">
        <span aria-hidden="true">⚠</span> {copy.stateRejected}
      </span>
    );
  }
  return (
    <span className="review-state-chip review-state-pending">
      <span aria-hidden="true">⏳</span> {copy.statePending}
    </span>
  );
};

/**
 * Star rating display component.
 */
const StarRating: React.FC<{
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}> = ({ rating, maxRating = 5, size = 'md', ariaLabel }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const stars = [];
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={i} className={`star full star-${size}`} aria-hidden="true">
        ★
      </span>
    );
  }
  if (hasHalfStar) {
    stars.push(
      <span key="half" className={`star half star-${size}`} aria-hidden="true">
        ★
      </span>
    );
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className={`star empty star-${size}`} aria-hidden="true">
        ★
      </span>
    );
  }

  return (
    <span
      className="star-rating"
      role="img"
      aria-label={ariaLabel || `${rating} out of ${maxRating} stars`}
    >
      {stars}
    </span>
  );
};

/**
 * Distribution bar for a single rating level.
 */
const DistributionBar: React.FC<{
  rating: number;
  count: number;
  total: number;
  average: number;
  size?: 'sm' | 'md';
}> = ({ rating, count, total, average, size = 'md' }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const isActive = rating <= Math.ceil(average) && rating > Math.floor(average);
  const isFull = rating <= Math.floor(average);

  return (
    <div className={`distribution-bar ${size}`} role="listitem">
      <span className="distribution-label">{rating}★</span>
      <div
        className="distribution-track"
        role="img"
        aria-label={`${rating} star: ${count} reviews`}
      >
        <div
          className={`distribution-fill ${isFull ? 'full' : isActive ? 'partial' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="distribution-count">{count}</span>
    </div>
  );
};

/**
 * Summary card showing average rating and distribution.
 */
const ReviewSummaryCard: React.FC<{
  summary: ProductReviewSummaryResponse;
  copy: ReturnType<typeof getReviewsCopy>;
  lang: Language;
}> = ({ summary, copy, lang }) => {
  const average = summary.average_rating;
  const count = summary.review_count;
  const { distribution } = summary;
  const hasReviews = count > 0;

  if (!hasReviews) {
    return (
      <div className="review-summary empty">
        <h3>{copy.averageRating}</h3>
        <div className="empty-state">
          <p>{copy.noReviewsYet}</p>
          <p className="empty-hint">{copy.beFirstToReview}</p>
        </div>
      </div>
    );
  }

  const ratingValue = average ?? 0;
  const reviewCountLabel =
    lang === 'en'
      ? `based on ${count} ${pluralize(count, 'review', 'reviews', lang)}`
      : copy.basedOnReviews.replace('{count}', count.toString());
  const distributionEntries = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: distribution[r as keyof typeof distribution],
  }));

  return (
    <div className="review-summary">
      <div className="summary-main">
        <div className="average-rating">
          <h3 className="average-label">{copy.averageRating}</h3>
          <span className="average-value">{ratingValue.toFixed(1)}</span>
          <StarRating
            rating={ratingValue}
            size="lg"
            ariaLabel={`${ratingValue.toFixed(1)} out of 5 stars`}
          />
          <span className="review-count">{reviewCountLabel}</span>
        </div>
      </div>
      <div className="summary-distribution" role="list" aria-label="Rating distribution">
        {distributionEntries.map(entry => (
          <DistributionBar
            key={entry.rating}
            rating={entry.rating}
            count={entry.count}
            total={count}
            average={ratingValue}
            size="md"
          />
        ))}
      </div>
      {summary.community_reviewed && (
        <div className="community-reviewed">
          <span className="community-chip">
            <span aria-hidden="true">✅</span> {copy.communityReviewed}
          </span>
          <p className="community-note">{copy.communityReviewedNote.replace('{count}', '50')}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Individual review item.
 */
interface ReviewItemProps {
  review: Review;
  copy: ReturnType<typeof getReviewsCopy>;
  onHelpfulClick: (id: number) => void;
  commentsSlot?: React.ReactNode;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review, copy, onHelpfulClick, commentsSlot }) => {
  const date = review.created ? formatGregorianDate(review.created) : '';

  return (
    <div className="review-item" role="listitem">
      <header className="review-header">
        <div className="review-author">
          <span className="display-name">{review.reviewerName}</span>
        </div>
        <div className="review-meta">
          <StarRating
            rating={review.rating}
            size="sm"
            ariaLabel={`${review.rating} out of 5 stars`}
          />
          {date && (
            <time className="review-date" dateTime={review.created.toISOString()}>
              {copy.postedOn.replace('{date}', date)}
            </time>
          )}
        </div>
      </header>

      <div className="review-content">
        <h4 className="review-title">{review.title}</h4>
        <div className="review-body">{review.body}</div>

        {(review.pros || review.cons) && (
          <div className="review-pros-cons">
            {review.pros && (
              <div className="pros">
                <strong>{copy.prosLabel}:</strong> {review.pros}
              </div>
            )}
            {review.cons && (
              <div className="cons">
                <strong>{copy.consLabel}:</strong> {review.cons}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="review-footer">
        <button
          type="button"
          className="helpful-button"
          onClick={() => onHelpfulClick(review.id)}
          aria-label={copy.voteHelpful}
        >
          <span className="helpful-icon" aria-hidden="true">
            👍
          </span>
          <span className="helpful-text">{copy.voteHelpful}</span>
          <span className="helpful-count">({review.helpfulCount})</span>
        </button>
      </footer>

      {commentsSlot}
    </div>
  );
};

/**
 * One comment (top-level or reply). The author's own comments carry
 * their moderation state in place (icon + word) and edit/delete actions.
 */
const CommentItem: React.FC<{
  comment: ReviewComment;
  copy: ReturnType<typeof getReviewsCopy>;
  isOwn: boolean;
  onReply: (comment: ReviewComment) => void;
  onEdit: (comment: ReviewComment, body: string) => Promise<void>;
  onDelete: (comment: ReviewComment) => Promise<void>;
  canInteract: boolean;
}> = ({ comment, copy, isOwn, onReply, onEdit, onDelete, canInteract }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const date = comment.created ? formatGregorianDate(comment.created) : '';

  return (
    <div className="comment-item">
      <div className="comment-meta">
        <span className="comment-author">{comment.authorName}</span>
        {comment.status && comment.status !== 'approved' && (
          <ReviewStateChip status={comment.status} copy={copy} />
        )}
        {date && (
          <time className="comment-date" dateTime={comment.created.toISOString()}>
            {date}
          </time>
        )}
      </div>
      {editing ? (
        <form
          className="comment-edit-form"
          onSubmit={async e => {
            e.preventDefault();
            await onEdit(comment, draft.trim());
            setEditing(false);
          }}
        >
          <label className="p3b-sr-only" htmlFor={`comment-edit-${comment.id}`}>
            {copy.comments}
          </label>
          <textarea
            id={`comment-edit-${comment.id}`}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="comment-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={!draft.trim()}>
              {copy.updateReview}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditing(false)}
            >
              {copy.cancel}
            </button>
          </div>
        </form>
      ) : (
        <p className="comment-body">{comment.body}</p>
      )}
      {!editing && (
        <div className="comment-actions">
          {canInteract && comment.parent === null && (
            <button type="button" className="comment-action" onClick={() => onReply(comment)}>
              {copy.reply}
            </button>
          )}
          {isOwn && (
            <>
              <button
                type="button"
                className="comment-action"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(true);
                }}
              >
                {copy.edit}
              </button>
              {confirmingDelete ? (
                <button
                  type="button"
                  className="comment-action comment-action-danger"
                  onClick={async () => {
                    await onDelete(comment);
                    setConfirmingDelete(false);
                  }}
                >
                  {copy.confirmDelete}
                </button>
              ) : (
                <button
                  type="button"
                  className="comment-action"
                  onClick={() => setConfirmingDelete(true)}
                >
                  {copy.delete}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Comment thread for one review. Comments are moderated like reviews:
 * a new comment appears for its author immediately, marked pending,
 * and becomes public only after approval.
 */
const ReviewComments: React.FC<{
  productType: ReviewProductType;
  reviewId: number;
  copy: ReturnType<typeof getReviewsCopy>;
  isSignedIn: boolean;
  getAccessToken: () => Promise<string | null>;
  onLogin: () => void;
}> = ({ productType, reviewId, copy, isSignedIn, getAccessToken, onLogin }) => {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ReviewComment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const token = await getAccessToken();
      const data = await reviewsService.getComments(productType, reviewId, token);
      setComments(data);
      setLoaded(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [productType, reviewId, getAccessToken]);

  useEffect(() => {
    if (expanded && !loaded) {
      load();
    }
  }, [expanded, loaded, load]);

  const isOwn = (comment: ReviewComment) => comment.isOwn;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const token = await getAccessToken();
    if (!token) {
      setNotice(copy.unauthorizedError);
      return;
    }
    try {
      const created = await reviewsService.createComment(
        productType,
        reviewId,
        { body, parent: replyTo ? replyTo.id : null },
        token
      );
      setComments(prev => {
        if (created.parent === null) return [...prev, created];
        return prev.map(comment =>
          comment.id === created.parent
            ? { ...comment, replies: [...comment.replies, created] }
            : comment
        );
      });
      setDraft('');
      setReplyTo(null);
      setNotice(copy.commentSubmitted);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : copy.genericError);
    }
  };

  const handleEdit = async (comment: ReviewComment, body: string) => {
    const token = await getAccessToken();
    if (!token) return;
    const updated = await reviewsService.updateComment(comment.id, { body }, token);
    const replace = (items: ReviewComment[]): ReviewComment[] =>
      items.map(item =>
        item.id === updated.id
          ? { ...updated, replies: item.replies }
          : { ...item, replies: replace(item.replies) }
      );
    setComments(prev => replace(prev));
    setNotice(copy.commentSubmitted);
  };

  const handleDelete = async (comment: ReviewComment) => {
    const token = await getAccessToken();
    if (!token) return;
    await reviewsService.deleteComment(comment.id, token);
    setComments(prev =>
      prev
        .filter(item => item.id !== comment.id)
        .map(item => ({
          ...item,
          replies: item.replies.filter(reply => reply.id !== comment.id),
        }))
    );
    setNotice(copy.commentDeleted);
  };

  const totalCount = comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);

  return (
    <div className="review-comments">
      <button
        type="button"
        className="comments-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(prev => !prev)}
      >
        <span aria-hidden="true">💬</span> {copy.comments}
        {loaded && <span className="comments-count"> ({totalCount})</span>}
      </button>
      {expanded && (
        <div className="comments-thread">
          {loading ? (
            <p role="status">{copy.commentsLoading}</p>
          ) : failed ? (
            <p role="alert">{copy.networkError}</p>
          ) : (
            <>
              {comments.length === 0 ? (
                <p className="comments-empty">{copy.noCommentsYet}</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="comment-thread-item">
                    <CommentItem
                      comment={comment}
                      copy={copy}
                      isOwn={isOwn(comment)}
                      canInteract={isSignedIn}
                      onReply={target => {
                        setReplyTo(target);
                        setDraft('');
                      }}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                    {comment.replies.length > 0 && (
                      <div className="comment-replies">
                        {comment.replies.map(reply => (
                          <CommentItem
                            key={reply.id}
                            comment={reply}
                            copy={copy}
                            isOwn={isOwn(reply)}
                            canInteract={isSignedIn}
                            onReply={() => undefined}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              <p className="comments-moderation-note">{copy.commentsModerationNote}</p>
              {notice && (
                <div className="pending-notice" role="status" aria-live="polite">
                  {notice}
                </div>
              )}
              {isSignedIn ? (
                <form className="comment-form" onSubmit={handlePost}>
                  {replyTo && (
                    <p className="comment-replying">
                      {copy.reply}: {replyTo.authorName}{' '}
                      <button
                        type="button"
                        className="comment-action"
                        onClick={() => setReplyTo(null)}
                      >
                        {copy.cancel}
                      </button>
                    </p>
                  )}
                  <label className="p3b-sr-only" htmlFor={`comment-input-${reviewId}`}>
                    {copy.comments}
                  </label>
                  <textarea
                    id={`comment-input-${reviewId}`}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={replyTo ? copy.replyPlaceholder : copy.commentPlaceholder}
                    rows={3}
                    maxLength={2000}
                  />
                  <div className="comment-actions">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={!draft.trim()}
                    >
                      {copy.postComment}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="comment-login">
                  {copy.loginToComment}{' '}
                  <button type="button" className="action-button" onClick={onLogin}>
                    {copy.loginLink}
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * The signed-in author's own review, held in place with its moderation
 * state (addendum pattern B3: state changes, footprint does not).
 */
const OwnReviewCard: React.FC<{
  review: ProductReview;
  copy: ReturnType<typeof getReviewsCopy>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  commentsSlot?: React.ReactNode;
}> = ({ review, copy, onEdit, onDelete, commentsSlot }) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const date = review.created ? formatGregorianDate(review.created) : '';

  return (
    <div className="own-review-card" aria-label={copy.yourReview}>
      <div className="own-review-header">
        <h3>{copy.yourReview}</h3>
        <ReviewStateChip status={review.status ?? 'pending'} copy={copy} />
      </div>
      <div className="review-meta">
        <StarRating
          rating={review.rating}
          size="sm"
          ariaLabel={`${review.rating} out of 5 stars`}
        />
        {date && (
          <time className="review-date" dateTime={review.created.toISOString()}>
            {copy.postedOn.replace('{date}', date)}
          </time>
        )}
      </div>
      <h4 className="review-title">{review.title}</h4>
      <p className="review-body">{review.body}</p>
      {review.status === 'pending' && (
        <p className="own-review-note">{copy.pendingModerationNotice}</p>
      )}
      {review.status === 'rejected' && (
        <p className="own-review-note" role="alert">
          {copy.rejectedNotice}
        </p>
      )}
      <div className="comment-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}>
          {copy.edit}
        </button>
        {confirmingDelete ? (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={async () => {
              await onDelete();
              setConfirmingDelete(false);
            }}
          >
            {copy.confirmDelete}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setConfirmingDelete(true)}
          >
            {copy.delete}
          </button>
        )}
      </div>
      {review.status === 'approved' && commentsSlot}
    </div>
  );
};

/**
 * Review form for creating/editing reviews.
 */
interface ReviewFormProps {
  initialData?: Partial<Review> | null;
  onSubmit: (data: {
    rating: number;
    title: string;
    body: string;
    pros: string;
    cons: string;
  }) => void;
  onCancel: () => void;
  submitting: boolean;
  copy: ReturnType<typeof getReviewsCopy>;
  isEditing?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  initialData = null,
  onSubmit,
  onCancel,
  submitting,
  copy,
  isEditing = false,
}) => {
  const [rating, setRating] = useState<number>(initialData?.rating || 0);
  const [title, setTitle] = useState(initialData?.title || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [pros, setPros] = useState(initialData?.pros || '');
  const [cons, setCons] = useState(initialData?.cons || '');
  const [errors, setErrors] = useState<
    Partial<Record<'rating' | 'title' | 'body' | 'pros' | 'cons', string>>
  >({});

  const MAX_TITLE_LENGTH = 120;
  const MAX_BODY_LENGTH = 5000;
  const MAX_PROS_CONS_LENGTH = 1000;

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!rating) newErrors.rating = copy.ratingRequired;
    if (!title.trim()) newErrors.title = copy.titleRequired;
    else if (title.length > MAX_TITLE_LENGTH)
      newErrors.title = copy.maxLengthError.replace('{max}', MAX_TITLE_LENGTH.toString());
    if (!body.trim()) newErrors.body = copy.bodyRequired;
    else if (body.length > MAX_BODY_LENGTH)
      newErrors.body = copy.maxLengthError.replace('{max}', MAX_BODY_LENGTH.toString());
    if (pros.length > MAX_PROS_CONS_LENGTH)
      newErrors.pros = copy.maxLengthError.replace('{max}', MAX_PROS_CONS_LENGTH.toString());
    if (cons.length > MAX_PROS_CONS_LENGTH)
      newErrors.cons = copy.maxLengthError.replace('{max}', MAX_PROS_CONS_LENGTH.toString());
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rating, title, body, pros, cons, copy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        rating,
        title: title.trim(),
        body: body.trim(),
        pros: pros.trim(),
        cons: cons.trim(),
      });
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <h3>{isEditing ? copy.editReviewTitle : copy.writeReviewTitle}</h3>

      {/* Rating */}
      <fieldset className="form-field" aria-required="true">
        <legend className="form-label">{copy.yourRating}</legend>
        <div className="rating-input" role="radiogroup" aria-label={copy.yourRating}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`rating-star ${rating >= star ? 'selected' : ''}`}
              onClick={() => setRating(star)}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              aria-pressed={rating === star}
            >
              ★
            </button>
          ))}
        </div>
        {errors.rating && (
          <span className="field-error" role="alert">
            {errors.rating}
          </span>
        )}
      </fieldset>

      {/* Title */}
      <div className="form-field">
        <label htmlFor="review-title" className="form-label">
          {copy.reviewTitle} <span aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="review-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={copy.reviewTitlePlaceholder}
          maxLength={MAX_TITLE_LENGTH}
          className={errors.title ? 'error' : ''}
          aria-describedby={errors.title ? 'title-error' : 'title-hint'}
          aria-invalid={!!errors.title}
          disabled={submitting}
        />
        <div className="field-hint" id="title-hint">
          {copy.charCounter
            .replace('{current}', title.length.toString())
            .replace('{max}', MAX_TITLE_LENGTH.toString())}
        </div>
        {errors.title && (
          <span className="field-error" id="title-error" role="alert">
            {errors.title}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="form-field">
        <label htmlFor="review-body" className="form-label">
          {copy.reviewBody} <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={copy.reviewBodyPlaceholder}
          maxLength={MAX_BODY_LENGTH}
          rows={6}
          className={errors.body ? 'error' : ''}
          aria-describedby={errors.body ? 'body-error' : 'body-hint'}
          aria-invalid={!!errors.body}
          disabled={submitting}
        />
        <div className="field-hint" id="body-hint">
          {copy.charCounter
            .replace('{current}', body.length.toString())
            .replace('{max}', MAX_BODY_LENGTH.toString())}
        </div>
        {errors.body && (
          <span className="field-error" id="body-error" role="alert">
            {errors.body}
          </span>
        )}
      </div>

      {/* Pros */}
      <div className="form-field">
        <label htmlFor="review-pros" className="form-label">
          {copy.prosOptional}
        </label>
        <input
          type="text"
          id="review-pros"
          value={pros}
          onChange={e => setPros(e.target.value)}
          placeholder={copy.prosPlaceholder}
          maxLength={MAX_PROS_CONS_LENGTH}
          className={errors.pros ? 'error' : ''}
          aria-describedby={errors.pros ? 'pros-error' : 'pros-hint'}
          aria-invalid={!!errors.pros}
          disabled={submitting}
        />
        <div className="field-hint" id="pros-hint">
          {copy.charCounter
            .replace('{current}', pros.length.toString())
            .replace('{max}', MAX_PROS_CONS_LENGTH.toString())}
        </div>
        {errors.pros && (
          <span className="field-error" id="pros-error" role="alert">
            {errors.pros}
          </span>
        )}
      </div>

      {/* Cons */}
      <div className="form-field">
        <label htmlFor="review-cons" className="form-label">
          {copy.consOptional}
        </label>
        <input
          type="text"
          id="review-cons"
          value={cons}
          onChange={e => setCons(e.target.value)}
          placeholder={copy.consPlaceholder}
          maxLength={MAX_PROS_CONS_LENGTH}
          className={errors.cons ? 'error' : ''}
          aria-describedby={errors.cons ? 'cons-error' : 'cons-hint'}
          aria-invalid={!!errors.cons}
          disabled={submitting}
        />
        <div className="field-hint" id="cons-hint">
          {copy.charCounter
            .replace('{current}', cons.length.toString())
            .replace('{max}', MAX_PROS_CONS_LENGTH.toString())}
        </div>
        {errors.cons && (
          <span className="field-error" id="cons-error" role="alert">
            {errors.cons}
          </span>
        )}
      </div>

      {isEditing && (
        <div className="pending-notice" role="status" aria-live="polite">
          <span className="notice-icon" aria-hidden="true">
            ⏳
          </span>
          <span>{copy.pendingModerationNotice}</span>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          {copy.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? copy.submitting : isEditing ? copy.updateReview : copy.submitReview}
        </button>
      </div>
    </form>
  );
};

/**
 * Login prompt for anonymous users.
 */
const LoginPrompt: React.FC<{ copy: ReturnType<typeof getReviewsCopy>; onLogin: () => void }> = ({
  copy,
  onLogin,
}) => {
  return (
    <div className="login-prompt" role="region" aria-label={copy.loginToReview}>
      <p>{copy.loginToReviewPrompt}</p>
      <div className="login-prompt-actions">
        <button type="button" className="btn btn-primary" onClick={onLogin}>
          {copy.loginLink}
        </button>
        <span className="login-separator">/</span>
        <button type="button" className="btn btn-outline" onClick={onLogin}>
          {copy.registerLink}
        </button>
      </div>
    </div>
  );
};

/**
 * Pagination controls.
 */
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  copy: ReturnType<typeof getReviewsCopy>;
}> = ({ currentPage, totalPages, totalCount, onPageChange, copy }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="reviews-pagination" aria-label={copy.reviewPagination}>
      <button
        type="button"
        className="btn btn-outline pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={copy.previousPage}
      >
        ← {copy.previousPage}
      </button>

      <span className="pagination-info" aria-live="polite">
        {copy.pageOf
          .replace('{current}', currentPage.toString())
          .replace('{total}', totalPages.toString())}
        <span className="total-count"> ({totalCount} reviews)</span>
      </span>

      <button
        type="button"
        className="btn btn-outline pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={copy.nextPage}
      >
        {copy.nextPage} →
      </button>
    </nav>
  );
};

/**
 * Main Reviews Section component — one grammar for all four product
 * types. Cards keep their original endpoints; deposits, loans and
 * accounts use the generalised Phase 3B endpoints.
 */
export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productType = 'card',
  productId,
  productName,
  productUrl,
}) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const baseCopy = getReviewsCopy(lang);
  // Product-neutral copy for the generalised types (the card strings
  // mention "this card"); cards keep their original wording.
  const copy =
    productType === 'card'
      ? baseCopy
      : {
          ...baseCopy,
          beFirstToReview: baseCopy.beFirstToReviewNamed.replace('{name}', productName),
          reviewBodyPlaceholder: baseCopy.reviewBodyPlaceholderNamed.replace('{name}', productName),
        };

  const [summary, setSummary] = useState<ProductReviewSummaryResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ownReview, setOwnReview] = useState<ProductReview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOwn, setEditingOwn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const getAccessToken = useCallback(async () => {
    try {
      return await authClient.getAccessToken();
    } catch {
      return null;
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      if (productType === 'card') {
        const data = await reviewsService.getSummary(productId);
        setSummary({
          product_type: 'card',
          product: data.card,
          average_rating: data.average_rating,
          review_count: data.review_count,
          approved_count: data.review_count,
          distribution: data.distribution,
          community_reviewed: data.review_count >= 50,
        });
      } else {
        setSummary(await reviewsService.getProductSummary(productType, productId));
      }
    } catch (err) {
      console.error('Failed to fetch review summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [productType, productId]);

  const fetchReviews = useCallback(
    async (page = 1) => {
      try {
        setIsLoadingReviews(true);
        setError(null);
        if (productType === 'card') {
          const data = await reviewsService.getReviews(productId, page);
          setReviews(data.results.map(reviewsService.transformReview));
          setTotalPages(Math.ceil(data.count / pageSize) || 1);
        } else {
          const data = await reviewsService.getProductReviews(productType, productId, page);
          setReviews(
            data.results.map(item => toListReview(reviewsService.transformProductReview(item)))
          );
          setTotalPages(Math.ceil(data.count / pageSize) || 1);
        }
      } catch (err) {
        setError(copy.networkError);
        console.error('Failed to fetch reviews:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    },
    [productType, productId, copy.networkError]
  );

  const fetchOwnReview = useCallback(async () => {
    if (!user) {
      setOwnReview(null);
      return;
    }
    const token = await getAccessToken();
    if (!token) return;
    try {
      setOwnReview(await reviewsService.getOwnProductReview(productType, productId, token));
    } catch (err) {
      console.error('Failed to fetch own review:', err);
    }
  }, [user, getAccessToken, productType, productId]);

  useEffect(() => {
    fetchSummary();
    fetchReviews(1);
  }, [fetchSummary, fetchReviews]);

  useEffect(() => {
    fetchOwnReview();
  }, [fetchOwnReview]);

  useEffect(() => {
    if (summary && summary.review_count > 0) {
      const jsonLd = aggregateRatingJsonLd({
        ratingValue: summary.average_rating ?? 0,
        reviewCount: summary.review_count,
      });
      if (jsonLd) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        script.setAttribute('data-review-aggregate', '');
        document.head.appendChild(script);
        return () => script.remove();
      }
    }
  }, [summary, productUrl]);

  const handleHelpfulClick = async (reviewId: number) => {
    if (!user) {
      setActionMessage(copy.loginToVote);
      return;
    }
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setFormError(copy.unauthorizedError);
      return;
    }

    try {
      const result =
        productType === 'card'
          ? await reviewsService.voteHelpful(reviewId, accessToken)
          : await reviewsService.voteProductHelpful(productType, reviewId, accessToken);
      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId
            ? {
                ...r,
                helpfulCount: result.helpful_count,
              }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to vote helpful:', err);
      setFormError(err instanceof Error ? err.message : copy.genericError);
    }
  };

  const handleWriteReview = () => {
    if (!user) {
      // The LoginPrompt will handle this
      return;
    }
    setShowForm(true);
    setFormError(null);
    setNeedsVerification(false);
    setSubmissionMessage(null);
  };

  const handleFormSubmit = async (data: {
    rating: number;
    title: string;
    body: string;
    pros: string;
    cons: string;
  }) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setFormError(copy.unauthorizedError);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      setNeedsVerification(false);

      if (editingOwn && ownReview) {
        await reviewsService.updateProductReview(productType, ownReview.id, data, accessToken);
        setSubmissionMessage(copy.reviewUpdated);
      } else if (productType === 'card') {
        await reviewsService.createReview({ ...data, card: productId }, accessToken);
        setSubmissionMessage(copy.reviewSubmitted);
      } else {
        await reviewsService.createProductReview(
          productType,
          { ...data, product: productId },
          accessToken
        );
        setSubmissionMessage(copy.reviewSubmitted);
      }

      setShowForm(false);
      setEditingOwn(false);
      fetchSummary();
      fetchReviews(currentPage);
      fetchOwnReview();
    } catch (err) {
      console.error('Failed to submit review:', err);
      if (err instanceof ApiError && err.code === 'email_not_verified') {
        setNeedsVerification(true);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError(copy.genericError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingOwn(false);
    setFormError(null);
    setNeedsVerification(false);
    setSubmissionMessage(null);
  };

  const handleEditOwnReview = () => {
    setEditingOwn(true);
    setShowForm(true);
    setFormError(null);
    setNeedsVerification(false);
    setSubmissionMessage(null);
  };

  const handleDeleteOwnReview = async () => {
    if (!ownReview) return;
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setFormError(copy.unauthorizedError);
      return;
    }
    try {
      await reviewsService.deleteProductReview(productType, ownReview.id, accessToken);
      setOwnReview(null);
      setActionMessage(copy.reviewDeleted);
      fetchSummary();
      fetchReviews(currentPage);
    } catch (err) {
      console.error('Failed to delete review:', err);
      setFormError(err instanceof Error ? err.message : copy.genericError);
    }
  };

  // JSON-LD for AggregateRating (handled in useEffect above)

  // The author's own review is held in its state card above; when it is
  // approved it also appears in the public list — don't show it twice.
  const visibleReviews = ownReview ? reviews.filter(review => review.id !== ownReview.id) : reviews;

  return (
    <section className="reviews-section" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">{copy.sectionTitle}</h2>

      {/* Summary */}
      <div className="reviews-summary-wrapper">
        {isLoadingSummary ? (
          <div className="reviews-loading" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p>{copy.loadingReviews}</p>
          </div>
        ) : (
          <ReviewSummaryCard
            summary={
              summary || {
                product_type: productType,
                product: productId,
                average_rating: null,
                review_count: 0,
                approved_count: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                community_reviewed: false,
              }
            }
            copy={copy}
            lang={lang}
          />
        )}
      </div>

      {/* The author's own review, held in place with its state */}
      {user && ownReview && !showForm && (
        <OwnReviewCard
          review={ownReview}
          copy={copy}
          onEdit={handleEditOwnReview}
          onDelete={handleDeleteOwnReview}
          commentsSlot={
            <ReviewComments
              productType={productType}
              reviewId={ownReview.id}
              copy={copy}
              isSignedIn={!!user}
              getAccessToken={getAccessToken}
              onLogin={() => navigate('/login', { state: { from: productUrl } })}
            />
          }
        />
      )}

      {/* Write Review Button / Login Prompt */}
      <div className="reviews-actions">
        {showForm ? (
          <ReviewForm
            initialData={editingOwn && ownReview ? ownReview : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            submitting={isSubmitting}
            copy={copy}
            isEditing={editingOwn}
          />
        ) : user ? (
          ownReview ? null : (
            <button type="button" className="btn btn-primary" onClick={handleWriteReview}>
              {copy.writeReview}
            </button>
          )
        ) : (
          <LoginPrompt
            copy={copy}
            onLogin={() => navigate('/login', { state: { from: productUrl } })}
          />
        )}
      </div>

      {actionMessage && (
        <div className="form-error-message" role="status" aria-live="polite">
          {actionMessage}{' '}
          {!user && (
            <button
              type="button"
              className="action-button"
              onClick={() => navigate('/login', { state: { from: productUrl } })}
            >
              {copy.loginLink}
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {formError && (
        <div className="form-error-message" role="alert">
          {formError}
        </div>
      )}
      {needsVerification && user && (
        <div className="form-error-message">
          <p role="alert">{copy.emailNotVerified}</p>
          <ResendVerification email={user.email} />
        </div>
      )}
      {submissionMessage && (
        <div className="pending-notice" role="status" aria-live="polite">
          {submissionMessage}
        </div>
      )}

      {/* Reviews List */}
      <div
        className="reviews-list"
        role={!isLoadingReviews && !error && reviews.length > 0 ? 'list' : undefined}
        aria-label={copy.customerReviews}
      >
        {isLoadingReviews ? (
          <div className="reviews-loading" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p>{copy.loadingReviews}</p>
          </div>
        ) : error ? (
          <div className="reviews-error" role="alert">
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <p>{copy.noReviewsYet}</p>
            {!ownReview && <p className="empty-hint">{copy.beFirstToReview}</p>}
          </div>
        ) : (
          <>
            {visibleReviews.map(review => (
              <ReviewItem
                key={review.id}
                review={review}
                copy={copy}
                onHelpfulClick={handleHelpfulClick}
                commentsSlot={
                  <ReviewComments
                    productType={productType}
                    reviewId={review.id}
                    copy={copy}
                    isSignedIn={!!user}
                    getAccessToken={getAccessToken}
                    onLogin={() => navigate('/login', { state: { from: productUrl } })}
                  />
                }
              />
            ))}
            {visibleReviews.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={summary?.review_count || 0}
                onPageChange={page => {
                  setCurrentPage(page);
                  fetchReviews(page);
                }}
                copy={copy}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
