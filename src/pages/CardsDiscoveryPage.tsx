/**
 * Canonical card discovery (redesign plan Section 4.4) — the single home
 * for finding cards. The old Home catalogue and Advanced Search merge
 * here; /search and /category/:slug redirect into this page.
 *
 * One pattern (Section 4.2): prominent search, facet groups with counts, a
 * searchable bank filter, sort with the criterion always labelled, active
 * filter chips, full URL state, ONE navigation model (numbered
 * pagination), and zero-results recovery that names the filter that
 * eliminated everything. Results render through ResultCard; the hero
 * number is the CreditMate Score. Shortlisting a card is the compare
 * selection (tray -> /compare), replacing the old comparison bar.
 *
 * Search maths, params and rankings come unchanged from
 * services/advancedSearch — this page is presentation and IA only.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';

import {
  BankFilter,
  DiscoveryError,
  DiscoveryLayout,
  DiscoverySkeleton,
  FilterChips,
  ResultHeader,
  ZeroResults,
} from '../components/discovery';
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Money,
  Pagination,
  PromptDialog,
  ResultCard,
  TrustChip,
  UnknownValue,
  useToast,
} from '../components/ui';
import { useAuth } from '../hooks/AuthProvider';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import {
  fillCopy,
  getCardDetailCopy,
  getCommonCopy,
  getDiscoveryCopy,
  getNetworkLabel,
  getShellCopy,
  useLanguage,
} from '../locales';
import { getScoreCopy, scoreBand } from '../locales/score';
import {
  AdvancedSearchCategory,
  AdvancedSearchResponse,
  AdvancedSearchSortOption,
  AdvancedSearchUIState,
  advancedSearchService,
  DEFAULT_UI_STATE,
  extractFacetCounts,
  paramsToSearchParams,
  searchParamsToUIState,
  transformAdvancedSearchCard,
  uiStateToParams,
} from '../services/advancedSearch';
import type { BankApiResponse } from '../services/api';
import { fetchAllBanks } from '../services/banks';
import { saveSearch } from '../services/savedSearches';
import type { CardNetwork, CreditCard } from '../types';
import { cardPathFor } from '../utils/sitemap';

const DEFAULT_SORT_OPTIONS: AdvancedSearchSortOption[] = [
  {
    key: 'relevance',
    label: 'Relevance',
    description: 'Best match first (default with search query)',
  },
  {
    key: '-creditmate_score',
    label: 'CreditMate Score (Best First)',
    description: 'Sort by CreditMate Score descending',
  },
  { key: 'annual_fee', label: 'Annual Fee (Low to High)', description: 'Annual fee ascending' },
  { key: '-annual_fee', label: 'Annual Fee (High to Low)', description: 'Annual fee descending' },
  { key: 'interest_rate_apr', label: 'APR (Low to High)', description: 'APR ascending' },
  { key: '-interest_rate_apr', label: 'APR (High to Low)', description: 'APR descending' },
  {
    key: '-lounge_access_international',
    label: 'Lounge Access (Most First)',
    description: 'International lounge access descending',
  },
  { key: 'name', label: 'Name (A-Z)', description: 'Name ascending' },
  { key: '-name', label: 'Name (Z-A)', description: 'Name descending' },
  { key: '-created', label: 'Newest First', description: 'Creation date descending' },
  { key: 'created', label: 'Oldest First', description: 'Creation date ascending' },
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

const PAGE_SIZE = 20;

interface Relaxation {
  label: string;
  state: AdvancedSearchUIState;
}

const CardsDiscoveryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  const detail = getCardDetailCopy(lang);
  const common = getCommonCopy(lang);
  const scoreCopy = getScoreCopy(lang);
  const shellCopy = getShellCopy(lang);
  const { user } = useAuth();
  const shortlist = useShortlist();
  const { toast } = useToast();

  const [uiState, setUiState] = useState<AdvancedSearchUIState>(() => {
    const params = new URLSearchParams(location.search);
    const merged: AdvancedSearchUIState = {
      ...DEFAULT_UI_STATE,
      ...searchParamsToUIState(params),
      pageSize: PAGE_SIZE,
    };
    if (!params.has('ordering')) {
      merged.ordering = merged.search ? 'relevance' : '-creditmate_score';
    }
    return merged;
  });
  const [results, setResults] = useState<AdvancedSearchResponse | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOptions, setSortOptions] = useState<AdvancedSearchSortOption[]>(DEFAULT_SORT_OPTIONS);
  const [categories, setCategories] = useState<AdvancedSearchCategory[]>([]);
  const [allBanks, setAllBanks] = useState<BankApiResponse[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [zeroInfo, setZeroInfo] = useState<{
    best: Relaxation | null;
    bestTotal: number;
    nearMiss: number | null;
  } | null>(null);

  const lastWrittenQueryRef = useRef<string | null>(null);
  const lastLocationKeyRef = useRef(location.key);
  const zeroSignatureRef = useRef<string | null>(null);

  useSeoMeta({
    title: `${copy.cardsHeading} | CreditMate AI`,
    description: copy.cardsIntro,
    canonicalPath: '/cards',
  });

  // Restore state from the URL on real navigation (back/forward, redirects,
  // palette picks) — local edits own the state otherwise (old page pattern).
  useEffect(() => {
    if (lastLocationKeyRef.current === location.key) return;
    lastLocationKeyRef.current = location.key;
    const isOwnWrite =
      navigationType === 'REPLACE' && lastWrittenQueryRef.current === location.search;
    lastWrittenQueryRef.current = null;
    if (isOwnWrite) return;
    const params = new URLSearchParams(location.search);
    const merged: AdvancedSearchUIState = {
      ...DEFAULT_UI_STATE,
      ...searchParamsToUIState(params),
      pageSize: PAGE_SIZE,
    };
    if (!params.has('ordering')) {
      merged.ordering = merged.search ? 'relevance' : '-creditmate_score';
    }
    setUiState(merged);
  }, [location.key, location.search, navigationType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sortRes, catRes, banks] = await Promise.all([
          advancedSearchService.getSortOptions(),
          advancedSearchService.getCategories(),
          fetchAllBanks().catch(() => [] as BankApiResponse[]),
        ]);
        if (cancelled) return;
        if (sortRes.sort_options?.length) setSortOptions(sortRes.sort_options);
        setCategories(catRes.categories ?? []);
        setAllBanks(banks);
      } catch {
        // Metadata is progressive enhancement; defaults stay in place.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncToUrl = useCallback(
    (state: AdvancedSearchUIState) => {
      const searchParams = paramsToSearchParams(uiStateToParams(state));
      if (searchParams.get('page') === '1') searchParams.delete('page');
      const query = searchParams.toString();
      lastWrittenQueryRef.current = query ? `?${query}` : '';
      if (location.search !== lastWrittenQueryRef.current) {
        navigate({ search: lastWrittenQueryRef.current }, { replace: true });
      }
    },
    [navigate, location.search]
  );

  const executeSearch = useCallback(
    async (state: AdvancedSearchUIState) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await advancedSearchService.search(uiStateToParams(state));
        setResults(response);
        setCards(response.results.map(transformAdvancedSearchCard));
      } catch {
        // RATE_LIMITED and network failures share one honest error state.
        setError(copy.errorResults);
        setResults(null);
        setCards([]);
      } finally {
        setIsLoading(false);
      }
    },
    [copy.errorResults]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void executeSearch(uiState);
      syncToUrl(uiState);
    }, 300);
    return () => clearTimeout(timer);
  }, [uiState, executeSearch, syncToUrl]);

  const handleFilterChange = useCallback((updates: Partial<AdvancedSearchUIState>) => {
    const isPagination = Object.keys(updates).length === 1 && 'page' in updates;
    setUiState(prev => ({
      ...prev,
      ...updates,
      page: isPagination ? updates.page ?? prev.page : 1,
    }));
  }, []);

  const handleCategoryToggle = useCallback((slug: string) => {
    setUiState(prev => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter(s => s !== slug)
        : [...prev.categories, slug],
      page: 1,
    }));
  }, []);

  const facetCounts = useMemo(
    () => (results?.facets ? extractFacetCounts(results.facets) : {}),
    [results]
  );

  const bankNameById = useMemo(() => {
    const map = new Map<number, string>();
    allBanks.forEach(bank => map.set(bank.id, bank.name));
    return map;
  }, [allBanks]);

  const bankFilterEntries = useMemo(() => {
    const facet = results?.facets?.bank;
    if (!facet) {
      return allBanks.map(bank => ({ id: bank.id, name: bank.name, count: 0 }));
    }
    const byName = new Map(allBanks.map(bank => [bank.name, bank.id]));
    return facet.buckets
      .map(bucket => {
        const id = byName.get(bucket.key);
        return id ? { id, name: bucket.key, count: bucket.count ?? 0 } : null;
      })
      .filter((entry): entry is { id: number; name: string; count: number } => entry !== null);
  }, [results, allBanks]);

  const feeRangeOptions = results?.facets?.annual_fee_range?.buckets ?? [];
  const aprRangeOptions = results?.facets?.interest_rate_range?.buckets ?? [];

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        uiState.search ||
          uiState.featureSearch ||
          uiState.categories.length > 0 ||
          uiState.bankIds.length > 0 ||
          uiState.annualFeeMin !== '' ||
          uiState.annualFeeMax !== '' ||
          uiState.aprMin !== '' ||
          uiState.aprMax !== '' ||
          uiState.hasLoungeAccess ||
          uiState.hasInternationalLounge ||
          uiState.hasDomesticLounge ||
          uiState.hasAnnualFee ||
          uiState.noAnnualFee ||
          uiState.hasFeeWaiver ||
          uiState.cardNetworks.length > 0 ||
          uiState.isIslamic ||
          uiState.isDualCurrency ||
          uiState.maxMinMonthlyIncome !== ''
      ),
    [uiState]
  );

  /* Zero-results recovery: find the single relaxation that restores the
     most results, plus the unfiltered near-miss count. */
  useEffect(() => {
    if (!results || results.total !== 0 || isLoading || !hasActiveFilters) {
      if (results && results.total !== 0) setZeroInfo(null);
      return;
    }
    const signature = JSON.stringify(uiStateToParams(uiState));
    if (zeroSignatureRef.current === signature) return;
    zeroSignatureRef.current = signature;
    let cancelled = false;
    (async () => {
      const candidates: Relaxation[] = [];
      uiState.categories.forEach(slug => {
        const category = categories.find(c => c.slug === slug);
        candidates.push({
          label: category?.name ?? slug,
          state: { ...uiState, categories: uiState.categories.filter(s => s !== slug), page: 1 },
        });
      });
      if (uiState.bankIds.length > 0) {
        candidates.push({
          label: common.filterSectionBanks,
          state: { ...uiState, bankIds: [], page: 1 },
        });
      }
      if (uiState.annualFeeMin !== '' || uiState.annualFeeMax !== '') {
        candidates.push({
          label: common.filterSectionAnnualFee,
          state: { ...uiState, annualFeeMin: '', annualFeeMax: '', page: 1 },
        });
      }
      if (uiState.aprMin !== '' || uiState.aprMax !== '') {
        candidates.push({
          label: common.filterSectionInterestRate,
          state: { ...uiState, aprMin: '', aprMax: '', page: 1 },
        });
      }
      if (uiState.hasLoungeAccess || uiState.hasInternationalLounge || uiState.hasDomesticLounge) {
        candidates.push({
          label: common.filterSectionLoungeAccess,
          state: {
            ...uiState,
            hasLoungeAccess: false,
            hasInternationalLounge: false,
            hasDomesticLounge: false,
            page: 1,
          },
        });
      }
      if (uiState.hasAnnualFee || uiState.noAnnualFee || uiState.hasFeeWaiver) {
        candidates.push({
          label: common.filterSectionAnnualFeeOptions,
          state: {
            ...uiState,
            hasAnnualFee: false,
            noAnnualFee: false,
            hasFeeWaiver: false,
            page: 1,
          },
        });
      }
      if (uiState.cardNetworks.length > 0) {
        candidates.push({
          label: common.filterSectionCardNetwork,
          state: { ...uiState, cardNetworks: [], page: 1 },
        });
      }
      if (uiState.isIslamic || uiState.isDualCurrency) {
        candidates.push({
          label: common.filterSectionCardType,
          state: { ...uiState, isIslamic: false, isDualCurrency: false, page: 1 },
        });
      }
      if (uiState.maxMinMonthlyIncome !== '') {
        candidates.push({
          label: common.filterSectionIncome,
          state: { ...uiState, maxMinMonthlyIncome: '', page: 1 },
        });
      }
      const totals = await Promise.all(
        candidates.map(async candidate => {
          try {
            const response = await advancedSearchService.search(
              uiStateToParams({ ...candidate.state, pageSize: 1 })
            );
            return response.total;
          } catch {
            return 0;
          }
        })
      );
      let nearMiss: number | null = null;
      try {
        const base = await advancedSearchService.search(
          uiStateToParams({
            ...DEFAULT_UI_STATE,
            search: uiState.search,
            pageSize: 1,
            facets: DEFAULT_UI_STATE.facets,
          })
        );
        nearMiss = base.total;
      } catch {
        nearMiss = null;
      }
      if (cancelled) return;
      let best: Relaxation | null = null;
      let bestTotal = 0;
      totals.forEach((total, index) => {
        if (total > bestTotal) {
          bestTotal = total;
          best = candidates[index];
        }
      });
      setZeroInfo({ best, bestTotal, nearMiss });
    })();
    return () => {
      cancelled = true;
    };
  }, [results, isLoading, hasActiveFilters, uiState, categories, common]);

  const chips = useMemo(() => {
    const list: Array<{ key: string; label: string }> = [];
    if (uiState.search) list.push({ key: 'search', label: `"${uiState.search}"` });
    uiState.categories.forEach(slug => {
      const category = categories.find(c => c.slug === slug);
      list.push({ key: `category:${slug}`, label: category?.name ?? slug });
    });
    if (uiState.bankIds.length > 0) {
      list.push({
        key: 'banks',
        label: `${common.filterSectionBanks}: ${uiState.bankIds
          .map(id => bankNameById.get(id) ?? String(id))
          .join(', ')}`,
      });
    }
    if (uiState.annualFeeMin !== '' || uiState.annualFeeMax !== '') {
      list.push({
        key: 'fee',
        label: `${common.filterSectionAnnualFee}: ${uiState.annualFeeMin || '0'} – ${
          uiState.annualFeeMax || '∞'
        }`,
      });
    }
    if (uiState.aprMin !== '' || uiState.aprMax !== '') {
      list.push({
        key: 'apr',
        label: `${common.filterSectionInterestRate}: ${uiState.aprMin || '0'}% – ${
          uiState.aprMax || '∞'
        }%`,
      });
    }
    if (uiState.hasLoungeAccess || uiState.hasInternationalLounge || uiState.hasDomesticLounge) {
      list.push({ key: 'lounge', label: common.filterSectionLoungeAccess });
    }
    if (uiState.hasAnnualFee || uiState.noAnnualFee || uiState.hasFeeWaiver) {
      list.push({ key: 'feeOptions', label: common.filterSectionAnnualFeeOptions });
    }
    uiState.cardNetworks.forEach(network => {
      list.push({
        key: `network:${network}`,
        label: getNetworkLabel(detail, network) ?? network,
      });
    });
    if (uiState.isIslamic) list.push({ key: 'islamic', label: common.filterLabelIslamic });
    if (uiState.isDualCurrency) {
      list.push({ key: 'dual', label: common.filterLabelDualCurrency });
    }
    if (uiState.maxMinMonthlyIncome !== '') {
      list.push({
        key: 'income',
        label: `${common.filterLabelMonthlyIncome}: ${uiState.maxMinMonthlyIncome}`,
      });
    }
    if (uiState.featureSearch) {
      list.push({ key: 'features', label: `"${uiState.featureSearch}"` });
    }
    return list;
  }, [uiState, categories, bankNameById, common, detail]);

  const removeChip = useCallback(
    (key: string) => {
      if (key === 'search') handleFilterChange({ search: '' });
      else if (key.startsWith('category:')) handleCategoryToggle(key.slice('category:'.length));
      else if (key === 'banks') handleFilterChange({ bankIds: [] });
      else if (key === 'fee') handleFilterChange({ annualFeeMin: '', annualFeeMax: '' });
      else if (key === 'apr') handleFilterChange({ aprMin: '', aprMax: '' });
      else if (key === 'lounge') {
        handleFilterChange({
          hasLoungeAccess: false,
          hasInternationalLounge: false,
          hasDomesticLounge: false,
        });
      } else if (key === 'feeOptions') {
        handleFilterChange({ hasAnnualFee: false, noAnnualFee: false, hasFeeWaiver: false });
      } else if (key.startsWith('network:')) {
        const network = key.slice('network:'.length);
        handleFilterChange({
          cardNetworks: uiState.cardNetworks.filter(n => n !== network),
        });
      } else if (key === 'islamic') handleFilterChange({ isIslamic: false });
      else if (key === 'dual') handleFilterChange({ isDualCurrency: false });
      else if (key === 'income') handleFilterChange({ maxMinMonthlyIncome: '' });
      else if (key === 'features') handleFilterChange({ featureSearch: '' });
    },
    [handleFilterChange, handleCategoryToggle, uiState.cardNetworks]
  );

  const clearAll = useCallback(() => {
    setUiState({ ...DEFAULT_UI_STATE, pageSize: PAGE_SIZE, ordering: '-creditmate_score' });
  }, []);

  const handleToggleShortlist = useCallback(
    (card: CreditCard) => {
      const detailHref = cardPathFor(card.bankName ?? '', card.name) ?? '/cards';
      const result = shortlist.toggle({
        vertical: 'cards',
        key: String(card.id),
        cardId: card.id,
        name: card.name,
        bankName: card.bankName ?? '',
        detailHref,
      });
      if (result === 'full') {
        toast({ message: fillCopy(shellCopy.shortlistFull, { count: '4' }), variant: 'warning' });
      } else if (result === 'added') {
        toast({ message: fillCopy(shellCopy.shortlistAdded, { name: card.name }) });
      } else {
        toast({ message: fillCopy(shellCopy.shortlistRemoved, { name: card.name }) });
      }
    },
    [shortlist, toast, shellCopy]
  );

  const handleSaveSearch = useCallback(
    (name: string) => {
      setSaveOpen(false);
      const query = location.search.replace(/^\?/, '');
      try {
        saveSearch(user?.id ?? null, { name, path: '/cards', query });
        toast({ message: copy.searchSaved });
      } catch {
        toast({ message: copy.searchSaveFailed, variant: 'error' });
      }
    },
    [location.search, user?.id, toast, copy]
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ message: copy.linkCopied });
    } catch {
      toast({ message: copy.searchSaveFailed, variant: 'error' });
    }
  }, [toast, copy]);

  const sortCriterion =
    sortOptions.find(option => option.key === uiState.ordering)?.label ?? uiState.ordering;
  const pageCount = results ? Math.max(1, Math.ceil(results.total / PAGE_SIZE)) : 1;
  const bestRelaxation = zeroInfo?.best ?? null;

  const filters = (
    <>
      <fieldset className="cm-filter-group">
        <legend>{copy.categoryHeading}</legend>
        <div className="cm-filter-options">
          {categories.map(category => (
            <div key={category.slug} className="cm-filter-option">
              <Checkbox
                label={category.name}
                checked={uiState.categories.includes(category.slug)}
                onChange={() => handleCategoryToggle(category.slug)}
              />
              <span className="cm-filter-option-count">
                {facetCounts[`category:${category.slug}`] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </fieldset>

      <BankFilter
        banks={bankFilterEntries}
        selected={uiState.bankIds}
        onToggle={id =>
          handleFilterChange({
            bankIds: uiState.bankIds.includes(id)
              ? uiState.bankIds.filter(b => b !== id)
              : [...uiState.bankIds, id],
          })
        }
      />

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionAnnualFee}</legend>
        <div className="cm-filter-range">
          <Input
            label={common.filterLabelMinAnnualFee}
            type="number"
            min={0}
            value={uiState.annualFeeMin}
            onChange={event =>
              handleFilterChange({
                annualFeeMin: event.target.value === '' ? '' : Number(event.target.value),
              })
            }
          />
          <Input
            label={common.filterLabelMaxAnnualFee}
            type="number"
            min={0}
            value={uiState.annualFeeMax}
            onChange={event =>
              handleFilterChange({
                annualFeeMax: event.target.value === '' ? '' : Number(event.target.value),
              })
            }
          />
        </div>
        <div className="cm-filter-options">
          {feeRangeOptions.map(option => (
            <Button
              key={option.key}
              variant="ghost"
              size="sm"
              onClick={() =>
                handleFilterChange({
                  annualFeeMin: option.from ?? '',
                  annualFeeMax: option.to ?? '',
                })
              }
            >
              {option.label} ({option.count ?? 0})
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionInterestRate}</legend>
        <div className="cm-filter-range">
          <Input
            label={common.filterLabelMinInterestRate}
            type="number"
            min={0}
            step="0.1"
            value={uiState.aprMin}
            onChange={event =>
              handleFilterChange({
                aprMin: event.target.value === '' ? '' : Number(event.target.value),
              })
            }
          />
          <Input
            label={common.filterLabelMaxInterestRate}
            type="number"
            min={0}
            step="0.1"
            value={uiState.aprMax}
            onChange={event =>
              handleFilterChange({
                aprMax: event.target.value === '' ? '' : Number(event.target.value),
              })
            }
          />
        </div>
        <div className="cm-filter-options">
          {aprRangeOptions.map(option => (
            <Button
              key={option.key}
              variant="ghost"
              size="sm"
              onClick={() =>
                handleFilterChange({ aprMin: option.from ?? '', aprMax: option.to ?? '' })
              }
            >
              {option.label} ({option.count ?? 0})
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionLoungeAccess}</legend>
        <div className="cm-filter-options">
          <div className="cm-filter-option">
            <Checkbox
              label={common.filterLabelHasLoungeAccess}
              checked={uiState.hasLoungeAccess}
              onChange={event => handleFilterChange({ hasLoungeAccess: event.target.checked })}
            />
            <span className="cm-filter-option-count">{facetCounts['lounge_access:any'] ?? ''}</span>
          </div>
          <div className="cm-filter-option">
            <Checkbox
              label={common.filterLabelHasInternationalLounge}
              checked={uiState.hasInternationalLounge}
              onChange={event =>
                handleFilterChange({ hasInternationalLounge: event.target.checked })
              }
            />
            <span className="cm-filter-option-count">
              {facetCounts['lounge_access:international'] ?? ''}
            </span>
          </div>
          <div className="cm-filter-option">
            <Checkbox
              label={common.filterLabelHasDomesticLounge}
              checked={uiState.hasDomesticLounge}
              onChange={event => handleFilterChange({ hasDomesticLounge: event.target.checked })}
            />
            <span className="cm-filter-option-count">
              {facetCounts['lounge_access:domestic'] ?? ''}
            </span>
          </div>
        </div>
      </fieldset>

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionAnnualFeeOptions}</legend>
        <div className="cm-filter-options">
          <Checkbox
            label={common.filterLabelHasAnnualFee}
            checked={uiState.hasAnnualFee}
            onChange={event =>
              handleFilterChange({ hasAnnualFee: event.target.checked, noAnnualFee: false })
            }
          />
          <Checkbox
            label={detail.noAnnualFee}
            checked={uiState.noAnnualFee}
            onChange={event =>
              handleFilterChange({ noAnnualFee: event.target.checked, hasAnnualFee: false })
            }
          />
          <div className="cm-filter-option">
            <Checkbox
              label={common.filterLabelHasFeeWaiver}
              checked={uiState.hasFeeWaiver}
              onChange={event => handleFilterChange({ hasFeeWaiver: event.target.checked })}
            />
            <span className="cm-filter-option-count">{facetCounts['fee_waiver:true'] ?? ''}</span>
          </div>
        </div>
      </fieldset>

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionCardNetwork}</legend>
        <div className="cm-filter-options">
          {CARD_NETWORKS.map(network => (
            <div key={network} className="cm-filter-option">
              <Checkbox
                label={getNetworkLabel(detail, network) ?? network}
                checked={uiState.cardNetworks.includes(network)}
                onChange={() =>
                  handleFilterChange({
                    cardNetworks: uiState.cardNetworks.includes(network)
                      ? uiState.cardNetworks.filter(n => n !== network)
                      : [...uiState.cardNetworks, network],
                  })
                }
              />
              <span className="cm-filter-option-count">
                {facetCounts[`card_network:${network}`] ?? ''}
              </span>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionCardType}</legend>
        <div className="cm-filter-options">
          <div className="cm-filter-option">
            <Checkbox
              label={common.filterLabelIslamic}
              checked={uiState.isIslamic}
              onChange={event => handleFilterChange({ isIslamic: event.target.checked })}
            />
            <span className="cm-filter-option-count">{facetCounts['is_islamic:true'] ?? ''}</span>
          </div>
          <div className="cm-filter-option">
            <Checkbox
              label={common.filterLabelDualCurrency}
              checked={uiState.isDualCurrency}
              onChange={event => handleFilterChange({ isDualCurrency: event.target.checked })}
            />
            <span className="cm-filter-option-count">
              {facetCounts['is_dual_currency:true'] ?? ''}
            </span>
          </div>
        </div>
      </fieldset>

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionIncome}</legend>
        <Input
          label={common.filterLabelMonthlyIncome}
          type="number"
          min={0}
          value={uiState.maxMinMonthlyIncome}
          onChange={event =>
            handleFilterChange({
              maxMinMonthlyIncome: event.target.value === '' ? '' : Number(event.target.value),
            })
          }
        />
        <div className="cm-filter-options">
          <Checkbox
            label={common.filterLabelIncludeUnknownIncome}
            checked={uiState.includeUnknownIncome}
            onChange={event => handleFilterChange({ includeUnknownIncome: event.target.checked })}
          />
        </div>
      </fieldset>

      <fieldset className="cm-filter-group">
        <legend>{common.filterSectionFeatures}</legend>
        <Input
          label={copy.featureSearchLabel}
          type="text"
          value={uiState.featureSearch}
          placeholder={copy.featureSearchPlaceholder}
          onChange={event => handleFilterChange({ featureSearch: event.target.value })}
        />
      </fieldset>
    </>
  );

  return (
    <div className="cards-discovery-page">
      <h1>{copy.cardsHeading}</h1>
      <p className="cm-discovery-note">{copy.cardsIntro}</p>

      <div className="cm-discovery-searchrow">
        <div className="cm-discovery-search">
          <Input
            label={copy.cardSearchLabel}
            type="search"
            value={uiState.search}
            placeholder={copy.cardSearchPlaceholder}
            onChange={event => handleFilterChange({ search: event.target.value })}
          />
        </div>
        <Button variant="ghost" onClick={() => setSaveOpen(true)}>
          {copy.saveSearch}
        </Button>
        <Button variant="ghost" onClick={() => void handleCopyLink()}>
          {copy.copyLink}
        </Button>
      </div>

      <DiscoveryLayout filters={filters} resultCount={results?.total ?? null}>
        <ResultHeader
          count={results?.total ?? null}
          sortValue={uiState.ordering}
          sortOptions={sortOptions.map(option => ({ value: option.key, label: option.label }))}
          sortCriterionLabel={sortCriterion}
          onSortChange={ordering => handleFilterChange({ ordering })}
        />
        <FilterChips chips={chips} onRemove={removeChip} onClearAll={clearAll} />

        {isLoading && !results ? <DiscoverySkeleton /> : null}
        {error && !isLoading ? (
          <DiscoveryError message={error} onRetry={() => void executeSearch(uiState)} />
        ) : null}

        {results && results.total === 0 && !isLoading ? (
          <ZeroResults
            eliminatedByLabel={bestRelaxation?.label ?? null}
            onRelax={bestRelaxation ? () => setUiState(bestRelaxation.state) : null}
            nearMissCount={zeroInfo?.nearMiss ?? null}
            onResetAll={clearAll}
          />
        ) : null}

        {results && results.total > 0 ? (
          <>
            <div className="cm-discovery-list">
              {cards.map(card => {
                const detailHref = cardPathFor(card.bankName ?? '', card.name) ?? '/cards';
                const score = card.creditmateScore;
                return (
                  <ResultCard
                    key={card.id}
                    bankName={card.bankName ?? ''}
                    productName={card.name}
                    detailHref={detailHref}
                    heroValue={
                      score !== null && score !== undefined ? (
                        score.toFixed(1)
                      ) : (
                        <UnknownValue kind="not-published" />
                      )
                    }
                    heroLabel={scoreCopy.badgeLabel}
                    supportingFacts={[
                      {
                        label: detail.annualFee,
                        value:
                          card.annualFee !== null && card.annualFee !== undefined ? (
                            <Money value={card.annualFee} />
                          ) : (
                            <UnknownValue kind="not-published" />
                          ),
                      },
                      {
                        label: detail.apr,
                        value:
                          card.interestRateApr !== null && card.interestRateApr !== undefined ? (
                            `${card.interestRateApr}%`
                          ) : (
                            <UnknownValue kind="not-published" />
                          ),
                      },
                      {
                        label: common.filterLabelMonthlyIncome,
                        value:
                          card.minMonthlyIncome !== null && card.minMonthlyIncome !== undefined ? (
                            <Money value={card.minMonthlyIncome} />
                          ) : (
                            <UnknownValue kind="not-published" />
                          ),
                      },
                    ]}
                    badges={
                      <>
                        {score !== null && score !== undefined ? (
                          <Badge variant="primary">
                            {scoreCopy.bands[scoreBand(score)]} ·{' '}
                            {fillCopy(scoreCopy.pointsOf, {
                              points: score.toFixed(1),
                              max: '10',
                            })}
                          </Badge>
                        ) : null}
                        {card.cardNetwork ? (
                          <Badge>
                            {getNetworkLabel(detail, card.cardNetwork) ?? card.cardNetwork}
                          </Badge>
                        ) : null}
                      </>
                    }
                    trustChip={
                      card.sourceUrl && card.verifiedAt ? (
                        <TrustChip
                          source={detail.sourceScheduleOfCharges}
                          dateLabel={new Date(card.verifiedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        />
                      ) : undefined
                    }
                    islamic={Boolean(card.isIslamic)}
                    inShortlist={shortlist.isInShortlist('cards', String(card.id))}
                    onToggleShortlist={() => handleToggleShortlist(card)}
                  >
                    <dl className="cm-card-facts">
                      <div>
                        <dt>{common.filterLabelHasInternationalLounge}</dt>
                        <dd>
                          {card.loungeAccessInternational ?? <UnknownValue kind="not-published" />}
                        </dd>
                      </div>
                      <div>
                        <dt>{common.filterLabelHasDomesticLounge}</dt>
                        <dd>
                          {card.loungeAccessDomestic ?? <UnknownValue kind="not-published" />}
                        </dd>
                      </div>
                      {card.rewardProgramName ? (
                        <div>
                          <dt>{scoreCopy.componentLabels.rewards}</dt>
                          <dd>{card.rewardProgramName}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <p className="cm-discovery-note">
                      <Link to="/methodology">{scoreCopy.methodologyLink}</Link>
                    </p>
                  </ResultCard>
                );
              })}
            </div>
            {pageCount > 1 ? (
              <div className="cm-discovery-pagination">
                <Pagination
                  page={uiState.page}
                  pageCount={pageCount}
                  onChange={page => handleFilterChange({ page })}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </DiscoveryLayout>

      <PromptDialog
        open={saveOpen}
        title={copy.saveSearch}
        label={copy.saveSearchNameLabel}
        initialValue={uiState.search || copy.cardsHeading}
        submitLabel={copy.saveSearch}
        onSubmit={handleSaveSearch}
        onCancel={() => setSaveOpen(false)}
      />
    </div>
  );
};

export default CardsDiscoveryPage;
