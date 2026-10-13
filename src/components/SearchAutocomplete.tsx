import React, { useState, useEffect, useRef, useId, useMemo } from 'react';

import { useLanguage, getCommonCopy } from '../locales';
import { apiService } from '../services/api';
import {
  TypeaheadResult,
  TypeaheadCardSuggestion,
  TypeaheadBankSuggestion,
  TypeaheadCategorySuggestion,
  TypeaheadFacet,
  highlightParts,
  parseTypeaheadResponse,
} from '../services/typeahead';
import './SearchAutocomplete.css';

export type AutocompleteSelection =
  | { kind: 'card'; id: number; name: string }
  | { kind: 'bank'; id: number; name: string }
  | { kind: 'category'; slug: string; name: string };

export interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onSelectCard?: (suggestion: TypeaheadCardSuggestion) => void;
  onSelectBank?: (suggestion: TypeaheadBankSuggestion) => void;
  onSelectCategory?: (suggestion: TypeaheadCategorySuggestion) => void;
  onSelectFacet?: (facet: TypeaheadFacet) => void;
  placeholder?: string;
  debounceMs?: number;
  minQueryLength?: number;
  ariaLabel?: string;
}

interface FlattenedOption {
  key: string;
  kind: 'card' | 'bank' | 'category';
  label: string;
  selection: AutocompleteSelection;
  index?: number;
}

interface SuggestionGroup {
  key: string;
  label: string;
  items: FlattenedOption[];
}

const renderHighlighted = (text: string, query: string): React.ReactNode => {
  const parts = highlightParts(text, query);
  const elements: JSX.Element[] = [];
  parts.forEach((part, idx) => {
    if (part.matched) {
      elements.push(<mark key={idx}>{part.text}</mark>);
    } else {
      elements.push(<span key={idx}>{part.text}</span>);
    }
  });
  return elements;
};

const buildFlatOptions = (result: TypeaheadResult | null): FlattenedOption[] => {
  if (!result) return [];

  const cards = result.cards.map((c, idx) => ({
    key: `card-${c.id}`,
    kind: 'card' as const,
    label: c.name,
    selection: { kind: 'card' as const, id: c.id, name: c.name },
    index: idx,
  }));

  const banks = result.banks.map((b, idx) => ({
    key: `bank-${b.id}`,
    kind: 'bank' as const,
    label: b.name,
    selection: { kind: 'bank' as const, id: b.id, name: b.name },
    index: idx,
  }));

  const categories = result.categories.map((c, idx) => ({
    key: `category-${c.slug}`,
    kind: 'category' as const,
    label: c.name,
    selection: { kind: 'category' as const, slug: c.slug, name: c.name },
    index: idx,
  }));

  return [...cards, ...banks, ...categories];
};

