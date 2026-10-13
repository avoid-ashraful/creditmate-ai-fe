import { rest } from 'msw';

const apiUrl = (path: string) => `*/api/v1/${path}`;

export const testBanks = [
  {
    id: 1,
    name: 'Test Bank',
    logo: '/test-logo.png',
    website: 'https://test.com',
    is_active: true,
    credit_card_count: 2,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Other Bank',
    logo: '/other-logo.png',
    website: 'https://other.test',
    is_active: true,
    credit_card_count: 1,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
];

// Matches the actual Django CreditCardListSerializer list response:
// bank_name string (no nested bank object, no bank_id), decimal strings,
// lounge counts as strings.
export const testCards = [
  {
    id: 1,
    bank_name: 'Test Bank',
    name: 'Test Credit Card',
    annual_fee: '1000.00',
    interest_rate_apr: '20.00',
    lounge_access_international: '2',
    lounge_access_domestic: '4',
    has_lounge_access: true,
    has_annual_fee: true,
    is_active: true,
  },
  {
    id: 2,
    bank_name: 'Other Bank',
    name: 'Other Rewards Card',
    annual_fee: '0.00',
    interest_rate_apr: '18.50',
    lounge_access_international: '0',
    lounge_access_domestic: '0',
    has_lounge_access: false,
    has_annual_fee: false,
    is_active: true,
  },
];

export const testReviews = [
  {
    id: 1,
    card: 1,
    rating: 5,
    title: 'Useful travel benefits',
    body: 'The lounge access is useful on longer trips.',
    pros: 'Travel benefits',
    cons: 'Annual fee',
    reviewer_name: 'Community member',
    helpful_count: 2,
    created: '2025-01-15T10:00:00Z',
    modified: '2025-01-15T10:00:00Z',
  },
];

const testOwnedReview = {
  ...testReviews[0],
  id: 2,
  title: 'My review',
};
const testReviewVotes = new Set<string>();

const paginated = <T>(results: T[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

export const handlers = [
  // GET/POST /reviews/ (public approved list; authenticated submissions are pending)
  rest.get(apiUrl('reviews/'), (req, res, ctx) => {
    const card = req.url.searchParams.get('card');
    const reviews = testReviews.filter(review => !card || String(review.card) === card);
    return res(ctx.status(200), ctx.json(paginated(reviews)));
  }),
  rest.post(apiUrl('reviews/'), async (req, res, ctx) => {
    const body = (await req.json()) as Record<string, unknown>;
    const now = new Date().toISOString();
    return res(
      ctx.status(201),
      ctx.json({
        id: 2,
        card: body.card,
        rating: body.rating,
        title: body.title,
        body: body.body,
        pros: body.pros || '',
        cons: body.cons || '',
        reviewer_name: 'Community member',
        helpful_count: 0,
        created: now,
        modified: now,
      })
    );
  }),
  // Authenticated own-review detail and modifications.
  rest.get('*/api/v1/reviews/mine/:reviewId/', (req, res, ctx) => {
    return Number(req.params.reviewId) === testOwnedReview.id
      ? res(ctx.status(200), ctx.json(testOwnedReview))
      : res(ctx.status(404), ctx.json({ detail: 'Not found.' }));
  }),
  rest.patch('*/api/v1/reviews/mine/:reviewId/', async (req, res, ctx) => {
    if (Number(req.params.reviewId) !== testOwnedReview.id) {
      return res(ctx.status(404), ctx.json({ detail: 'Not found.' }));
    }
    Object.assign(testOwnedReview, await req.json());
    return res(ctx.status(200), ctx.json(testOwnedReview));
  }),
  rest.delete('*/api/v1/reviews/mine/:reviewId/', (req, res, ctx) => {
    return Number(req.params.reviewId) === testOwnedReview.id
      ? res(ctx.status(204))
      : res(ctx.status(404), ctx.json({ detail: 'Not found.' }));
  }),
  // GET /reviews/cards/{card_id}/summary/
  rest.get('*/api/v1/reviews/cards/:cardId/summary/', (req, res, ctx) => {
    const cardId = Number(req.params.cardId);
    const reviews = testReviews.filter(review => review.card === cardId);
    const counts = [1, 2, 3, 4, 5].map(
      rating => reviews.filter(review => review.rating === rating).length
    );
    const total = reviews.length;
    return res(
      ctx.status(200),
      ctx.json({
        card: cardId,
        average_rating: total
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
          : null,
        review_count: total,
        distribution: Object.fromEntries(counts.map((count, index) => [index + 1, count])),
      })
    );
  }),
  // POST /reviews/{review_id}/helpful/ (one-way vote)
  rest.post('*/api/v1/reviews/:reviewId/helpful/', (req, res, ctx) => {
    const review = testReviews.find(item => item.id === Number(req.params.reviewId));
    if (!review) return res(ctx.status(404), ctx.json({ detail: 'Not found.' }));
    const token = req.headers.get('authorization') || 'anonymous';
    const voteKey = `${token}:${review.id}`;
    const created = !testReviewVotes.has(voteKey);
    testReviewVotes.add(voteKey);
    return res(
      ctx.status(created ? 201 : 200),
      ctx.json({ helpful_count: review.helpful_count + 1 })
    );
  }),
  // GET /banks/
  rest.get(apiUrl('banks/'), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(paginated(testBanks)));
  }),

  // GET /credit-cards/ with search / bank-name filtering
  rest.get(apiUrl('credit-cards/'), (req, res, ctx) => {
    const search = req.url.searchParams.get('search');
    const ids = req.url.searchParams.get('ids')?.split(',').map(Number);
    const bankName = req.url.searchParams.get('bank_name');
    const bank = req.url.searchParams.get('bank');
    const bankIds = req.url.searchParams.get('bank_ids')?.split(',').map(Number) || [];
    const hasLoungeAccess = req.url.searchParams.get('has_lounge_access');

    let cards = testCards;
    if (ids) {
      cards = cards.filter(card => ids.includes(card.id));
    }
    if (search) {
      const normalizedSearch = search.toLowerCase();
      cards = cards.filter(
        card =>
          card.name.toLowerCase().includes(normalizedSearch) ||
          card.bank_name.toLowerCase().includes(normalizedSearch)
      );
    }
    if (bankName) {
      cards = cards.filter(card => card.bank_name.toLowerCase() === bankName.toLowerCase());
    }
    if (bank) {
      const bankId = Number(bank);
      cards = cards.filter(card =>
        testBanks.some(b => b.id === bankId && b.name === card.bank_name)
      );
    }
    if (bankIds.length > 0) {
      cards = cards.filter(card =>
        bankIds.some(bankId => testBanks.some(b => b.id === bankId && b.name === card.bank_name))
      );
    }
    if (hasLoungeAccess !== null) {
      const loungeAccessValue = hasLoungeAccess === 'true';
      cards = cards.filter(card => card.has_lounge_access === loungeAccessValue);
    }

    return res(ctx.status(200), ctx.json(paginated(cards)));
  }),

  // GET /credit-cards/search-suggestions/
  rest.get(apiUrl('credit-cards/search-suggestions/'), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        annual_fee_ranges: [
          { label: 'Free', filter: 'annual_fee=0' },
          { label: 'Low (1-1000)', filter: 'annual_fee_min=1&annual_fee_max=1000' },
          { label: 'Medium (1001-3000)', filter: 'annual_fee_min=1001&annual_fee_max=3000' },
          { label: 'Premium (3000+)', filter: 'annual_fee_min=3000' },
        ],
        benefits: [
          { label: 'International Lounge Access', filter: 'has_international_lounge=true' },
          { label: 'Domestic Lounge Access', filter: 'has_domestic_lounge=true' },
          { label: 'No Annual Fee', filter: 'no_annual_fee=true' },
          { label: 'Fee Waiver Available', filter: 'has_fee_waiver=true' },
        ],
        popular_banks: ['Test Bank'],
      })
    );
  }),

  // GET /api/v1/credit-cards/typeahead/?q=...
  rest.get('*/api/v1/credit-cards/typeahead/', (req, res, ctx) => {
    const q = (req.url.searchParams.get('q') || '').trim().toLowerCase();

    // Cards – filter by name or bank_name
    const filteredCards = testCards.filter(
      c => c.name.toLowerCase().includes(q) || c.bank_name.toLowerCase().includes(q)
    );
    const cards = filteredCards.slice(0, 5).map(c => ({
      id: c.id,
      name: c.name,
      bank_name: c.bank_name,
    }));

    // Banks – filter by name
    const filteredBanks = testBanks.filter(b => b.name.toLowerCase().includes(q));
    const banks = filteredBanks.slice(0, 5).map(b => ({
      id: b.id,
      name: b.name,
      credit_card_count: b.credit_card_count,
    }));

    // Categories – static set derived from the CATEGORIES config
    const categorySet = [
      { slug: 'travel', name: 'Travel', count: 0 },
      { slug: 'cashback', name: 'Cashback', count: 0 },
      { slug: 'premium', name: 'Premium', count: 0 },
      { slug: 'student', name: 'Student', count: 0 },
      { slug: 'business', name: 'Business', count: 0 },
      { slug: 'no-annual-fee', name: 'No Annual Fee', count: 1 },
    ]
      .filter(c => c.name.toLowerCase().includes(q) || c.slug.includes(q))
      .slice(0, 5);

    // Flat suggestions array (backend canonical shape)
    const suggestionsList = [
      ...cards.map(c => ({
        type: 'card' as const,
        id: c.id,
        label: c.name,
        detail: c.bank_name,
      })),
      ...banks.map(b => ({
        type: 'bank' as const,
        id: b.id,
        label: b.name,
      })),
      ...categorySet.map(c => ({
        type: 'category' as const,
        slug: c.slug,
        label: c.name,
      })),
    ];

    // Facets – static per‑category counts for the query
    const facets = categorySet.map(c => ({
      slug: c.slug,
      label: c.name,
      count: c.count,
    }));

    // "Did you mean" – correct a common typo
    const didYouMean = q === 'viza' ? 'visa' : null;

    return res(
      ctx.status(200),
      ctx.json({
        suggestions: suggestionsList,
        facets,
        didYouMean,
      })
    );
  }),
];
