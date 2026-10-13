import { getReviewsCopy, REVIEWS_COPY } from './reviews';

describe('reviews locale', () => {
  test('exports English copy', () => {
    const copy = getReviewsCopy('en');
    expect(copy.sectionTitle).toBe('Customer Reviews');
    expect(copy.writeReview).toBe('Write a Review');
    expect(copy.averageRating).toBe('Average Rating');
  });

  test('exports Bengali copy', () => {
    const copy = getReviewsCopy('bn');
    expect(copy.sectionTitle).toBe('গ্রাহক রিভিউ');
    expect(copy.writeReview).toBe('রিভিউ লিখুন');
    expect(copy.averageRating).toBe('গড় রেটিং');
  });

  test('has all required keys in both languages', () => {
    const enKeys = Object.keys(REVIEWS_COPY.en);
    const bnKeys = Object.keys(REVIEWS_COPY.bn);

    expect(enKeys.sort()).toEqual(bnKeys.sort());
    expect(enKeys.length).toBeGreaterThan(30);
  });

  test('basedOnReviews includes a count placeholder', () => {
    expect(REVIEWS_COPY.en.basedOnReviews).toContain('{count}');
    expect(REVIEWS_COPY.bn.basedOnReviews).toContain('{count}');
  });

  test('charCounter includes current and max placeholders', () => {
    expect(REVIEWS_COPY.en.charCounter).toContain('{current}');
    expect(REVIEWS_COPY.en.charCounter).toContain('{max}');
    expect(REVIEWS_COPY.bn.charCounter).toContain('{current}');
    expect(REVIEWS_COPY.bn.charCounter).toContain('{max}');
  });

  test('minLengthError and maxLengthError include min/max placeholders', () => {
    expect(REVIEWS_COPY.en.minLengthError).toContain('{min}');
    expect(REVIEWS_COPY.en.maxLengthError).toContain('{max}');
    expect(REVIEWS_COPY.bn.minLengthError).toContain('{min}');
    expect(REVIEWS_COPY.bn.maxLengthError).toContain('{max}');
  });

  test('pageOf includes current and total placeholders', () => {
    expect(REVIEWS_COPY.en.pageOf).toContain('{current}');
    expect(REVIEWS_COPY.en.pageOf).toContain('{total}');
    expect(REVIEWS_COPY.bn.pageOf).toContain('{current}');
    expect(REVIEWS_COPY.bn.pageOf).toContain('{total}');
  });

  test('helpfulCount includes count placeholder', () => {
    expect(REVIEWS_COPY.en.helpfulCount).toContain('{count}');
    expect(REVIEWS_COPY.bn.helpfulCount).toContain('{count}');
  });

  test('postedOn includes date placeholder', () => {
    expect(REVIEWS_COPY.en.postedOn).toContain('{date}');
    expect(REVIEWS_COPY.bn.postedOn).toContain('{date}');
  });
});