const buildGroups = (
  result: TypeaheadResult | null,
  commonCopy: ReturnType<typeof getCommonCopy>
): SuggestionGroup[] => {
  if (!result) return [];

  const groups: SuggestionGroup[] = [];

  if (result.cards?.length > 0) {
    groups.push({
      key: 'cards',
      label: commonCopy.searchGroupCards,
      items: result.cards.map((c, idx) => ({
        key: `card-${c.id}`,
        kind: 'card' as const,
        label: c.name,
        selection: { kind: 'card' as const, id: c.id, name: c.name },
        index: idx,
      })),
    });
  }

  if (result.banks?.length > 0) {
    groups.push({
      key: 'banks',
      label: commonCopy.searchGroupBanks,
      items: result.banks.map((b, idx) => ({
        key: `bank-${b.id}`,
        kind: 'bank' as const,
        label: b.name,
        selection: { kind: 'bank' as const, id: b.id, name: b.name },
        index: idx,
      })),
    });
  }

  if (result.categories?.length > 0) {
    groups.push({
      key: 'categories',
      label: commonCopy.searchGroupCategories,
      items: result.categories.map((c, idx) => ({
        key: `category-${c.slug}`,
        kind: 'category' as const,
        label: c.name,
        selection: { kind: 'category' as const, slug: c.slug, name: c.name },
        index: idx,
      })),
    });
  }

  return groups;
};

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  onSearch,
  onSelectCard,
  onSelectBank,
  onSelectCategory,
  onSelectFacet,
  placeholder,
  debounceMs = 150,
  minQueryLength = 2,
  ariaLabel = 'Search',
}) => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const [result, setResult] = useState<TypeaheadResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const listboxId = useId();

  // Debounced fetch
  useEffect(() => {
    const query = value.trim();
    if (query.length < minQueryLength) {
      setResult(null);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    requestIdRef.current += 1;
    const newRequestId = requestIdRef.current;
    const timeoutId = setTimeout(async () => {
      if (requestIdRef.current !== newRequestId) return;
      setIsLoading(true);
      try {
        const response = await apiService.getTypeaheadSuggestions(query);
        if (requestIdRef.current !== newRequestId) return;
        const parsed = parseTypeaheadResponse(response, query);
        setResult(parsed);
        setIsOpen(true);
        setActiveIndex(0);
      } catch {
        if (requestIdRef.current === newRequestId) {
          setResult(null);
          setIsOpen(false);
          setActiveIndex(-1);
        }
      } finally {
        if (requestIdRef.current === newRequestId) setIsLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [value, debounceMs, minQueryLength, onSearch]);

  // Keyboard handling - using a regular function reference to avoid useCallback deps issues
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isOpen) {
        setIsOpen(false);
        setActiveIndex(-1);
      } else {
        onChange('');
        onSearch('');
      }
      return;
    }

    if (!isOpen || activeIndex < 0) return;

    const totalCards = result?.cards?.length ?? 0;
    const totalBanks = result?.banks?.length ?? 0;
    const totalCategories = result?.categories?.length ?? 0;
    const total = totalCards + totalBanks + totalCategories;
    if (total === 0) return;

    let nextIndex: number;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (activeIndex + 1) % total;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = activeIndex <= 0 ? total - 1 : activeIndex - 1;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const options = buildFlatOptions(result);
      if (activeIndex >= 0 && activeIndex < options.length) {
        selectOption(options[activeIndex]);
      }
      return;
    } else {
      return;
    }

    setActiveIndex(nextIndex);
  };

  // Option selection
  const selectOption = (option: FlattenedOption) => {
    onChange(option.label);
    setIsOpen(false);
    setActiveIndex(-1);

    switch (option.kind) {
      case 'card':
        onSelectCard?.(option.selection as TypeaheadCardSuggestion);
        break;
      case 'bank':
        onSelectBank?.(option.selection as TypeaheadBankSuggestion);
        break;
      case 'category':
        onSelectCategory?.(option.selection as TypeaheadCategorySuggestion);
        break;
    }
  };

  // Derived values
  const options = useMemo(() => buildFlatOptions(result), [result]);
  const groups = useMemo(() => buildGroups(result, common), [result, common]);
  const totalOptions = options.length;
  const showDropdown = isOpen && totalOptions > 0;
  const hasFacets = (result?.facets?.length ?? 0) > 0;
  const hasDidYouMean = (result?.didYouMean?.length ?? 0) > 0;

  // Blur handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let blurTimeout: NodeJS.Timeout;
    const handleBlur = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node) {
        const relatedIsDropdown = container.contains(e.relatedTarget as Node);
        const isInput =
          e.relatedTarget === inputRef.current ||
          (e.relatedTarget as Node).parentNode?.contains(inputRef.current as Node) === true;
        if (relatedIsDropdown || isInput) return;
      }
      blurTimeout = setTimeout(() => {
        setIsOpen(false);
        setActiveIndex(-1);
      }, 100);
    };
    const handleMousedown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        target instanceof HTMLElement &&
        target.closest('.search-autocomplete-option') &&
        target.closest('.search-autocomplete-listbox')
      ) {
        e.preventDefault();
      }
    };
    container.addEventListener('blur', handleBlur, true);
    container.addEventListener('mousedown', handleMousedown, true);
    return () => {
      container.removeEventListener('blur', handleBlur, true);
      container.removeEventListener('mousedown', handleMousedown, true);
      clearTimeout(blurTimeout);
    };
  }, []);

  // Focus handling
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleFocus = () => {
      const q = value.trim();
      if (q.length >= minQueryLength && result !== null) {
        setIsOpen(true);
        setActiveIndex(0);
      }
    };
    input.addEventListener('focus', handleFocus);
    return () => {
      input.removeEventListener('focus', handleFocus);
    };
  }, [value, minQueryLength, result]);

  // Render
  const ariaLabelForCombobox = `${ariaLabel}, ${common.searchSuggestionsAriaLabel}`;

  return (
    <div className="search-autocomplete" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="search-autocomplete-input"
        placeholder={placeholder ?? common.searchPlaceholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          const q = value.trim();
          if (q.length >= minQueryLength && result !== null) {
            setIsOpen(true);
            setActiveIndex(0);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={
          activeIndex >= 0 && activeIndex < options.length
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        aria-label={ariaLabelForCombobox}
        autoComplete="off"
        spellCheck={false}
      />

      {showDropdown && (
        <ul
          className="search-autocomplete-listbox"
          role="listbox"
          aria-label={common.searchSuggestionsAriaLabel}
          aria-labelledby={`${listboxId}-label`}
          id={listboxId}
        >
          {groups.map(
            group =>
              group.items.length > 0 && (
                <li
                  key={group.key}
                  role="group"
                  aria-label={group.label}
                  className="search-autocomplete-group"
                >
                  <span className="search-autocomplete-group-label" id={`${group.key}-label`}>
                    {group.label}
                  </span>
                  <div role="presentation">
                    {group.items.map((item, i) => (
                      <div
                        key={item.key}
                        role="option"
                        id={`${listboxId}-option-${i}`}
                        aria-selected={activeIndex === i}
                        className="search-autocomplete-option"
                        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          selectOption(item);
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <span className="search-autocomplete-item-text">
                          {renderHighlighted(item.label, value)}
                        </span>
                        {item.kind === 'card' &&
                        'bankName' in item.selection &&
                        item.selection.bankName ? (
                          <span className="search-autocomplete-item-meta">
                            {common.searchByMeta} {item.selection.bankName}
                          </span>
                        ) : null}
                        {item.kind === 'category' && 'slug' in item.selection ? (
                          <span className="search-autocomplete-item-meta">
                            (
                            {item.selection.slug === 'no-annual-fee'
                              ? common.searchCategoryNoFee
                              : ''}
                            )
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </li>
              )
          )}

          {isLoading && (
            <li role="option" aria-selected={false} className="search-autocomplete-status">
              {common.searchLoading}
            </li>
          )}

          {!isLoading && totalOptions === 0 && (
            <li role="option" aria-selected={false} className="search-autocomplete-status">
              {common.searchNoSuggestions}
            </li>
          )}
        </ul>
      )}

      {hasFacets && (
        <div className="search-autocomplete-facets" role="group" aria-label="Filters">
          {result?.facets?.map(facet => (
            <button
              key={facet.slug}
              type="button"
              className="search-autocomplete-facet"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onSelectFacet?.(facet);
                onChange(facet.label);
                setIsOpen(false);
                setActiveIndex(-1);
              }}
            >
              {facet.label} <span aria-hidden="true">({facet.count})</span>
            </button>
          ))}
        </div>
      )}

      {hasDidYouMean && (
        <div className="search-autocomplete-did-you-mean">
          <span>{common.searchDidYouMean}</span>
          <button
            type="button"
            className="search-autocomplete-did-you-mean-button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              if (result?.didYouMean) {
                onChange(result.didYouMean);
                onSearch(result.didYouMean);
                setIsOpen(false);
                setActiveIndex(-1);
              }
            }}
          >
            {result?.didYouMean}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
