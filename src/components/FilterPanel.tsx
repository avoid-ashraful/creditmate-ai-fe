import React, { useState, useEffect } from 'react';

import { useLanguage, getCommonCopy, getCardDetailCopy, getNetworkLabel } from '../locales';
import { CardFilterOptions, Bank, CardNetwork } from '../types';
import './FilterPanel.css';

const CARD_NETWORKS: CardNetwork[] = [
  'visa',
  'mastercard',
  'amex',
  'unionpay',
  'jcb',
  'diners',
  'other',
];

interface FilterPanelProps {
  banks: Bank[];
  onFilterChange: (filters: CardFilterOptions) => void;
  initialFilters?: CardFilterOptions;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  banks,
  onFilterChange,
  initialFilters = {},
}) => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const detailCopy = getCardDetailCopy(lang);
  const [filters, setFilters] = useState<CardFilterOptions>(initialFilters);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Apply initial filters if provided
    if (Object.keys(initialFilters).length > 0) {
      // Merge so filters the user has picked survive a parent re-render.
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);

  // Helper function to validate range string format
  const validateRangeString = (value: string): boolean => {
    if (!value.trim()) return true; // Empty is valid
    const parts = value.split(',');
    if (parts.length !== 2) return false;
    const [min, max] = parts.map(p => parseFloat(p.trim()));
    return !isNaN(min) && !isNaN(max) && min <= max;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let newValue: string | number | boolean | undefined;

    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'number') {
      newValue = value === '' ? undefined : Number(value);
    } else {
      newValue = value;
    }

    // Handle nested range objects for API compatibility
    if (name === 'minAnnualFee' || name === 'maxAnnualFee') {
      setFilters(prev => ({
        ...prev,
        annualFeeRange: {
          ...prev.annualFeeRange,
          [name === 'minAnnualFee' ? 'min' : 'max']: newValue as number | undefined,
        },
        // Keep legacy support
        [name]: newValue,
        // Clear string range when using individual inputs
        annualFeeRangeString: undefined,
      }));
    } else if (name === 'minInterestRate' || name === 'maxInterestRate') {
      setFilters(prev => ({
        ...prev,
        interestRateRange: {
          ...prev.interestRateRange,
          [name === 'minInterestRate' ? 'min' : 'max']: newValue as number | undefined,
        },
        // Keep legacy support
        [name]: newValue,
        // Clear string range when using individual inputs
        interestRateRangeString: undefined,
      }));
    } else if (name === 'annualFeeRangeString') {
      // Clear individual range inputs when using string format
      setFilters(prev => ({
        ...prev,
        [name]: newValue as string,
        annualFeeRange: undefined,
        minAnnualFee: undefined,
        maxAnnualFee: undefined,
      }));
    } else if (name === 'interestRateRangeString') {
      // Clear individual range inputs when using string format
      setFilters(prev => ({
        ...prev,
        [name]: newValue as string,
        interestRateRange: undefined,
        minInterestRate: undefined,
        maxInterestRate: undefined,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: newValue,
      }));
    }
  };

  const handleBankSelection = (bankId: number, checked: boolean) => {
    setFilters(prev => {
      const bankIds = prev.bankIds || [];
      if (checked) {
        return { ...prev, bankIds: [...bankIds, bankId] };
      } else {
        return { ...prev, bankIds: bankIds.filter(id => id !== bankId) };
      }
    });
  };

  const handleNetworkToggle = (network: CardNetwork) => {
    setFilters(prev => {
      const networks = prev.cardNetworks || [];
      const next = networks.includes(network)
        ? networks.filter(n => n !== network)
        : [...networks, network];
      return { ...prev, cardNetworks: next.length > 0 ? next : undefined };
    });
  };

  // Unchecked means "no filter", not "exclude": keep the key absent.
  const handleFlagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: checked || undefined }));
  };

  const applyFilters = () => {
    // Validate string range formats before applying
    const validatedFilters = { ...filters };

    if (
      validatedFilters.annualFeeRangeString &&
      !validateRangeString(validatedFilters.annualFeeRangeString)
    ) {
      setError(common.filterErrorAnnualFeeFormat);
      return;
    }

    if (
      validatedFilters.interestRateRangeString &&
      !validateRangeString(validatedFilters.interestRateRangeString)
    ) {
      setError(common.filterErrorInterestRateFormat);
      return;
    }

    setError(null);
    onFilterChange(validatedFilters);
  };

  const resetFilters = () => {
    const emptyFilters: CardFilterOptions = {};
    setFilters(emptyFilters);
    setError(null);
    onFilterChange(emptyFilters);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <section
      className={`filter-panel ${expanded ? 'expanded' : 'collapsed'}`}
      aria-labelledby="filter-panel-heading"
    >
      <div className="filter-header" onClick={toggleExpanded}>
        <h2 id="filter-panel-heading">{common.filterPanelTitle}</h2>
        <button
          className="toggle-button"
          type="button"
          aria-expanded={expanded}
          aria-controls="filter-panel-content"
        >
          {expanded ? common.filterCollapse : common.filterExpand}
        </button>
      </div>

      {expanded && (
        <div className="filter-content" id="filter-panel-content">
          <div className="filter-section">
            <h3>{common.filterSectionBanks}</h3>
            <div className="bank-options">
              {banks.map(bank => (
                <div key={bank.id} className="bank-option">
                  <input
                    type="checkbox"
                    id={`bank-${bank.id}`}
                    checked={(filters.bankIds || []).includes(bank.id)}
                    onChange={e => handleBankSelection(bank.id, e.target.checked)}
                  />
                  <label htmlFor={`bank-${bank.id}`}>{bank.name}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionAnnualFee}</h3>
            <div className="range-inputs">
              <div className="input-group">
                <label htmlFor="minAnnualFee">{common.filterLabelMinAnnualFee}</label>
                <input
                  type="number"
                  id="minAnnualFee"
                  name="minAnnualFee"
                  value={filters.minAnnualFee || ''}
                  onChange={handleInputChange}
                  placeholder="Min"
                  min="0"
                />
              </div>
              <div className="input-group">
                <label htmlFor="maxAnnualFee">{common.filterLabelMaxAnnualFee}</label>
                <input
                  type="number"
                  id="maxAnnualFee"
                  name="maxAnnualFee"
                  value={filters.maxAnnualFee || ''}
                  onChange={handleInputChange}
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>
            <div className="range-string-input">
              <label htmlFor="annualFeeRangeString">{common.filterLabelAnnualFeeRange}</label>
              <input
                type="text"
                id="annualFeeRangeString"
                name="annualFeeRangeString"
                value={filters.annualFeeRangeString || ''}
                onChange={handleInputChange}
                placeholder="e.g., 0,200"
              />
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionInterestRate}</h3>
            <div className="range-inputs">
              <div className="input-group">
                <label htmlFor="minInterestRate">{common.filterLabelMinInterestRate}</label>
                <input
                  type="number"
                  id="minInterestRate"
                  name="minInterestRate"
                  value={filters.minInterestRate || ''}
                  onChange={handleInputChange}
                  placeholder="Min"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="input-group">
                <label htmlFor="maxInterestRate">{common.filterLabelMaxInterestRate}</label>
                <input
                  type="number"
                  id="maxInterestRate"
                  name="maxInterestRate"
                  value={filters.maxInterestRate || ''}
                  onChange={handleInputChange}
                  placeholder="Max"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            <div className="range-string-input">
              <label htmlFor="interestRateRangeString">{common.filterLabelInterestRateRange}</label>
              <input
                type="text"
                id="interestRateRangeString"
                name="interestRateRangeString"
                value={filters.interestRateRangeString || ''}
                onChange={handleInputChange}
                placeholder="e.g., 18.0,25.0"
              />
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionAnnualFeeOptions}</h3>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasAnnualFee"
                  name="hasAnnualFee"
                  checked={filters.hasAnnualFee || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasAnnualFee">{common.filterLabelHasAnnualFee}</label>
              </div>
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasFeeWaiver"
                  name="hasFeeWaiver"
                  checked={filters.hasFeeWaiver || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasFeeWaiver">{common.filterLabelHasFeeWaiver}</label>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionLoungeAccess}</h3>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasLoungeAccess"
                  name="hasLoungeAccess"
                  checked={filters.hasLoungeAccess || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasLoungeAccess">{common.filterLabelHasLoungeAccess}</label>
              </div>
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasInternationalLounge"
                  name="hasInternationalLounge"
                  checked={filters.hasInternationalLounge || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasInternationalLounge">
                  {common.filterLabelHasInternationalLounge}
                </label>
              </div>
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasDomesticLounge"
                  name="hasDomesticLounge"
                  checked={filters.hasDomesticLounge || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasDomesticLounge">{common.filterLabelHasDomesticLounge}</label>
              </div>
            </div>
            <div className="range-inputs">
              <div className="input-group">
                <label htmlFor="minInternationalLounge">
                  {common.filterLabelMinInternationalLounge}
                </label>
                <input
                  type="number"
                  id="minInternationalLounge"
                  name="minInternationalLounge"
                  value={filters.minInternationalLounge || ''}
                  onChange={handleInputChange}
                  placeholder="Min"
                  min="0"
                />
              </div>
              <div className="input-group">
                <label htmlFor="minDomesticLounge">{common.filterLabelMinDomesticLounge}</label>
                <input
                  type="number"
                  id="minDomesticLounge"
                  name="minDomesticLounge"
                  value={filters.minDomesticLounge || ''}
                  onChange={handleInputChange}
                  placeholder="Min"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h3 id="filter-network-heading">{common.filterSectionCardNetwork}</h3>
            <div
              className="network-chip-group"
              role="group"
              aria-labelledby="filter-network-heading"
            >
              {CARD_NETWORKS.map(network => {
                const selected = (filters.cardNetworks || []).includes(network);
                return (
                  <button
                    key={network}
                    type="button"
                    className={`network-chip${selected ? ' selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => handleNetworkToggle(network)}
                  >
                    {getNetworkLabel(detailCopy, network)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionCardType}</h3>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="isIslamic"
                  name="isIslamic"
                  checked={filters.isIslamic || false}
                  onChange={handleFlagChange}
                />
                <label htmlFor="isIslamic">{common.filterLabelIslamic}</label>
              </div>
              <div className="input-group">
                <input
                  type="checkbox"
                  id="isDualCurrency"
                  name="isDualCurrency"
                  checked={filters.isDualCurrency || false}
                  onChange={handleFlagChange}
                />
                <label htmlFor="isDualCurrency">{common.filterLabelDualCurrency}</label>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionIncome}</h3>
            <div className="input-group">
              <label htmlFor="maxMinMonthlyIncome">{common.filterLabelMonthlyIncome}</label>
              <input
                type="number"
                id="maxMinMonthlyIncome"
                name="maxMinMonthlyIncome"
                value={filters.maxMinMonthlyIncome ?? ''}
                onChange={handleInputChange}
                min="0"
                inputMode="numeric"
              />
            </div>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="includeUnknownIncome"
                  name="includeUnknownIncome"
                  checked={filters.includeUnknownIncome ?? true}
                  onChange={handleInputChange}
                />
                <label htmlFor="includeUnknownIncome">
                  {common.filterLabelIncludeUnknownIncome}
                </label>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionFeatures}</h3>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasAdditionalFeatures"
                  name="hasAdditionalFeatures"
                  checked={filters.hasAdditionalFeatures || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasAdditionalFeatures">
                  {common.filterLabelHasAdditionalFeatures}
                </label>
              </div>
            </div>
            <div className="search-input">
              <input
                type="text"
                id="featureSearch"
                name="featureSearch"
                value={filters.featureSearch || ''}
                onChange={handleInputChange}
                placeholder={common.filterLabelFeatureSearch}
                aria-label={common.filterLabelFeatureSearch}
              />
            </div>
          </div>

          <div className="filter-section">
            <h3>{common.filterSectionSearch}</h3>
            <div className="search-input">
              <input
                type="text"
                id="searchTerm"
                name="searchTerm"
                value={filters.searchTerm || ''}
                onChange={handleInputChange}
                placeholder={common.filterLabelSearchTerm}
                aria-label={common.filterLabelSearchTerm}
              />
            </div>
          </div>

          {error && (
            <p className="filter-error" role="alert">
              {error}
            </p>
          )}

          <div className="filter-actions">
            <button className="apply-button" onClick={applyFilters}>
              {common.filterApply}
            </button>
            <button className="reset-button" onClick={resetFilters}>
              {common.filterReset}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default FilterPanel;
