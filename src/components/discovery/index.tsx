/**
 * Shared pieces of the canonical discovery pattern (plan Section 4.2):
 * filter rail / mobile drawer with a live result count, result header with
 * the sort criterion always labelled, active-filter chips, a searchable
 * bank filter with counts, consistent loading/error states, and the
 * zero-results recovery block.
 */

import React, { useId, useMemo, useState } from 'react';

import { fillCopy, getDiscoveryCopy, useLanguage } from '../../locales';
import { Alert, Button, Checkbox, Input, Select } from '../ui';

import './Discovery.css';

/* ---------------- Filter layout with mobile drawer ---------------- */

export interface DiscoveryLayoutProps {
  filters: React.ReactNode;
  resultCount: number | null;
  children: React.ReactNode;
}

export const DiscoveryLayout: React.FC<DiscoveryLayoutProps> = ({
  filters,
  resultCount,
  children,
}) => {
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titleId = useId();

  return (
    <div className="cm-discovery">
      <div className="cm-discovery-filterbar">
        <button
          type="button"
          className="cm-discovery-filter-button"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          {copy.filtersButton}
          {resultCount !== null
            ? ` · ${fillCopy(copy.resultsCount, { count: String(resultCount) })}`
            : ''}
        </button>
      </div>
      {drawerOpen ? (
        <button
          type="button"
          className="cm-discovery-filters-backdrop"
          aria-label={copy.drawerClose}
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}
      <aside
        className={drawerOpen ? 'cm-discovery-filters is-open' : 'cm-discovery-filters'}
        aria-labelledby={titleId}
      >
        <div className="cm-discovery-filters-head">
          <h2 id={titleId} className="cm-discovery-filters-title">
            {copy.filtersHeading}
          </h2>
          <button
            type="button"
            className="cm-discovery-filters-close"
            aria-label={copy.drawerClose}
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        {filters}
        <div className="cm-discovery-filters-apply">
          <Button variant="primary" onClick={() => setDrawerOpen(false)}>
            {resultCount !== null
              ? fillCopy(copy.filtersShowResults, { count: String(resultCount) })
              : copy.filtersButton}
          </Button>
        </div>
      </aside>
      <section className="cm-discovery-results">{children}</section>
    </div>
  );
};

/* ---------------- Result header: count + labelled sort ---------------- */

export interface SortOption {
  value: string;
  label: string;
}

export interface ResultHeaderProps {
  count: number | null;
  sortValue: string;
  sortOptions: SortOption[];
  sortCriterionLabel: string;
  onSortChange: (value: string) => void;
}

export const ResultHeader: React.FC<ResultHeaderProps> = ({
  count,
  sortValue,
  sortOptions,
  sortCriterionLabel,
  onSortChange,
}) => {
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  return (
    <div className="cm-discovery-head">
      <p className="cm-discovery-count" role="status">
        {count === null ? '…' : fillCopy(copy.resultsCount, { count: String(count) })}
      </p>
      <div className="cm-discovery-sort">
        <Select
          label={copy.sortLabel}
          value={sortValue}
          onChange={event => onSortChange(event.target.value)}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <p className="cm-discovery-sortedby">
          {fillCopy(copy.sortedBy, { criterion: sortCriterionLabel })}
        </p>
      </div>
    </div>
  );
};

/* ---------------- Active filter chips ---------------- */

export interface FilterChip {
  key: string;
  label: string;
}

export interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ chips, onRemove, onClearAll }) => {
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  if (chips.length === 0) return null;
  return (
    <div className="cm-discovery-chips" aria-label={copy.activeFiltersLabel}>
      {chips.map(chip => (
        <button
          key={chip.key}
          type="button"
          className="cm-discovery-chip"
          aria-label={fillCopy(copy.removeFilter, { label: chip.label })}
          onClick={() => onRemove(chip.key)}
        >
          {chip.label} ×
        </button>
      ))}
      <button type="button" className="cm-discovery-clear" onClick={onClearAll}>
        {copy.clearAll}
      </button>
    </div>
  );
};

/* ---------------- Searchable bank filter with counts ---------------- */

export interface BankFilterEntry {
  id: number;
  name: string;
  count: number;
}

export interface BankFilterProps {
  banks: BankFilterEntry[];
  selected: number[];
  onToggle: (id: number) => void;
}

export const BankFilter: React.FC<BankFilterProps> = ({ banks, selected, onToggle }) => {
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(bank => bank.name.toLowerCase().includes(q));
  }, [banks, query]);

  return (
    <fieldset className="cm-filter-group">
      <legend>{copy.bankFilterHeading}</legend>
      <div className="cm-bankfilter-search">
        <Input
          label={copy.bankSearchLabel}
          type="search"
          value={query}
          placeholder={copy.bankFilterSearchPlaceholder}
          onChange={event => setQuery(event.target.value)}
        />
      </div>
      <div className="cm-bankfilter-list">
        {visible.length === 0 ? (
          <p className="cm-discovery-note">{copy.bankFilterNoMatch}</p>
        ) : null}
        {visible.map(bank => (
          <div key={bank.id} className="cm-filter-option">
            <Checkbox
              label={bank.name}
              checked={selected.includes(bank.id)}
              onChange={() => onToggle(bank.id)}
            />
            <span className="cm-filter-option-count">{bank.count}</span>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

/* ---------------- States ---------------- */

export const DiscoverySkeleton: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  return (
    <div className="cm-discovery-list" aria-busy="true" aria-label={copy.loadingResults}>
      {[0, 1, 2].map(index => (
        <div key={index} className="cm-skeleton-card" aria-hidden="true">
          <div className="cm-skeleton-line is-wide" />
          <div className="cm-skeleton-line is-hero" />
          <div className="cm-skeleton-line" />
          <div className="cm-skeleton-line" />
        </div>
      ))}
    </div>
  );
};

export interface DiscoveryErrorProps {
  message: string;
  onRetry: () => void;
}

export const DiscoveryError: React.FC<DiscoveryErrorProps> = ({ message, onRetry }) => {
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  return (
    <Alert variant="danger">
      <p>{message}</p>
      <Button variant="ghost" onClick={onRetry}>
        {copy.retry}
      </Button>
    </Alert>
  );
};

/* ---------------- Zero-results recovery ---------------- */

export interface ZeroResultsProps {
  /** Human label of the single filter whose removal restores the most results. */
  eliminatedByLabel: string | null;
  onRelax: (() => void) | null;
  /** Results that would exist without the current filters (same search). */
  nearMissCount: number | null;
  onResetAll: () => void;
}

export const ZeroResults: React.FC<ZeroResultsProps> = ({
  eliminatedByLabel,
  onRelax,
  nearMissCount,
  onResetAll,
}) => {
  const { lang } = useLanguage();
  const copy = getDiscoveryCopy(lang);
  return (
    <div className="cm-zeroresults">
      <h2>{copy.zeroHeading}</h2>
      <p>{copy.zeroBody}</p>
      {eliminatedByLabel ? (
        <p>{fillCopy(copy.zeroEliminatedBy, { label: eliminatedByLabel })}</p>
      ) : null}
      {nearMissCount !== null && nearMissCount > 0 ? (
        <p>{fillCopy(copy.zeroNearMisses, { count: String(nearMissCount) })}</p>
      ) : null}
      <div className="cm-zeroresults-actions">
        {onRelax && eliminatedByLabel ? (
          <Button variant="primary" onClick={onRelax}>
            {fillCopy(copy.zeroRelax, { label: eliminatedByLabel })}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onResetAll}>
          {copy.zeroClearAll}
        </Button>
      </div>
    </div>
  );
};
