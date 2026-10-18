import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import CardDetailsPopup from '../components/CardDetailsPopup';
import CardList from '../components/CardList';
import ComparisonBar from '../components/ComparisonBar';
import SearchAutocomplete, { AutocompleteSelection } from '../components/SearchAutocomplete';
import { SkeletonCardGrid } from '../components/Skeleton';
import Toast from '../components/Toast';
import { useThemeContext } from '../hooks/ThemeProvider';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import {
  useLanguage,
  pickLang,
  getCommonCopy,
  getCardDetailCopy,
  getNetworkLabel,
} from '../locales';
import {
  advancedSearchService,
  AdvancedSearchUIState,
  DEFAULT_UI_STATE,
  AdvancedSearchResponse,
  AdvancedSearchCategory,
  AdvancedSearchSortOption,
  extractFacetCounts,
  uiStateToParams,
  searchParamsToUIState,
  transformAdvancedSearchCard,
} from '../services/advancedSearch';
import { CardNetwork, CreditCard } from '../types';
import { resetSeoMeta, setSeoMeta } from '../utils/seo';
import '../styles/AdvancedSearchPage.css';

const DEFAULT_SORT_OPTIONS: AdvancedSearchSortOption[] = [
  {
    key: 'relevance',
    label: 'Relevance',
    description: 'Best match first (default with search query)',
  },
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
  {
    key: '-lounge_access_international',
    label: 'Lounge Access (Most First)',
    description: 'Sort by international lounge access descending',
  },
  {
    key: '-lounge_access_domestic',
    label: 'Domestic Lounge (Most First)',
    description: 'Sort by domestic lounge access descending',
  },
  { key: 'name', label: 'Name (A-Z)', description: 'Sort by card name ascending' },
  { key: '-name', label: 'Name (Z-A)', description: 'Sort by card name descending' },
  { key: '-created', label: 'Newest First', description: 'Sort by creation date descending' },
  { key: 'created', label: 'Oldest First', description: 'Sort by creation date ascending' },
];

const CARD_NETWORKS: CardNetwork[] = [
  'visa',
  'mastercard',
  'amex',
  'unionpay',
  'jcb',
  'diners',
  'other',
];

interface CategoryWithCount extends AdvancedSearchCategory {
  count: number;
  selected: boolean;
}

interface FacetWithCounts {
  key: string;
  label: string;
  type: 'boolean' | 'range' | 'terms';
  options: Array<{
    key: string;
    label: string;
    count: number;
    selected: boolean;
    from?: number;
    to?: number;
  }>;
}

const AdvancedSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useLanguage();
  const { isDark } = useThemeContext();
  const common = getCommonCopy(lang);
  const detailCopy = getCardDetailCopy(lang);

  // State
  const [uiState, setUiState] = useState<AdvancedSearchUIState>(DEFAULT_UI_STATE);
  const [results, setResults] = useState<AdvancedSearchResponse | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [viewedCard, setViewedCard] = useState<CreditCard | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string>('');
  const [sortOptions, setSortOptions] = useState<AdvancedSearchSortOption[]>(DEFAULT_SORT_OPTIONS);
  const [categories, setCategories] = useState<AdvancedSearchCategory[]>([]);
  const [hasMorePages, setHasMorePages] = useState(false);

  // Debounce timer for URL sync
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize from URL on mount
  useEffect(() => {
    const initialState = searchParamsToUIState(searchParams);
    setUiState(prev => ({ ...prev, ...initialState }));
  }, [searchParams]);

  // Fetch sort options and categories on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [sortRes, catRes] = await Promise.all([
          advancedSearchService.getSortOptions(),
          advancedSearchService.getCategories(),
        ]);
        setSortOptions(sortRes.sort_options);
        setCategories(catRes.categories);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Sync UI state to URL (debounced)
  const syncToUrl = useCallback(
    (newState: AdvancedSearchUIState) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const params = uiStateToParams(newState);
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return;
          if (Array.isArray(value)) {
            if (value.length > 0) searchParams.set(key, value.join(','));
          } else if (typeof value === 'boolean') {
            if (value) searchParams.set(key, 'true');
          } else {
            searchParams.set(key, String(value));
          }
        });
        // Remove page=1 for cleaner URLs
        if (searchParams.get('page') === '1') {
          searchParams.delete('page');
        }
        setSearchParams(searchParams, { replace: true });
      }, 300);
    },
    [setSearchParams]
  );

  // Execute search
  const executeSearch = useCallback(async (state: AdvancedSearchUIState, isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setError(null);
      setRateLimited(false);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = uiStateToParams(state);
      const response = await advancedSearchService.search(params);

      if (!isLoadMore) {
        setResults(response);
        setCards(response.results.map(transformAdvancedSearchCard));
      } else {
        const newCards = response.results.map(transformAdvancedSearchCard);
        setCards(prev => [...prev, ...newCards]);
        setResults(prev =>
          prev
            ? {
                ...prev,
                results: [...(prev.results || []), ...response.results],
                total: response.total,
                page: response.page,
                facets: response.facets,
              }
            : response
        );
      }
      setHasMorePages(response.page * response.page_size < response.total);
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMITED') {
        setRateLimited(true);
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Failed to search. Please try again later.');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Search when uiState changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(uiState);
      syncToUrl(uiState);
    }, 300);
    return () => clearTimeout(timer);
  }, [uiState, executeSearch, syncToUrl]);

  // SEO meta
  useEffect(() => {
    setSeoMeta({
      title: pickLang(
        lang,
        'Advanced Credit Card Search | CreditMate AI',
        'উন্নত ক্রেডিট কার্ড অনুসন্ধান | ক্রেডিটমেট এআই'
      ),
      description: pickLang(
        lang,
        'Search and filter credit cards in Bangladesh by category, annual fee, APR, lounge access and more. Save and share your search.',
        'বাংলাদেশের ক্রেডিট কার্ড ক্যাটাগরি, বার্ষিক ফি, এপিআর, লাউঞ্জ অ্যাক্সেস এবং আরও অনেক কিছু দ্বারা অনুসন্ধান ও ফিল্টার করুন। আপনার অনুসন্ধান সংরক্ষণ ও শেয়ার করুন।'
      ),
      canonicalPath: '/search',
    });
    return () => resetSeoMeta();
  }, [lang]);

  // Keep selected cards in sync with loaded cards
  useEffect(() => {
    const loadedCardIds = new Set(cards.map(c => c.id));
    setSelectedCardIds(prev => prev.filter(id => loadedCardIds.has(id)));
  }, [cards]);

  // Helpers
  const handleCardSelect = (card: CreditCard) => {
    const isRemoving = selectedCardIds.includes(card.id);
    const hasCapacity = selectedCardIds.length < 4;

    setSelectedCardIds(prev => {
      if (prev.includes(card.id)) {
        return prev.filter(id => id !== card.id);
      } else {
        if (!hasCapacity) {
          setSelectionMessage(
            pickLang(
              lang,
              'You can only select up to 4 cards for comparison.',
              'আপনি সর্বোচ্চ ৪টি কার্ড তুলনার জন্য বেছে নিতে পারেন।'
            )
          );
          return prev;
        }
        setSelectionMessage('');
        return [...prev, card.id];
      }
    });

    if (isRemoving || hasCapacity) {
      analytics.track(ANALYTICS_EVENTS.cardSelect, { cardId: card.id });
    }
  };

  const handleViewCardDetails = (card: CreditCard) => {
    analytics.track(ANALYTICS_EVENTS.cardDetailView, { cardId: card.id, bank: card.bankName });
    setViewedCard(card);
  };

  const handleRemoveFromCompare = (cardId: number) => {
    analytics.track(ANALYTICS_EVENTS.cardSelect, { cardId });
    setSelectedCardIds(prev => prev.filter(id => id !== cardId));
  };

  const handleCategoryToggle = useCallback((slug: string) => {
    setUiState(prev => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter(s => s !== slug)
        : [...prev.categories, slug],
      page: 1,
    }));
    analytics.track(ANALYTICS_EVENTS.filterApply, {
      filterCount: 1,
      filterKeys: [`category:${slug}`],
    });
  }, []);

  const handleFilterChange = useCallback((updates: Partial<AdvancedSearchUIState>) => {
    setUiState(prev => ({ ...prev, ...updates, page: 1 }));
    const filterKeys = Object.keys(updates).filter(k => k !== 'page');
    analytics.track(ANALYTICS_EVENTS.filterApply, {
      filterCount: filterKeys.length,
      filterKeys,
    });
  }, []);

  const handleSearchSelect = useCallback(
    (selection: AutocompleteSelection) => {
      if (selection.kind === 'card') {
        setUiState(prev => ({ ...prev, search: selection.name, page: 1 }));
      } else if (selection.kind === 'bank') {
        setUiState(prev => ({ ...prev, search: selection.name, page: 1 }));
      } else if (selection.kind === 'category') {
        handleCategoryToggle(selection.slug);
      }
    },
    [handleCategoryToggle]
  );

  const handleSearchFacet = useCallback(
    (facet: { slug: string; label: string; count: number }) => {
      handleCategoryToggle(facet.slug);
    },
    [handleCategoryToggle]
  );

  const handleSortChange = useCallback(
    (ordering: string) => {
      handleFilterChange({ ordering });
    },
    [handleFilterChange]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      handleFilterChange({ page });
    },
    [handleFilterChange]
  );

  const handleLoadMore = useCallback(() => {
    if (results && hasMorePages && !isLoadingMore) {
      executeSearch({ ...uiState, page: results.page + 1 }, true);
    }
  }, [results, hasMorePages, isLoadingMore, uiState, executeSearch]);

  const handleClearAll = useCallback(() => {
    setUiState(DEFAULT_UI_STATE);
    analytics.track(ANALYTICS_EVENTS.filterApply, { filterCount: 0, filterKeys: [] });
  }, []);

  // Build category options with facet counts
  const categoryOptions = useMemo((): CategoryWithCount[] => {
    if (!results?.facets?.category)
      return categories.map(c => ({ ...c, count: 0, selected: false }));

    const facet = results.facets.category;
    const counts = new Map(facet.buckets.map(b => [b.key, b.count]));
    return categories.map(c => ({
      ...c,
      count: counts.get(c.slug) ?? 0,
      selected: uiState.categories.includes(c.slug),
    }));
  }, [results, categories, uiState.categories]);

  // Build facet-based filter options with counts
  const facetFilters = useMemo((): FacetWithCounts[] => {
    if (!results?.facets) return [];

    const filters: FacetWithCounts[] = [];

    // Annual Fee Range
    const feeFacet = results.facets.annual_fee_range;
    if (feeFacet) {
      filters.push({
        key: 'annual_fee_range',
        label: pickLang(lang, 'Annual Fee', 'বার্ষিক ফি'),
        type: 'range',
        options: feeFacet.buckets.map(b => ({
          key: b.key,
          label: b.label,
          count: b.count ?? 0,
          selected: false, // Range filters don't have simple selected state
          from: b.from,
          to: b.to,
        })),
      });
    }

    // APR Range
    const aprFacet = results.facets.interest_rate_range;
    if (aprFacet) {
      filters.push({
        key: 'interest_rate_range',
        label: pickLang(lang, 'APR Range', 'এপিআর রেঞ্জ'),
        type: 'range',
        options: aprFacet.buckets.map(b => ({
          key: b.key,
          label: b.label,
          count: b.count ?? 0,
          selected: false,
          from: b.from,
          to: b.to,
        })),
      });
    }

    // Lounge Access (boolean)
    const loungeFacet = results.facets.lounge_access;
    if (loungeFacet) {
      filters.push({
        key: 'lounge_access',
        label: pickLang(lang, 'Lounge Access', 'লাউঞ্জ অ্যাক্সেস'),
        type: 'boolean',
        options: loungeFacet.buckets.map(b => ({
          key: b.key,
          label: b.label,
          count: b.count ?? b.true_count ?? b.false_count ?? 0,
          selected:
            (uiState.hasLoungeAccess && b.key === 'any') ||
            (uiState.hasInternationalLounge && b.key === 'international') ||
            (uiState.hasDomesticLounge && b.key === 'domestic'),
        })),
      });
    }

    // Fee Waiver
    const waiverFacet = results.facets.fee_waiver;
    if (waiverFacet) {
      filters.push({
        key: 'fee_waiver',
        label: pickLang(lang, 'Fee Waiver', 'ফি ছাড়'),
        type: 'boolean',
        options: waiverFacet.buckets.map(b => ({
          key: b.key,
          label: b.label,
          count: b.count ?? 0,
          selected: uiState.hasFeeWaiver && b.key === 'true',
        })),
      });
    }

    // Has Annual Fee
    const hasFeeFacet = results.facets.has_annual_fee;
    if (hasFeeFacet) {
      filters.push({
        key: 'has_annual_fee',
        label: pickLang(lang, 'Has Annual Fee', 'বার্ষিক ফি আছে'),
        type: 'boolean',
        options: hasFeeFacet.buckets.map(b => ({
          key: b.key,
          label: b.label,
          count: b.count ?? 0,
          selected:
            (uiState.hasAnnualFee && b.key === 'true') ||
            (uiState.noAnnualFee && b.key === 'false'),
        })),
      });
    }

    return filters;
  }, [results, uiState, lang]);

  // Facet counts for the card network / Islamic / dual-currency filters ("Visa (12)")
  const detailFacetCounts = useMemo(() => extractFacetCounts(results?.facets ?? {}), [results]);

  const handleNetworkToggle = useCallback((network: string) => {
    setUiState(prev => ({
      ...prev,
      cardNetworks: prev.cardNetworks.includes(network)
        ? prev.cardNetworks.filter(n => n !== network)
        : [...prev.cardNetworks, network],
      page: 1,
    }));
    analytics.track(ANALYTICS_EVENTS.filterApply, {
      filterCount: 1,
      filterKeys: [`card_network:${network}`],
    });
  }, []);

  // Sort options with localized labels
  const localizedSortOptions = useMemo(
    () =>
      sortOptions.map(opt => ({
        ...opt,
        label: pickLang(lang, opt.label, opt.label), // TODO: add Bengali translations
      })),
    [sortOptions, lang]
  );

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ label: string; onRemove: () => void }> = [];

    if (uiState.search) {
      chips.push({
        label: pickLang(lang, `Search: "${uiState.search}"`, `অনুসন্ধান: "${uiState.search}"`),
        onRemove: () => handleFilterChange({ search: '' }),
      });
    }

    uiState.categories.forEach(slug => {
      const cat = categories.find(c => c.slug === slug);
      if (cat) {
        chips.push({
          label: pickLang(lang, cat.name, cat.name),
          onRemove: () => handleCategoryToggle(slug),
        });
      }
    });

    if (uiState.annualFeeMin !== '' || uiState.annualFeeMax !== '') {
      const min = uiState.annualFeeMin !== '' ? `${uiState.annualFeeMin}` : '0';
      const max = uiState.annualFeeMax !== '' ? `${uiState.annualFeeMax}` : '∞';
      chips.push({
        label: pickLang(lang, `Annual Fee: ${min}–${max}`, `বার্ষিক ফি: ${min}–${max}`),
        onRemove: () => handleFilterChange({ annualFeeMin: '', annualFeeMax: '' }),
      });
    }

    if (uiState.aprMin !== '' || uiState.aprMax !== '') {
      const min = uiState.aprMin !== '' ? `${uiState.aprMin}%` : '0%';
      const max = uiState.aprMax !== '' ? `${uiState.aprMax}%` : '∞';
      chips.push({
        label: pickLang(lang, `APR: ${min}–${max}`, `এপিআর: ${min}–${max}`),
        onRemove: () => handleFilterChange({ aprMin: '', aprMax: '' }),
      });
    }

    if (uiState.hasLoungeAccess) {
      chips.push({
        label: pickLang(lang, 'Any Lounge Access', 'যেকোনো লাউঞ্জ অ্যাক্সেস'),
        onRemove: () => handleFilterChange({ hasLoungeAccess: false }),
      });
    }
    if (uiState.hasInternationalLounge) {
      chips.push({
        label: pickLang(lang, 'International Lounge', 'আন্তর্জাতিক লাউঞ্জ'),
        onRemove: () => handleFilterChange({ hasInternationalLounge: false }),
      });
    }
    if (uiState.hasDomesticLounge) {
      chips.push({
        label: pickLang(lang, 'Domestic Lounge', 'স্থানীয় লাউঞ্জ'),
        onRemove: () => handleFilterChange({ hasDomesticLounge: false }),
      });
    }
    if (uiState.hasAnnualFee) {
      chips.push({
        label: pickLang(lang, 'Has Annual Fee', 'বার্ষিক ফি আছে'),
        onRemove: () => handleFilterChange({ hasAnnualFee: false }),
      });
    }
    if (uiState.noAnnualFee) {
      chips.push({
        label: pickLang(lang, 'No Annual Fee', 'বার্ষিক ফি নেই'),
        onRemove: () => handleFilterChange({ noAnnualFee: false }),
      });
    }
    if (uiState.hasFeeWaiver) {
      chips.push({
        label: pickLang(lang, 'Fee Waiver', 'ফি ছাড়'),
        onRemove: () => handleFilterChange({ hasFeeWaiver: false }),
      });
    }
    uiState.cardNetworks.forEach(network => {
      chips.push({
        label: getNetworkLabel(detailCopy, network) ?? network,
        onRemove: () => handleNetworkToggle(network),
      });
    });
    if (uiState.isIslamic) {
      chips.push({
        label: common.filterLabelIslamic,
        onRemove: () => handleFilterChange({ isIslamic: false }),
      });
    }
    if (uiState.isDualCurrency) {
      chips.push({
        label: common.filterLabelDualCurrency,
        onRemove: () => handleFilterChange({ isDualCurrency: false }),
      });
    }
    if (uiState.maxMinMonthlyIncome !== '') {
      chips.push({
        label: `${common.filterLabelMonthlyIncome}: ${uiState.maxMinMonthlyIncome}`,
        onRemove: () => handleFilterChange({ maxMinMonthlyIncome: '' }),
      });
    }

    return chips;
  }, [
    uiState,
    categories,
    lang,
    common,
    detailCopy,
    handleFilterChange,
    handleCategoryToggle,
    handleNetworkToggle,
  ]);

  // Render
  if (isLoading && !results) {
    return (
      <div className="advanced-search-page">
        <div className="page-header">
          <h1>{pickLang(lang, 'Advanced Search', 'উন্নত অনুসন্ধান')}</h1>
          <p>
            {pickLang(
              lang,
              'Find the perfect credit card with powerful filters',
              'শক্তিশালী ফিল্টার দিয়ে সঠিক ক্রেডিট কার্ড খুঁজে বের করুন'
            )}
          </p>
        </div>
        <SkeletonCardGrid
          count={6}
          label={pickLang(lang, 'Loading search results...', 'অনুসন্ধান ফলাফল লোড হচ্ছে...')}
        />
      </div>
    );
  }

  return (
    <div
      className={`advanced-search-page ${isDark ? 'dark' : ''}`}
      data-testid="advanced-search-page"
    >
      <div className="page-header">
        <h1>{pickLang(lang, 'Advanced Search', 'উন্নত অনুসন্ধান')}</h1>
        <p>
          {pickLang(
            lang,
            'Find the perfect credit card with powerful filters',
            'শক্তিশালী ফিল্টার দিয়ে সঠিক ক্রেডিট কার্ড খুঁজে বের করুন'
          )}
        </p>
      </div>

      {/* Search Bar */}
      <div className="search-bar-section">
        <SearchAutocomplete
          value={uiState.search}
          onChange={value => handleFilterChange({ search: value, page: 1 })}
          onSearch={query => handleFilterChange({ search: query, page: 1 })}
          onSelectCard={s => handleSearchSelect({ kind: 'card', ...s })}
          onSelectBank={s => handleSearchSelect({ kind: 'bank', ...s })}
          onSelectCategory={s => handleSearchSelect({ kind: 'category', ...s })}
          onSelectFacet={handleSearchFacet}
          placeholder={pickLang(
            lang,
            'Search by card name, bank, or features...',
            'কার্ডের নাম, ব্যাংক, বা বৈশিষ্ট্য দিয়ে অনুসন্ধান করুন...'
          )}
          ariaLabel={pickLang(lang, 'Search credit cards', 'ক্রেডিট কার্ড অনুসন্ধান করুন')}
        />
      </div>

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div
          className="active-filters"
          role="group"
          aria-label={pickLang(lang, 'Active filters', 'সক্রিয় ফিল্টার')}
        >
          <span className="active-filters-label">
            {pickLang(lang, 'Active filters:', 'সক্রিয় ফিল্টার:')}
          </span>
          <div className="filter-chips">
            {activeFilterChips.map((chip, index) => (
              <span key={index} className="filter-chip">
                {chip.label}
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={chip.onRemove}
                  aria-label={pickLang(
                    lang,
                    `Remove filter: ${chip.label}`,
                    `ফিল্টার সরান: ${chip.label}`
                  )}
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" className="clear-all-filters" onClick={handleClearAll}>
              {pickLang(lang, 'Clear all', 'সব মুছুন')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar Filters */}
        <aside
          className="filter-sidebar"
          aria-label={pickLang(lang, 'Search filters', 'অনুসন্ধান ফিল্টার')}
        >
          {/* Categories */}
          <section className="filter-section">
            <h3>
              {pickLang(lang, 'Categories', 'ক্যাটাগরি')}{' '}
              <span className="filter-count">
                ({categoryOptions.filter(c => c.count > 0).length})
              </span>
            </h3>
            <div
              className="category-multiselect"
              role="group"
              aria-label={pickLang(lang, 'Category filters', 'ক্যাটাগরি ফিল্টার')}
            >
              {categoryOptions.map(cat => (
                <label
                  key={cat.slug}
                  className={`category-option ${cat.selected ? 'selected' : ''} ${
                    cat.count === 0 ? 'disabled' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={cat.selected}
                    onChange={() => cat.count > 0 && handleCategoryToggle(cat.slug)}
                    disabled={cat.count === 0}
                  />
                  <span className="category-name">{pickLang(lang, cat.name, cat.name)}</span>
                  <span className="category-count" data-testid={`category-count-${cat.slug}`}>
                    {cat.count}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Fee & APR Range Filters */}
          <section className="filter-section">
            <h3>{pickLang(lang, 'Annual Fee (BDT)', 'বার্ষিক ফি (বিডিটি)')}</h3>
            <div className="range-filter">
              <div className="range-input-pair">
                <label htmlFor="fee-min">{pickLang(lang, 'Min', 'ন্যূনতম')}</label>
                <input
                  id="fee-min"
                  type="number"
                  min="0"
                  value={uiState.annualFeeMin}
                  onChange={e =>
                    handleFilterChange({
                      annualFeeMin: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="range-input-pair">
                <label htmlFor="fee-max">{pickLang(lang, 'Max', 'সর্বোচ্চ')}</label>
                <input
                  id="fee-max"
                  type="number"
                  min="0"
                  value={uiState.annualFeeMax}
                  onChange={e =>
                    handleFilterChange({
                      annualFeeMax: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  placeholder="∞"
                />
              </div>
            </div>
            {/* Quick preset buttons from facet counts */}
            {facetFilters
              .find(f => f.key === 'annual_fee_range')
              ?.options.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  className={`preset-button ${
                    uiState.annualFeeMin !== '' &&
                    opt.from !== undefined &&
                    uiState.annualFeeMin >= (opt.from ?? 0) &&
                    uiState.annualFeeMax !== '' &&
                    opt.to !== undefined &&
                    uiState.annualFeeMax <= (opt.to ?? Infinity)
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleFilterChange({
                      annualFeeMin: opt.from ?? '',
                      annualFeeMax: opt.to ?? '',
                    })
                  }
                >
                  {opt.label} <span className="preset-count">({opt.count})</span>
                </button>
              ))}
          </section>

          <section className="filter-section">
            <h3>{pickLang(lang, 'APR (%)', 'এপিআর (%)')}</h3>
            <div className="range-filter">
              <div className="range-input-pair">
                <label htmlFor="apr-min">{pickLang(lang, 'Min', 'ন্যূনতম')}</label>
                <input
                  id="apr-min"
                  type="number"
                  min="0"
                  step="0.1"
                  value={uiState.aprMin}
                  onChange={e =>
                    handleFilterChange({
                      aprMin: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="range-input-pair">
                <label htmlFor="apr-max">{pickLang(lang, 'Max', 'সর্বোচ্চ')}</label>
                <input
                  id="apr-max"
                  type="number"
                  min="0"
                  step="0.1"
                  value={uiState.aprMax}
                  onChange={e =>
                    handleFilterChange({
                      aprMax: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  placeholder="∞"
                />
              </div>
            </div>
            {facetFilters
              .find(f => f.key === 'interest_rate_range')
              ?.options.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  className="preset-button"
                  onClick={() =>
                    handleFilterChange({
                      aprMin: opt.from ?? '',
                      aprMax: opt.to ?? '',
                    })
                  }
                >
                  {opt.label} <span className="preset-count">({opt.count})</span>
                </button>
              ))}
          </section>

          {/* Lounge Access */}
          <section className="filter-section">
            <h3>{pickLang(lang, 'Lounge Access', 'লাউঞ্জ অ্যাক্সেস')}</h3>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.hasLoungeAccess}
                  onChange={e => handleFilterChange({ hasLoungeAccess: e.target.checked })}
                />
                <span>{pickLang(lang, 'Any Lounge Access', 'যেকোনো লাউঞ্জ অ্যাক্সেস')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.hasInternationalLounge}
                  onChange={e => handleFilterChange({ hasInternationalLounge: e.target.checked })}
                />
                <span>{pickLang(lang, 'International Lounge', 'আন্তর্জাতিক লাউঞ্জ')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.hasDomesticLounge}
                  onChange={e => handleFilterChange({ hasDomesticLounge: e.target.checked })}
                />
                <span>{pickLang(lang, 'Domestic Lounge', 'স্থানীয় লাউঞ্জ')}</span>
              </label>
            </div>
            {facetFilters
              .find(f => f.key === 'lounge_access')
              ?.options.map(opt => (
                <span key={opt.key} className="facet-count-badge">
                  {opt.label}: {opt.count}
                </span>
              ))}
          </section>

          {/* Fee Options */}
          <section className="filter-section">
            <h3>{pickLang(lang, 'Fee Options', 'ফি অপশন')}</h3>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.hasAnnualFee}
                  onChange={e =>
                    handleFilterChange({ hasAnnualFee: e.target.checked, noAnnualFee: false })
                  }
                  aria-label={pickLang(
                    lang,
                    'Fee option: Has Annual Fee',
                    'ফি অপশন: বার্ষিক ফি আছে'
                  )}
                />
                <span>{pickLang(lang, 'Has Annual Fee', 'বার্ষিক ফি আছে')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.noAnnualFee}
                  onChange={e =>
                    handleFilterChange({ noAnnualFee: e.target.checked, hasAnnualFee: false })
                  }
                  aria-label={pickLang(
                    lang,
                    'Fee option: No Annual Fee',
                    'ফি অপশন: বার্ষিক ফি নেই'
                  )}
                />
                <span>{pickLang(lang, 'No Annual Fee', 'বার্ষিক ফি নেই')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.hasFeeWaiver}
                  onChange={e => handleFilterChange({ hasFeeWaiver: e.target.checked })}
                  aria-label={pickLang(
                    lang,
                    'Fee option: Fee Waiver Available',
                    'ফি অপশন: ফি ছাড় উপলব্ধ'
                  )}
                />
                <span>{pickLang(lang, 'Fee Waiver Available', 'ফি ছাড় উপলব্ধ')}</span>
              </label>
            </div>
          </section>

          {/* Card Network */}
          <section className="filter-section">
            <h3 id="adv-network-heading">{common.filterSectionCardNetwork}</h3>
            <div className="network-chip-group" role="group" aria-labelledby="adv-network-heading">
              {CARD_NETWORKS.map(network => {
                const count = detailFacetCounts[`card_network:${network}`];
                const selected = uiState.cardNetworks.includes(network);
                return (
                  <button
                    key={network}
                    type="button"
                    className={`preset-button ${selected ? 'active' : ''}`}
                    aria-pressed={selected}
                    onClick={() => handleNetworkToggle(network)}
                  >
                    {getNetworkLabel(detailCopy, network)}
                    {count !== undefined && <span className="preset-count"> ({count})</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card Type */}
          <section className="filter-section">
            <h3>{common.filterSectionCardType}</h3>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.isIslamic}
                  onChange={e => handleFilterChange({ isIslamic: e.target.checked })}
                />
                <span>
                  {common.filterLabelIslamic}
                  {detailFacetCounts['is_islamic:true'] !== undefined &&
                    ` (${detailFacetCounts['is_islamic:true']})`}
                </span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.isDualCurrency}
                  onChange={e => handleFilterChange({ isDualCurrency: e.target.checked })}
                />
                <span>
                  {common.filterLabelDualCurrency}
                  {detailFacetCounts['is_dual_currency:true'] !== undefined &&
                    ` (${detailFacetCounts['is_dual_currency:true']})`}
                </span>
              </label>
            </div>
          </section>

          {/* Income requirement */}
          <section className="filter-section">
            <h3>{common.filterSectionIncome}</h3>
            <div className="range-input-pair">
              <label htmlFor="max-min-income">{common.filterLabelMonthlyIncome}</label>
              <input
                id="max-min-income"
                type="number"
                min="0"
                value={uiState.maxMinMonthlyIncome}
                onChange={e =>
                  handleFilterChange({
                    maxMinMonthlyIncome: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={uiState.includeUnknownIncome}
                  onChange={e => handleFilterChange({ includeUnknownIncome: e.target.checked })}
                />
                <span>{common.filterLabelIncludeUnknownIncome}</span>
              </label>
            </div>
          </section>

          {/* Feature Search */}
          <section className="filter-section">
            <h3>{pickLang(lang, 'Feature Search', 'বৈশিষ্ট্য অনুসন্ধান')}</h3>
            <input
              type="text"
              value={uiState.featureSearch}
              onChange={e => handleFilterChange({ featureSearch: e.target.value })}
              placeholder={pickLang(lang, 'Search in features...', 'বৈশিষ্ট্যে অনুসন্ধান করুন...')}
              aria-label={pickLang(
                lang,
                'Search within card features',
                'কার্ডের বৈশিষ্ট্যে অনুসন্ধান করুন'
              )}
            />
          </section>

          {/* Sort Selector */}
          <section className="filter-section">
            <h3>{pickLang(lang, 'Sort By', 'সাজান')}</h3>
            <select
              value={uiState.ordering}
              onChange={e => handleSortChange(e.target.value)}
              aria-label={pickLang(lang, 'Sort results by', 'ফলাফল সাজান')}
            >
              {localizedSortOptions.map(opt => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>
        </aside>

        {/* Results Panel */}
        <div className="results-panel">
          {/* Results Header */}
          <div className="results-header">
            <div className="results-info">
              {results ? (
                <>
                  <span className="results-count">
                    {pickLang(lang, 'Showing', 'দেখানো হচ্ছে')} {cards.length}{' '}
                    {pickLang(lang, 'of', 'থেকে')} {results.total}{' '}
                    {pickLang(lang, 'cards', 'কার্ড')}
                  </span>
                  {results.source && (
                    <span className="results-source">
                      {pickLang(lang, 'Source:', 'সোর্স:')}{' '}
                      {results.source === 'elasticsearch'
                        ? pickLang(lang, 'Elasticsearch', 'Elasticsearch')
                        : pickLang(lang, 'Database', 'ডেটাবেস')}
                    </span>
                  )}
                </>
              ) : (
                <span>{pickLang(lang, 'No results', 'কোন ফলাফল নেই')}</span>
              )}
            </div>
            <div className="results-view-options">
              <label htmlFor="page-size" className="visually-hidden">
                {pickLang(lang, 'Results per page', 'প্রতি পৃষ্ঠা ফলাফল')}
              </label>
              <select
                id="page-size"
                value={uiState.pageSize}
                onChange={e => handleFilterChange({ pageSize: Number(e.target.value), page: 1 })}
                aria-label={pickLang(lang, 'Results per page', 'প্রতি পৃষ্ঠা ফলাফল')}
              >
                <option value={10}>{pickLang(lang, '10 per page', '১০টি প্রতি পৃষ্ঠা')}</option>
                <option value={20}>{pickLang(lang, '20 per page', '২০টি প্রতি পৃষ্ঠা')}</option>
                <option value={50}>{pickLang(lang, '50 per page', '৫০টি প্রতি পৃষ্ঠা')}</option>
                <option value={100}>{pickLang(lang, '100 per page', '১০০টি প্রতি পৃষ্ঠা')}</option>
              </select>
            </div>
          </div>

          {/* Error / Rate Limited / Empty States */}
          {error && !rateLimited && (
            <div className="error-state" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => executeSearch(uiState)}>
                {pickLang(lang, 'Retry', 'পুনরায় চেষ্টা করুন')}
              </button>
            </div>
          )}

          {rateLimited && (
            <div className="rate-limited-state" role="alert">
              <p>
                {pickLang(
                  lang,
                  'Too many requests. Please wait a moment and try again.',
                  'অনেক অনুরোধ। একটু অপেক্ষা করে আবার চেষ্টা করুন।'
                )}
              </p>
              <button type="button" onClick={() => executeSearch(uiState)}>
                {pickLang(lang, 'Retry', 'পুনরায় চেষ্টা করুন')}
              </button>
            </div>
          )}

          {!isLoading && !error && !rateLimited && cards.length === 0 && (
            <div className="empty-state" role="status">
              <h3>{pickLang(lang, 'No credit cards found', 'কোন ক্রেডিট কার্ড পাওয়া যায়নি')}</h3>
              <p>
                {pickLang(
                  lang,
                  'Try adjusting your search or filter criteria',
                  'আপনার অনুসন্ধান বা ফিল্টার মানদণ্ড সমন্বয় করার চেষ্টা করুন'
                )}
              </p>
              <button type="button" onClick={handleClearAll} className="clear-filters-button">
                {pickLang(lang, 'Clear all filters', 'সব ফিল্টার মুছুন')}
              </button>
            </div>
          )}

          {/* Card List */}
          {!isLoading && !error && !rateLimited && cards.length > 0 && (
            <>
              <CardList
                cards={cards}
                onCardSelect={handleCardSelect}
                selectedCardIds={selectedCardIds}
                maxSelections={4}
                onViewCardDetails={handleViewCardDetails}
                layout="grid"
              />

              {/* Load More / Pagination */}
              {hasMorePages && (
                <div className="load-more-container">
                  <button
                    type="button"
                    className="load-more-button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore
                      ? pickLang(lang, 'Loading more...', 'আরো লোড হচ্ছে...')
                      : pickLang(lang, 'Load more cards', 'আরো কার্ড লোড করুন')}
                  </button>
                </div>
              )}

              {/* Pagination Controls */}
              {results && results.total > results.page_size && (
                <nav className="pagination" aria-label={pickLang(lang, 'Pagination', 'পেজিনেশন')}>
                  <button
                    type="button"
                    onClick={() => handlePageChange(results.page - 1)}
                    disabled={results.page <= 1 || isLoadingMore}
                    aria-label={pickLang(lang, 'Previous page', 'পূর্বের পৃষ্ঠা')}
                  >
                    ‹ {pickLang(lang, 'Previous', 'পূর্বের')}
                  </button>
                  <span className="page-info" aria-live="polite">
                    {pickLang(lang, 'Page', 'পৃষ্ঠা')} {results.page} {pickLang(lang, 'of', 'থেকে')}{' '}
                    {Math.ceil(results.total / results.page_size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(results.page + 1)}
                    disabled={!hasMorePages || isLoadingMore}
                    aria-label={pickLang(lang, 'Next page', 'পরবর্তী পৃষ্ঠা')}
                  >
                    {pickLang(lang, 'Next', 'পরবর্তী')} ›
                  </button>
                </nav>
              )}
            </>
          )}

          {/* Card Details Popup */}
          <AnimatePresence>
            {viewedCard && (
              <CardDetailsPopup
                key={viewedCard.id}
                card={viewedCard}
                onClose={() => setViewedCard(null)}
                onAddToCompare={handleCardSelect}
                isInCompareList={selectedCardIds.includes(viewedCard.id)}
              />
            )}
          </AnimatePresence>

          {/* Comparison Bar */}
          <ComparisonBar
            selectedCards={cards.filter(card => selectedCardIds.includes(card.id))}
            onRemoveCard={handleRemoveFromCompare}
            maxSelections={4}
          />

          <Toast className="selection-message" message={selectionMessage} />
        </div>
      </div>

      {/* Save Search / Share URL Helper */}
      {results && (
        <div className="search-actions">
          <button
            type="button"
            className="share-search-button"
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              analytics.track(ANALYTICS_EVENTS.compareShare, { referrer: 'advanced_search' });
            }}
          >
            {pickLang(lang, '🔗 Copy Search URL', '🔗 অনুসন্ধান URL কপি করুন')}
          </button>
          <button
            type="button"
            className="save-search-button"
            onClick={async () => {
              try {
                const params = uiStateToParams(uiState);
                await advancedSearchService.normalize(params);
                // TODO: Integrate with saved searches feature
              } catch (err) {
                console.error('Failed to normalize query:', err);
              }
            }}
          >
            {pickLang(lang, '💾 Save Search', '💾 অনুসন্ধান সংরক্ষণ করুন')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchPage;
