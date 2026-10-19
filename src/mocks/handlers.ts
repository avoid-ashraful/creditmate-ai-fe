import { rest } from 'msw';

const apiUrl = (path: string) => `*/api/v1/${path}`;
const authUrl = (path: string) => `*/api/v1/auth/${path}`;

export const testBanks = [
  {
    id: 1,
    name: 'Test Bank',
    logo: '/test-logo.png',
    website: 'https://test.com',
    is_active: true,
    credit_card_count: 3,
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
// lounge counts as strings. Includes the structured reward fields: the four
// cards cover the archetypes (points with a stated value, points without a
// stated value, cashback with a cap, no rewards at all).
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
    source_url: 'https://test.com/schedule-of-charges',
    apply_url: 'https://test.com/apply',
    verification_status: 'verified',
    verified_at: '2025-05-01T00:00:00Z',
    card_network: 'visa',
    is_islamic: false,
    is_dual_currency: true,
    min_monthly_income: '50000.00',
    supplementary_card_fee: 'BDT 500',
    foreign_transaction_fee: '3%',
    reward_program_name: 'Test Points',
    reward_earn_rules: [
      {
        category: 'all',
        points_per_unit: 1,
        spend_unit_bdt: 50,
        text: 'Earn 1 point for every BDT 50 spent.',
      },
    ],
    cashback_rules: [],
    // The bank states this redemption value; only then may points be converted.
    reward_point_value_bdt: '1.0000',
    points_expiry_text: '',
    reward_source_url: 'https://test.com/reward-terms',
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
    source_url: '',
    apply_url: '',
    verification_status: 'verified',
    verified_at: null,
    card_network: '',
    is_islamic: true,
    is_dual_currency: null,
    min_monthly_income: null,
    supplementary_card_fee: '',
    foreign_transaction_fee: '',
    reward_program_name: 'Shariah Points',
    reward_earn_rules: [
      {
        category: 'all',
        points_per_unit: 2,
        spend_unit_bdt: 100,
        text: 'Earn 2 points for every BDT 100 spent.',
      },
    ],
    cashback_rules: [],
    // No bank-stated redemption value: estimated points only, never a BDT figure.
    reward_point_value_bdt: null,
    points_expiry_text: '',
    reward_source_url: 'https://other.test/reward-terms',
  },
  {
    id: 3,
    bank_name: 'Test Bank',
    name: 'Dining Cashback Card',
    annual_fee: '800.00',
    interest_rate_apr: '19.00',
    lounge_access_international: '0',
    lounge_access_domestic: '0',
    has_lounge_access: false,
    has_annual_fee: true,
    is_active: true,
    source_url: 'https://test.com/cashback-terms',
    apply_url: '',
    verification_status: 'verified',
    verified_at: '2025-05-01T00:00:00Z',
    card_network: 'mastercard',
    is_islamic: false,
    is_dual_currency: false,
    min_monthly_income: null,
    supplementary_card_fee: '',
    foreign_transaction_fee: '',
    reward_program_name: '',
    reward_earn_rules: [],
    cashback_rules: [
      {
        category: 'dining',
        percent: 5,
        cap_text: 'up to BDT 300 monthly',
        text: '5% cashback up to BDT 300 monthly at participating restaurants.',
      },
    ],
    reward_point_value_bdt: null,
    points_expiry_text: '',
    reward_source_url: 'https://test.com/cashback-terms',
  },
  {
    id: 4,
    bank_name: 'Test Bank',
    name: 'No Rewards Card',
    annual_fee: '500.00',
    interest_rate_apr: '21.00',
    lounge_access_international: '0',
    lounge_access_domestic: '0',
    has_lounge_access: false,
    has_annual_fee: true,
    is_active: true,
    source_url: 'https://test.com/schedule-of-charges',
    apply_url: '',
    verification_status: 'verified',
    verified_at: '2025-05-01T00:00:00Z',
    card_network: 'visa',
    is_islamic: false,
    is_dual_currency: false,
    min_monthly_income: null,
    supplementary_card_fee: '',
    foreign_transaction_fee: '',
    reward_program_name: '',
    reward_earn_rules: [],
    cashback_rules: [],
    reward_point_value_bdt: null,
    points_expiry_text: '',
    reward_source_url: 'https://test.com/reward-terms',
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

// Mirrors the BE CardDetailFilterSet: card_network (comma-separated), is_islamic,
// is_dual_currency, max_min_monthly_income (+ include_unknown_income).
const filterByCardDetails = (cards: typeof testCards, params: URLSearchParams) => {
  const networks = params.get('card_network')?.toLowerCase().split(',').filter(Boolean);
  const isIslamic = params.get('is_islamic');
  const isDualCurrency = params.get('is_dual_currency');
  const maxIncome = params.get('max_min_monthly_income');
  const includeUnknown = params.get('include_unknown_income') === 'true';

  return cards.filter(card => {
    if (networks && !networks.includes(card.card_network)) return false;
    if (isIslamic !== null && card.is_islamic !== (isIslamic === 'true')) return false;
    if (isDualCurrency !== null && card.is_dual_currency !== (isDualCurrency === 'true')) {
      return false;
    }
    if (maxIncome !== null) {
      if (card.min_monthly_income === null) return includeUnknown;
      return parseFloat(card.min_monthly_income) <= parseFloat(maxIncome);
    }
    return true;
  });
};

let storedRefreshToken = 'refresh-1';
let storedAccessToken = 'access-1';

interface ResetConfirmBody {
  uid?: string;
  token?: string;
  new_password?: string;
  new_password_confirm?: string;
}

interface VerifyEmailBody {
  token?: string;
}

interface MePatchBody {
  first_name?: string;
  last_name?: string;
  profile?: {
    email_opt_in?: boolean;
    marketing_opt_in?: boolean;
    preferences?: Record<string, unknown>;
  };
}

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
  // POST /credit-cards/{id}/report-issue/ (201; 404 for unknown cards; message required)
  rest.post('*/api/v1/credit-cards/:cardId/report-issue/', async (req, res, ctx) => {
    if (!testCards.some(card => card.id === Number(req.params.cardId))) {
      return res(ctx.status(404), ctx.json({ detail: 'Not found.' }));
    }
    const body = (await req.json()) as { message?: string };
    if (!body.message) {
      return res(ctx.status(400), ctx.json({ message: ['This field is required.'] }));
    }
    return res(ctx.status(201), ctx.json({ id: 1, status: 'pending' }));
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

    let cards = filterByCardDetails(testCards, req.url.searchParams);
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

  // GET /api/v1/credit-cards/advanced-search/
  rest.get('*/api/v1/credit-cards/advanced-search/', (req, res, ctx) => {
    const search = req.url.searchParams.get('search');
    const categories = req.url.searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const annualFeeMin = req.url.searchParams.get('annual_fee_min');
    const annualFeeMax = req.url.searchParams.get('annual_fee_max');
    const interestRateMin = req.url.searchParams.get('interest_rate_min');
    const interestRateMax = req.url.searchParams.get('interest_rate_max');
    const hasLoungeAccess = req.url.searchParams.get('has_lounge_access');
    const hasInternationalLounge = req.url.searchParams.get('has_international_lounge');
    const hasDomesticLounge = req.url.searchParams.get('has_domestic_lounge');
    const hasAnnualFee = req.url.searchParams.get('has_annual_fee');
    const noAnnualFee = req.url.searchParams.get('no_annual_fee');
    const hasFeeWaiver = req.url.searchParams.get('has_fee_waiver');
    const featureSearch = req.url.searchParams.get('feature_search');
    const bankIds = req.url.searchParams.get('bank_ids')?.split(',').map(Number) || [];
    const ordering = req.url.searchParams.get('ordering') || 'relevance';
    const page = parseInt(req.url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(req.url.searchParams.get('page_size') || '20', 10);
    const facets = req.url.searchParams.get('facets')?.split(',') || [];

    let cards = filterByCardDetails(testCards, req.url.searchParams);

    if (search) {
      const normalizedSearch = search.toLowerCase();
      cards = cards.filter(
        card =>
          card.name.toLowerCase().includes(normalizedSearch) ||
          card.bank_name.toLowerCase().includes(normalizedSearch)
      );
    }
    if (categories.length > 0) {
      // For testing, we don't have category mapping - just filter by search term
      cards = cards.filter(card =>
        categories.some(cat => card.name.toLowerCase().includes(cat.toLowerCase()))
      );
    }
    if (annualFeeMin) {
      cards = cards.filter(
        card => (card.annual_fee ? parseFloat(card.annual_fee) : 0) >= parseFloat(annualFeeMin)
      );
    }
    if (annualFeeMax) {
      cards = cards.filter(
        card =>
          (card.annual_fee ? parseFloat(card.annual_fee) : Infinity) <= parseFloat(annualFeeMax)
      );
    }
    if (interestRateMin) {
      cards = cards.filter(
        card =>
          (card.interest_rate_apr ? parseFloat(card.interest_rate_apr) : 0) >=
          parseFloat(interestRateMin)
      );
    }
    if (interestRateMax) {
      cards = cards.filter(
        card =>
          (card.interest_rate_apr ? parseFloat(card.interest_rate_apr) : Infinity) <=
          parseFloat(interestRateMax)
      );
    }
    if (hasLoungeAccess !== null) {
      cards = cards.filter(card => card.has_lounge_access === (hasLoungeAccess === 'true'));
    }
    if (hasInternationalLounge !== null) {
      cards = cards.filter(
        card => card.lounge_access_international && parseInt(card.lounge_access_international) > 0
      );
    }
    if (hasDomesticLounge !== null) {
      cards = cards.filter(
        card => card.lounge_access_domestic && parseInt(card.lounge_access_domestic) > 0
      );
    }
    if (hasAnnualFee !== null) {
      cards = cards.filter(card => card.has_annual_fee === (hasAnnualFee === 'true'));
    }
    if (noAnnualFee !== null) {
      cards = cards.filter(card => card.has_annual_fee === (noAnnualFee === 'false'));
    }
    if (hasFeeWaiver !== null) {
      // Mock: no fee waiver field in test data
      cards = cards.filter(card => card.annual_fee === '0.00');
    }
    if (featureSearch) {
      const normalizedFeature = featureSearch.toLowerCase();
      cards = cards.filter(card => card.name.toLowerCase().includes(normalizedFeature));
    }
    if (bankIds.length > 0) {
      cards = cards.filter(card =>
        bankIds.some(bankId => testBanks.some(b => b.id === bankId && b.name === card.bank_name))
      );
    }

    // Sorting
    if (ordering.startsWith('-')) {
      const key = ordering.slice(1);
      cards.sort((a, b) => {
        const aVal = a[key as keyof typeof a];
        const bVal = b[key as keyof typeof b];
        if (typeof aVal === 'string' && typeof bVal === 'string') return bVal.localeCompare(aVal);
        if (typeof aVal === 'number' && typeof bVal === 'number') return bVal - aVal;
        return 0;
      });
    } else {
      cards.sort((a, b) => {
        const aVal = a[ordering as keyof typeof a];
        const bVal = b[ordering as keyof typeof b];
        if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal);
        if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
        return 0;
      });
    }

    const total = cards.length;
    const start = (page - 1) * pageSize;
    const paginatedCards = cards.slice(start, start + pageSize);

    // Build facets based on what was requested
    const facetData: Record<string, unknown> = {};

    if (facets.includes('category')) {
      facetData.category = {
        label: 'Category',
        type: 'category',
        buckets: [
          {
            key: 'travel',
            label: 'Travel',
            count: cards.filter(c => c.name.toLowerCase().includes('travel')).length,
            filter: 'categories=travel',
          },
          {
            key: 'cashback',
            label: 'Cashback',
            count: cards.filter(c => c.name.toLowerCase().includes('cashback')).length,
            filter: 'categories=cashback',
          },
          {
            key: 'premium',
            label: 'Premium',
            count: cards.filter(c => c.name.toLowerCase().includes('premium')).length,
            filter: 'categories=premium',
          },
          {
            key: 'student',
            label: 'Student',
            count: cards.filter(c => c.name.toLowerCase().includes('student')).length,
            filter: 'categories=student',
          },
          {
            key: 'business',
            label: 'Business',
            count: cards.filter(c => c.name.toLowerCase().includes('business')).length,
            filter: 'categories=business',
          },
          {
            key: 'no-annual-fee',
            label: 'No Annual Fee',
            count: cards.filter(c => c.annual_fee === '0.00').length,
            filter: 'categories=no-annual-fee',
          },
        ],
      };
    }
    if (facets.includes('bank')) {
      facetData.bank = {
        label: 'Bank',
        type: 'terms',
        buckets: testBanks.map(b => ({
          key: b.name,
          label: b.name,
          count: cards.filter(c => c.bank_name === b.name).length,
        })),
      };
    }
    if (facets.includes('annual_fee_range')) {
      const free = cards.filter(c => c.annual_fee === '0.00').length;
      const low = cards.filter(
        c => c.annual_fee !== '0.00' && parseFloat(c.annual_fee) <= 1000
      ).length;
      const medium = cards.filter(
        c => parseFloat(c.annual_fee) > 1000 && parseFloat(c.annual_fee) <= 3000
      ).length;
      const high = cards.filter(c => parseFloat(c.annual_fee) > 3000).length;
      facetData.annual_fee_range = {
        label: 'Annual Fee Range',
        type: 'range',
        buckets: [
          { key: 'free', label: 'Free', count: free },
          { key: 'low', label: 'Low (1-1000)', from: 1, to: 1000, count: low },
          { key: 'medium', label: 'Medium (1001-3000)', from: 1001, to: 3000, count: medium },
          { key: 'high', label: 'High (3000+)', from: 3000, count: high },
        ],
      };
    }
    if (facets.includes('interest_rate_range')) {
      const lowApr = cards.filter(c => parseFloat(c.interest_rate_apr) <= 15).length;
      const medApr = cards.filter(
        c => parseFloat(c.interest_rate_apr) > 15 && parseFloat(c.interest_rate_apr) <= 25
      ).length;
      const highApr = cards.filter(c => parseFloat(c.interest_rate_apr) > 25).length;
      facetData.interest_rate_range = {
        label: 'APR Range',
        type: 'range',
        buckets: [
          { key: 'low', label: 'Low (0-15%)', from: 0, to: 15, count: lowApr },
          { key: 'medium', label: 'Medium (15-25%)', from: 15, to: 25, count: medApr },
          { key: 'high', label: 'High (25%+)', from: 25, count: highApr },
        ],
      };
    }
    if (facets.includes('lounge_access')) {
      const intl = cards.filter(
        c => c.lounge_access_international && parseInt(c.lounge_access_international) > 0
      ).length;
      const dom = cards.filter(
        c => c.lounge_access_domestic && parseInt(c.lounge_access_domestic) > 0
      ).length;
      const any = cards.filter(c => c.has_lounge_access).length;
      facetData.lounge_access = {
        label: 'Lounge Access',
        type: 'boolean',
        buckets: [
          {
            key: 'international',
            label: 'International',
            count: intl,
            true_count: intl,
            false_count: total - intl,
          },
          {
            key: 'domestic',
            label: 'Domestic',
            count: dom,
            true_count: dom,
            false_count: total - dom,
          },
          { key: 'any', label: 'Any', count: any, true_count: any, false_count: total - any },
        ],
      };
    }
    if (facets.includes('fee_waiver')) {
      const waiver = cards.filter(c => c.annual_fee === '0.00').length;
      facetData.fee_waiver = {
        label: 'Fee Waiver',
        type: 'boolean',
        buckets: [
          { key: 'true', label: 'Available', count: waiver },
          { key: 'false', label: 'Not Available', count: total - waiver },
        ],
      };
    }
    if (facets.includes('has_annual_fee')) {
      const hasFee = cards.filter(c => c.has_annual_fee).length;
      facetData.has_annual_fee = {
        label: 'Has Annual Fee',
        type: 'boolean',
        buckets: [
          { key: 'true', label: 'Yes', count: hasFee },
          { key: 'false', label: 'No', count: total - hasFee },
        ],
      };
    }
    if (facets.includes('card_network')) {
      const counts = new Map<string, number>();
      cards.forEach(c => counts.set(c.card_network, (counts.get(c.card_network) ?? 0) + 1));
      facetData.card_network = {
        label: 'Card Network',
        type: 'terms',
        buckets: Array.from(counts).map(([key, count]) => ({ key: key || 'Unknown', count })),
      };
    }
    (['is_islamic', 'is_dual_currency'] as const).forEach(name => {
      if (!facets.includes(name)) return;
      const yes = cards.filter(c => c[name] === true).length;
      const no = cards.filter(c => c[name] === false).length;
      facetData[name] = {
        label: name === 'is_islamic' ? 'Islamic' : 'Dual Currency',
        type: 'boolean',
        buckets: [
          { key: 'true', label: 'Yes', count: yes },
          { key: 'false', label: 'No', count: no },
        ],
      };
    });

    return res(
      ctx.status(200),
      ctx.json({
        query: search || '',
        total,
        page,
        page_size: pageSize,
        results: paginatedCards,
        facets: facetData,
        took: 5,
        source: 'database',
        sort_options: [
          { key: 'relevance', label: 'Relevance', description: 'Best match first' },
          {
            key: 'annual_fee',
            label: 'Annual Fee (Low to High)',
            description: 'Sort by annual fee ascending',
          },
          {
            key: '-annual_fee',
            label: 'Annual Fee (High to Low)',
            description: 'Sort by annual fee descending',
          },
          {
            key: 'interest_rate_apr',
            label: 'APR (Low to High)',
            description: 'Sort by interest rate ascending',
          },
          {
            key: '-interest_rate_apr',
            label: 'APR (High to Low)',
            description: 'Sort by interest rate descending',
          },
          { key: 'name', label: 'Name (A-Z)', description: 'Sort by card name ascending' },
          { key: '-name', label: 'Name (Z-A)', description: 'Sort by card name descending' },
          {
            key: '-created',
            label: 'Newest First',
            description: 'Sort by creation date descending',
          },
        ],
        categories: [
          { slug: 'travel', name: 'Travel' },
          { slug: 'cashback', name: 'Cashback' },
          { slug: 'premium', name: 'Premium' },
          { slug: 'student', name: 'Student' },
          { slug: 'business', name: 'Business' },
          { slug: 'no-annual-fee', name: 'No Annual Fee' },
        ],
        normalized_query: {
          search,
          categories: categories.join(','),
          annual_fee_min: annualFeeMin ?? undefined,
          annual_fee_max: annualFeeMax ?? undefined,
          interest_rate_min: interestRateMin ?? undefined,
          interest_rate_max: interestRateMax ?? undefined,
          has_lounge_access: hasLoungeAccess ?? undefined,
          has_international_lounge: hasInternationalLounge ?? undefined,
          has_domestic_lounge: hasDomesticLounge ?? undefined,
          has_annual_fee: hasAnnualFee ?? undefined,
          no_annual_fee: noAnnualFee ?? undefined,
          has_fee_waiver: hasFeeWaiver ?? undefined,
          feature_search: featureSearch ?? undefined,
          bank_ids: bankIds.length > 0 ? bankIds.join(',') : undefined,
          ordering,
          page: page.toString(),
          page_size: pageSize.toString(),
          facets: facets.join(','),
        },
      })
    );
  }),

  // GET /api/v1/credit-cards/advanced-search/sort-options/
  rest.get('*/api/v1/credit-cards/advanced-search/sort-options/', (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        sort_options: [
          { key: 'relevance', label: 'Relevance', description: 'Best match first' },
          {
            key: 'annual_fee',
            label: 'Annual Fee (Low to High)',
            description: 'Sort by annual fee ascending',
          },
          {
            key: '-annual_fee',
            label: 'Annual Fee (High to Low)',
            description: 'Sort by annual fee descending',
          },
          {
            key: 'interest_rate_apr',
            label: 'APR (Low to High)',
            description: 'Sort by interest rate ascending',
          },
          {
            key: '-interest_rate_apr',
            label: 'APR (High to Low)',
            description: 'Sort by interest rate descending',
          },
          { key: 'name', label: 'Name (A-Z)', description: 'Sort by card name ascending' },
          { key: '-name', label: 'Name (Z-A)', description: 'Sort by card name descending' },
          {
            key: '-created',
            label: 'Newest First',
            description: 'Sort by creation date descending',
          },
        ],
      })
    );
  }),

  // GET /api/v1/credit-cards/advanced-search/categories/
  rest.get('*/api/v1/credit-cards/advanced-search/categories/', (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        categories: [
          { slug: 'travel', name: 'Travel' },
          { slug: 'cashback', name: 'Cashback' },
          { slug: 'premium', name: 'Premium' },
          { slug: 'student', name: 'Student' },
          { slug: 'business', name: 'Business' },
          { slug: 'no-annual-fee', name: 'No Annual Fee' },
        ],
      })
    );
  }),

  // GET /api/v1/credit-cards/advanced-search/normalize/
  rest.get('*/api/v1/credit-cards/advanced-search/normalize/', (req, res, ctx) => {
    const search = req.url.searchParams.get('search');
    const categories = req.url.searchParams.get('categories');
    const annualFeeMin = req.url.searchParams.get('annual_fee_min');
    const annualFeeMax = req.url.searchParams.get('annual_fee_max');
    const interestRateMin = req.url.searchParams.get('interest_rate_min');
    const interestRateMax = req.url.searchParams.get('interest_rate_max');
    const hasLoungeAccess = req.url.searchParams.get('has_lounge_access');
    const hasInternationalLounge = req.url.searchParams.get('has_international_lounge');
    const hasDomesticLounge = req.url.searchParams.get('has_domestic_lounge');
    const hasAnnualFee = req.url.searchParams.get('has_annual_fee');
    const noAnnualFee = req.url.searchParams.get('no_annual_fee');
    const hasFeeWaiver = req.url.searchParams.get('has_fee_waiver');
    const featureSearch = req.url.searchParams.get('feature_search');
    const bankIds = req.url.searchParams.get('bank_ids');
    const ordering = req.url.searchParams.get('ordering');
    const page = req.url.searchParams.get('page');
    const pageSize = req.url.searchParams.get('page_size');
    const facets = req.url.searchParams.get('facets');

    const normalizedQuery: Record<string, string> = {};
    if (search) normalizedQuery.search = search;
    if (categories) normalizedQuery.categories = categories;
    if (annualFeeMin) normalizedQuery.annual_fee_min = annualFeeMin;
    if (annualFeeMax) normalizedQuery.annual_fee_max = annualFeeMax;
    if (interestRateMin) normalizedQuery.interest_rate_min = interestRateMin;
    if (interestRateMax) normalizedQuery.interest_rate_max = interestRateMax;
    if (hasLoungeAccess) normalizedQuery.has_lounge_access = hasLoungeAccess;
    if (hasInternationalLounge) normalizedQuery.has_international_lounge = hasInternationalLounge;
    if (hasDomesticLounge) normalizedQuery.has_domestic_lounge = hasDomesticLounge;
    if (hasAnnualFee) normalizedQuery.has_annual_fee = hasAnnualFee;
    if (noAnnualFee) normalizedQuery.no_annual_fee = noAnnualFee;
    if (hasFeeWaiver) normalizedQuery.has_fee_waiver = hasFeeWaiver;
    if (featureSearch) normalizedQuery.feature_search = featureSearch;
    if (bankIds) normalizedQuery.bank_ids = bankIds;
    if (ordering) normalizedQuery.ordering = ordering;
    if (page) normalizedQuery.page = page;
    if (pageSize) normalizedQuery.page_size = pageSize;
    if (facets) normalizedQuery.facets = facets;

    const canonicalParts: string[] = [];
    Object.entries(normalizedQuery).forEach(([k, v]) => {
      canonicalParts.push(`${k}=${v}`);
    });
    const canonicalString = canonicalParts.join('&');
    const queryHash = btoa(canonicalString).slice(0, 16);

    return res(
      ctx.status(200),
      ctx.json({
        normalized_query: normalizedQuery,
        query_hash: queryHash,
        canonical_string: canonicalString,
      })
    );
  }),

  // Auth endpoints
  // POST /auth/register/
  rest.post(authUrl('register/'), async (req, res, ctx) => {
    const body = (await req.json()) as Record<string, unknown>;
    // Basic validation
    if (!body.email || !body.password) {
      return res(ctx.status(400), ctx.json({ email: ['This field is required.'] }));
    }
    if (body.password !== body.password_confirm) {
      return res(ctx.status(400), ctx.json({ password_confirm: ['Passwords do not match.'] }));
    }
    if (body.accept_terms !== true) {
      return res(
        ctx.status(400),
        ctx.json({ accept_terms: ['You must accept the terms and privacy notice to register.'] })
      );
    }
    return res(
      ctx.status(201),
      ctx.json({
        detail: 'Registration successful. Please check your email to verify your account.',
      })
    );
  }),

  // POST /auth/login/
  rest.post(authUrl('login/'), async (req, res, ctx) => {
    const body = (await req.json()) as Record<string, unknown>;
    if (body.email === 'reader@example.com' && body.password === 'pw-12345') {
      return res(
        ctx.status(200),
        ctx.json({
          access: storedAccessToken,
          refresh: storedRefreshToken,
          user: {
            id: 7,
            username: 'reader@example.com',
            email: 'reader@example.com',
            first_name: 'John',
            last_name: 'Doe',
            profile: {
              email_verified: true,
              email_opt_in: false,
              marketing_opt_in: false,
              terms_accepted_at: '2026-01-01T00:00:00Z',
              terms_version: '2026-01',
              preferences: {},
            },
          },
        })
      );
    }
    return res(
      ctx.status(401),
      ctx.json({ detail: 'No active account found with the given credentials' })
    );
  }),

  // POST /auth/logout/
  rest.post(authUrl('logout/'), async (req, res, ctx) => {
    const body = (await req.json()) as Record<string, unknown>;
    if (body.refresh === storedRefreshToken) {
      return res(ctx.status(200), ctx.json({ detail: 'Successfully logged out.' }));
    }
    return res(ctx.status(400), ctx.json({ detail: 'Invalid refresh token.' }));
  }),

  // POST /auth/token/refresh/
  rest.post(authUrl('token/refresh/'), async (req, res, ctx) => {
    const body = (await req.json()) as Record<string, unknown>;
    if (body.refresh === storedRefreshToken) {
      // Rotate the refresh token
      storedRefreshToken = 'refresh-' + Date.now();
      storedAccessToken = 'access-' + Date.now();
      return res(
        ctx.status(200),
        ctx.json({
          access: storedAccessToken,
          refresh: storedRefreshToken,
        })
      );
    }
    return res(ctx.status(400), ctx.json({ refresh: ['Token is invalid or expired'] }));
  }),

  // POST /auth/password-reset/
  rest.post(authUrl('password-reset/'), async (req, res, ctx) => {
    const body = (await req.json()) as Record<string, unknown>;
    if (!body.email) {
      return res(ctx.status(400), ctx.json({ email: ['Enter a valid email address.'] }));
    }
    return res(
      ctx.status(200),
      ctx.json({ detail: 'If an account exists, a password reset email has been sent.' })
    );
  }),

  // POST /auth/password-reset/confirm/
  rest.post(authUrl('password-reset/confirm/'), async (req, res, ctx) => {
    const body = (await req.json()) as ResetConfirmBody;
    if (!body.uid || !body.token) {
      return res(ctx.status(400), ctx.json({ token: ['Invalid or expired token.'] }));
    }
    if (body.new_password !== body.new_password_confirm) {
      return res(ctx.status(400), ctx.json({ new_password_confirm: ['Passwords do not match.'] }));
    }
    if (body.new_password && body.new_password.length < 8) {
      return res(ctx.status(400), ctx.json({ new_password: ['This password is too short.'] }));
    }
    return res(ctx.status(200), ctx.json({ detail: 'Password has been reset successfully.' }));
  }),

  // POST /auth/verify-email/
  rest.post(authUrl('verify-email/'), async (req, res, ctx) => {
    const body = (await req.json()) as VerifyEmailBody;
    if (!body.token) {
      return res(ctx.status(400), ctx.json({ token: ['Invalid verification link.'] }));
    }
    return res(ctx.status(200), ctx.json({ detail: 'Email verified successfully.' }));
  }),

  // POST /auth/resend-verification/ (always 200, generic message)
  rest.post(authUrl('resend-verification/'), async (req, res, ctx) => {
    const body = (await req.json()) as { email?: string };
    if (!body.email) {
      return res(ctx.status(400), ctx.json({ email: ['This field is required.'] }));
    }
    return res(
      ctx.status(200),
      ctx.json({ detail: 'If an unverified account exists, a verification email has been sent.' })
    );
  }),

  // DELETE /auth/me/ (password-confirmed account deletion)
  rest.delete(authUrl('me/'), async (req, res, ctx) => {
    if (!req.headers.get('authorization')?.startsWith('Bearer access-')) {
      return res(ctx.status(401), ctx.json({ detail: 'Given token not valid' }));
    }
    const body = (await req.json()) as { password?: string };
    if (body.password !== 'pw-12345') {
      return res(ctx.status(400), ctx.json({ password: ['Current password is incorrect.'] }));
    }
    return res(ctx.status(204));
  }),

  // GET /auth/me/export/
  rest.get(authUrl('me/export/'), (req, res, ctx) => {
    if (!req.headers.get('authorization')?.startsWith('Bearer access-')) {
      return res(ctx.status(401), ctx.json({ detail: 'Given token not valid' }));
    }
    return res(
      ctx.status(200),
      ctx.json({
        profile: { email: 'reader@example.com' },
        saved_comparisons: [],
        collections: [],
        alert_subscriptions: [],
        notification_preference: null,
        reviews: [],
      })
    );
  }),

  // GET /alerts/unsubscribe/:token/ is read-only; POST performs the unsubscribe
  rest.get('*/api/v1/alerts/unsubscribe/:token/', (req, res, ctx) =>
    req.params.token === 'valid-token'
      ? res(
          ctx.status(200),
          ctx.json({
            confirm_required: true,
            is_active: true,
            kind: 'fee_change',
            card_name: 'Test Credit Card',
          })
        )
      : res(ctx.status(404), ctx.json({ detail: 'Invalid unsubscribe token.' }))
  ),
  rest.post('*/api/v1/alerts/unsubscribe/:token/', (req, res, ctx) =>
    req.params.token === 'valid-token'
      ? res(ctx.status(200), ctx.json({ detail: 'Subscription cancelled.' }))
      : res(ctx.status(404), ctx.json({ detail: 'Invalid unsubscribe token.' }))
  ),

  // GET /auth/me/
  rest.get(authUrl('me/'), (req, res, ctx) => {
    const auth = req.headers.get('authorization');
    if (
      auth === 'Bearer access-1' ||
      auth === 'Bearer access-2' ||
      auth?.startsWith('Bearer access-')
    ) {
      return res(
        ctx.status(200),
        ctx.json({
          id: 7,
          username: 'reader@example.com',
          email: 'reader@example.com',
          first_name: 'John',
          last_name: 'Doe',
          profile: {
            email_verified: true,
            email_opt_in: false,
            marketing_opt_in: false,
            terms_accepted_at: '2026-01-01T00:00:00Z',
            terms_version: '2026-01',
            preferences: {},
          },
        })
      );
    }
    return res(ctx.status(401), ctx.json({ detail: 'Given token not valid' }));
  }),

  // PATCH /auth/me/
  rest.patch(authUrl('me/'), async (req, res, ctx) => {
    const auth = req.headers.get('authorization');
    if (
      auth === 'Bearer access-1' ||
      auth === 'Bearer access-2' ||
      auth?.startsWith('Bearer access-')
    ) {
      const body = (await req.json()) as MePatchBody;
      return res(
        ctx.status(200),
        ctx.json({
          id: 7,
          username: 'reader@example.com',
          email: 'reader@example.com',
          first_name: body.first_name ?? 'John',
          last_name: body.last_name ?? 'Doe',
          profile: {
            email_verified: true,
            email_opt_in: body.profile?.email_opt_in ?? false,
            marketing_opt_in: body.profile?.marketing_opt_in ?? false,
            terms_accepted_at: '2026-01-01T00:00:00Z',
            terms_version: '2026-01',
            preferences: body.profile?.preferences ?? {},
          },
        })
      );
    }
    return res(ctx.status(401), ctx.json({ detail: 'Given token not valid' }));
  }),

  // POST /auth/change-password/
  rest.post(authUrl('change-password/'), async (req, res, ctx) => {
    const auth = req.headers.get('authorization');
    if (
      auth === 'Bearer access-1' ||
      auth === 'Bearer access-2' ||
      auth?.startsWith('Bearer access-')
    ) {
      return res(ctx.status(200), ctx.json({ detail: 'Password changed successfully.' }));
    }
    return res(ctx.status(401), ctx.json({ detail: 'Given token not valid' }));
  }),
];
