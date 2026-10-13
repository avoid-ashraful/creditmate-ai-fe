import {
  uiStateToParams,
  paramsToSearchParams,
  searchParamsToUIState,
  extractFacetCounts,
  DEFAULT_UI_STATE,
  DEFAULT_FACETS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  AdvancedSearchUIState,
} from './advancedSearch';

describe('advancedSearch service', () => {
  describe('DEFAULT_UI_STATE', () => {
    it('has correct default values', () => {
      expect(DEFAULT_UI_STATE.search).toBe('');
      expect(DEFAULT_UI_STATE.categories).toEqual([]);
      expect(DEFAULT_UI_STATE.annualFeeMin).toBe('');
      expect(DEFAULT_UI_STATE.annualFeeMax).toBe('');
      expect(DEFAULT_UI_STATE.aprMin).toBe('');
      expect(DEFAULT_UI_STATE.aprMax).toBe('');
      expect(DEFAULT_UI_STATE.hasLoungeAccess).toBe(false);
      expect(DEFAULT_UI_STATE.hasInternationalLounge).toBe(false);
      expect(DEFAULT_UI_STATE.hasDomesticLounge).toBe(false);
      expect(DEFAULT_UI_STATE.hasAnnualFee).toBe(false);
      expect(DEFAULT_UI_STATE.noAnnualFee).toBe(false);
      expect(DEFAULT_UI_STATE.hasFeeWaiver).toBe(false);
      expect(DEFAULT_UI_STATE.featureSearch).toBe('');
      expect(DEFAULT_UI_STATE.bankIds).toEqual([]);
      expect(DEFAULT_UI_STATE.ordering).toBe('relevance');
      expect(DEFAULT_UI_STATE.page).toBe(1);
      expect(DEFAULT_UI_STATE.pageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(DEFAULT_UI_STATE.facets).toBe(DEFAULT_FACETS);
    });
  });

  describe('uiStateToParams', () => {
    it('converts empty state to minimal params', () => {
      const params = uiStateToParams(DEFAULT_UI_STATE);
      expect(params.page).toBe(1);
      expect(params.page_size).toBe(DEFAULT_PAGE_SIZE);
      expect(params.facets).toBe(DEFAULT_FACETS);
      expect(params.search).toBeUndefined();
      expect(params.categories).toBeUndefined();
    });

    it('includes search term when present', () => {
      const state = { ...DEFAULT_UI_STATE, search: 'visa platinum' };
      const params = uiStateToParams(state);
      expect(params.search).toBe('visa platinum');
    });

    it('includes categories as comma-separated string', () => {
      const state = { ...DEFAULT_UI_STATE, categories: ['travel', 'cashback'] };
      const params = uiStateToParams(state);
      expect(params.categories).toBe('travel,cashback');
    });

    it('includes annual fee range when both min and max set', () => {
      const state = { ...DEFAULT_UI_STATE, annualFeeMin: 1000, annualFeeMax: 5000 };
      const params = uiStateToParams(state);
      expect(params.annual_fee_min).toBe(1000);
      expect(params.annual_fee_max).toBe(5000);
    });

    it('includes only min when max not set', () => {
      const state: AdvancedSearchUIState = {
        ...DEFAULT_UI_STATE,
        annualFeeMin: 1000,
        annualFeeMax: '',
      };
      const params = uiStateToParams(state);
      expect(params.annual_fee_min).toBe(1000);
      expect(params.annual_fee_max).toBeUndefined();
    });

    it('includes APR range', () => {
      const state = { ...DEFAULT_UI_STATE, aprMin: 15, aprMax: 25 };
      const params = uiStateToParams(state);
      expect(params.interest_rate_min).toBe(15);
      expect(params.interest_rate_max).toBe(25);
    });

    it('includes boolean filters when true', () => {
      const state = {
        ...DEFAULT_UI_STATE,
        hasLoungeAccess: true,
        hasInternationalLounge: true,
        hasDomesticLounge: false,
        hasAnnualFee: true,
        noAnnualFee: false,
        hasFeeWaiver: true,
      };
      const params = uiStateToParams(state);
      expect(params.has_lounge_access).toBe(true);
      expect(params.has_international_lounge).toBe(true);
      expect(params.has_domestic_lounge).toBeUndefined();
      expect(params.has_annual_fee).toBe(true);
      expect(params.no_annual_fee).toBeUndefined();
      expect(params.has_fee_waiver).toBe(true);
    });

    it('includes feature search', () => {
      const state = { ...DEFAULT_UI_STATE, featureSearch: 'cashback' };
      const params = uiStateToParams(state);
      expect(params.feature_search).toBe('cashback');
    });

    it('includes bank IDs as array', () => {
      const state = { ...DEFAULT_UI_STATE, bankIds: [1, 2, 3] };
      const params = uiStateToParams(state);
      expect(params.bank_ids).toEqual([1, 2, 3]);
    });

    it('includes ordering', () => {
      const state = { ...DEFAULT_UI_STATE, ordering: '-annual_fee' };
      const params = uiStateToParams(state);
      expect(params.ordering).toBe('-annual_fee');
    });

    it('includes page and page_size', () => {
      const state = { ...DEFAULT_UI_STATE, page: 3, pageSize: 50 };
      const params = uiStateToParams(state);
      expect(params.page).toBe(3);
      expect(params.page_size).toBe(50);
    });
  });

  describe('paramsToSearchParams', () => {
    it('creates URLSearchParams from params', () => {
      const params = {
        search: 'visa',
        categories: 'travel,cashback',
        annual_fee_min: 1000,
        annual_fee_max: 5000,
        interest_rate_min: 15,
        interest_rate_max: 25,
        has_lounge_access: true,
        has_international_lounge: false,
        has_domestic_lounge: true,
        has_annual_fee: true,
        no_annual_fee: false,
        has_fee_waiver: true,
        feature_search: 'cashback',
        bank_ids: [1, 2],
        ordering: '-annual_fee',
        page: 2,
        page_size: 20,
        facets: 'bank,category',
      };
      const searchParams = paramsToSearchParams(params);
      expect(searchParams.get('search')).toBe('visa');
      expect(searchParams.get('categories')).toBe('travel,cashback');
      expect(searchParams.get('annual_fee_min')).toBe('1000');
      expect(searchParams.get('annual_fee_max')).toBe('5000');
      expect(searchParams.get('interest_rate_min')).toBe('15');
      expect(searchParams.get('interest_rate_max')).toBe('25');
      expect(searchParams.get('has_lounge_access')).toBe('true');
      expect(searchParams.get('has_international_lounge')).toBeNull(); // false not included
      expect(searchParams.get('has_domestic_lounge')).toBe('true');
      expect(searchParams.get('has_annual_fee')).toBe('true');
      expect(searchParams.get('no_annual_fee')).toBeNull(); // false not included
      expect(searchParams.get('has_fee_waiver')).toBe('true');
      expect(searchParams.get('feature_search')).toBe('cashback');
      expect(searchParams.get('bank_ids')).toBe('1,2');
      expect(searchParams.get('ordering')).toBe('-annual_fee');
      expect(searchParams.get('page')).toBe('2');
      expect(searchParams.get('page_size')).toBe('20');
      expect(searchParams.get('facets')).toBe('bank,category');
    });

    it('omits undefined and empty values', () => {
      const params = {
        search: '',
        annual_fee_min: undefined,
        has_lounge_access: false,
      };
      const searchParams = paramsToSearchParams(params);
      expect(searchParams.get('search')).toBeNull();
      expect(searchParams.get('annual_fee_min')).toBeNull();
      expect(searchParams.get('has_lounge_access')).toBeNull();
    });
  });

  describe('searchParamsToUIState', () => {
    it('parses search params to UI state', () => {
      const searchParams = new URLSearchParams([
        ['search', 'visa platinum'],
        ['categories', 'travel,cashback'],
        ['annual_fee_min', '1000'],
        ['annual_fee_max', '5000'],
        ['interest_rate_min', '15.5'],
        ['interest_rate_max', '25.0'],
        ['has_lounge_access', 'true'],
        ['has_international_lounge', 'true'],
        ['has_domestic_lounge', 'false'],
        ['has_annual_fee', 'true'],
        ['no_annual_fee', 'true'],
        ['has_fee_waiver', 'true'],
        ['feature_search', 'cashback'],
        ['bank_ids', '1,2,3'],
        ['ordering', '-annual_fee'],
        ['page', '3'],
        ['page_size', '50'],
        ['facets', 'bank,category,annual_fee_range'],
      ]);
      const state = searchParamsToUIState(searchParams);
      expect(state.search).toBe('visa platinum');
      expect(state.categories).toEqual(['travel', 'cashback']);
      expect(state.annualFeeMin).toBe(1000);
      expect(state.annualFeeMax).toBe(5000);
      expect(state.aprMin).toBe(15.5);
      expect(state.aprMax).toBe(25.0);
      expect(state.hasLoungeAccess).toBe(true);
      expect(state.hasInternationalLounge).toBe(true);
      expect(state.hasDomesticLounge).toBe(false);
      expect(state.hasAnnualFee).toBe(true);
      expect(state.noAnnualFee).toBe(true);
      expect(state.hasFeeWaiver).toBe(true);
      expect(state.featureSearch).toBe('cashback');
      expect(state.bankIds).toEqual([1, 2, 3]);
      expect(state.ordering).toBe('-annual_fee');
      expect(state.page).toBe(3);
      expect(state.pageSize).toBe(50);
      expect(state.facets).toBe('bank,category,annual_fee_range');
    });

    it('handles missing params gracefully', () => {
      const searchParams = new URLSearchParams();
      const state = searchParamsToUIState(searchParams);
      expect(state.search).toBeUndefined();
      expect(state.categories).toBeUndefined();
      expect(state.annualFeeMin).toBeUndefined();
    });

    it('clamps page to minimum 1', () => {
      const searchParams = new URLSearchParams([['page', '0']]);
      const state = searchParamsToUIState(searchParams);
      expect(state.page).toBe(1);
    });

    it('clamps page_size to MAX_PAGE_SIZE', () => {
      const searchParams = new URLSearchParams([['page_size', '200']]);
      const state = searchParamsToUIState(searchParams);
      expect(state.pageSize).toBe(MAX_PAGE_SIZE);
    });

    it('filters out invalid bank IDs', () => {
      const searchParams = new URLSearchParams([['bank_ids', '1,abc,2,']]);
      const state = searchParamsToUIState(searchParams);
      expect(state.bankIds).toEqual([1, 2]);
    });
  });

  describe('extractFacetCounts', () => {
    it('extracts category facet counts', () => {
      const facets = {
        category: {
          label: 'Category',
          type: 'category' as const,
          buckets: [
            { key: 'travel', label: 'Travel', count: 10, filter: 'categories=travel' },
            { key: 'cashback', label: 'Cashback', count: 5, filter: 'categories=cashback' },
          ],
        },
      };
      const counts = extractFacetCounts(facets);
      expect(counts['category:travel']).toBe(10);
      expect(counts['category:cashback']).toBe(5);
    });

    it('extracts boolean facet counts', () => {
      const facets = {
        lounge_access: {
          label: 'Lounge Access',
          type: 'boolean' as const,
          buckets: [
            {
              key: 'international',
              label: 'International',
              count: 20,
              true_count: 20,
              false_count: 80,
            },
            { key: 'domestic', label: 'Domestic', count: 15, true_count: 15, false_count: 85 },
            { key: 'any', label: 'Any', count: 25, true_count: 25, false_count: 75 },
          ],
        },
        has_annual_fee: {
          label: 'Has Annual Fee',
          type: 'boolean' as const,
          buckets: [
            { key: 'true', label: 'Yes', count: 60 },
            { key: 'false', label: 'No', count: 40 },
          ],
        },
      };
      const counts = extractFacetCounts(facets);
      expect(counts['lounge_access:international']).toBe(20);
      expect(counts['lounge_access:domestic']).toBe(15);
      expect(counts['lounge_access:any']).toBe(25);
      expect(counts['has_annual_fee:true']).toBe(60);
      expect(counts['has_annual_fee:false']).toBe(40);
    });

    it('extracts range facet counts', () => {
      const facets = {
        annual_fee_range: {
          label: 'Annual Fee Range',
          type: 'range' as const,
          buckets: [
            { key: 'free', label: 'Free', count: 10 },
            { key: 'low', label: 'Low', from: 1, to: 1000, count: 20 },
            { key: 'high', label: 'High', from: 3000, count: 5 },
          ],
        },
      };
      const counts = extractFacetCounts(facets);
      expect(counts['annual_fee_range:free']).toBe(10);
      expect(counts['annual_fee_range:low']).toBe(20);
      expect(counts['annual_fee_range:high']).toBe(5);
    });

    it('extracts terms facet counts', () => {
      const facets = {
        bank: {
          label: 'Bank',
          type: 'terms' as const,
          buckets: [
            { key: 'Bank A', label: 'Bank A', count: 15 },
            { key: 'Bank B', label: 'Bank B', count: 10 },
          ],
        },
      };
      const counts = extractFacetCounts(facets);
      expect(counts['bank:Bank A']).toBe(15);
      expect(counts['bank:Bank B']).toBe(10);
    });

    it('handles empty facets', () => {
      const counts = extractFacetCounts({});
      expect(counts).toEqual({});
    });
  });
});
