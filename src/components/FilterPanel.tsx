import React, { useState, useEffect } from 'react';

import { CardFilterOptions, Bank } from '../types';
import './FilterPanel.css';

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
  const [filters, setFilters] = useState<CardFilterOptions>(initialFilters);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    // Apply initial filters if provided
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
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

  const applyFilters = () => {
    // Validate string range formats before applying
    const validatedFilters = { ...filters };

    if (
      validatedFilters.annualFeeRangeString &&
      !validateRangeString(validatedFilters.annualFeeRangeString)
    ) {
      alert('Invalid annual fee range format. Please use "min,max" format (e.g., "0,200").');
      return;
    }

    if (
      validatedFilters.interestRateRangeString &&
      !validateRangeString(validatedFilters.interestRateRangeString)
    ) {
      alert('Invalid interest rate range format. Please use "min,max" format (e.g., "18.0,25.0").');
      return;
    }

    onFilterChange(validatedFilters);
  };

  const resetFilters = () => {
    const emptyFilters: CardFilterOptions = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`filter-panel ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="filter-header" onClick={toggleExpanded}>
        <h3>Filter Options</h3>
        <button className="toggle-button">{expanded ? 'Collapse' : 'Expand'}</button>
      </div>

      {expanded && (
        <div className="filter-content">
          <div className="filter-section">
            <h4>Banks</h4>
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
            <h4>Annual Fee</h4>
            <div className="range-inputs">
              <div className="input-group">
                <label htmlFor="minAnnualFee">Min (BDT):</label>
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
                <label htmlFor="maxAnnualFee">Max (BDT):</label>
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
              <label htmlFor="annualFeeRangeString">Or Range (min,max):</label>
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
            <h4>Interest Rate (APR)</h4>
            <div className="range-inputs">
              <div className="input-group">
                <label htmlFor="minInterestRate">Min (%):</label>
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
                <label htmlFor="maxInterestRate">Max (%):</label>
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
              <label htmlFor="interestRateRangeString">Or Range (min,max):</label>
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
            <h4>Annual Fee Options</h4>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasAnnualFee"
                  name="hasAnnualFee"
                  checked={filters.hasAnnualFee || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasAnnualFee">Has Annual Fee</label>
              </div>
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasFeeWaiver"
                  name="hasFeeWaiver"
                  checked={filters.hasFeeWaiver || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasFeeWaiver">Has Fee Waiver Policy</label>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h4>Lounge Access</h4>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasLoungeAccess"
                  name="hasLoungeAccess"
                  checked={filters.hasLoungeAccess || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasLoungeAccess">Any Lounge Access</label>
              </div>
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasInternationalLounge"
                  name="hasInternationalLounge"
                  checked={filters.hasInternationalLounge || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasInternationalLounge">International Lounge Access</label>
              </div>
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasDomesticLounge"
                  name="hasDomesticLounge"
                  checked={filters.hasDomesticLounge || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasDomesticLounge">Domestic Lounge Access</label>
              </div>
            </div>
            <div className="range-inputs">
              <div className="input-group">
                <label htmlFor="minInternationalLounge">Min International:</label>
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
                <label htmlFor="minDomesticLounge">Min Domestic:</label>
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
            <h4>Features</h4>
            <div className="checkbox-inputs">
              <div className="input-group">
                <input
                  type="checkbox"
                  id="hasAdditionalFeatures"
                  name="hasAdditionalFeatures"
                  checked={filters.hasAdditionalFeatures || false}
                  onChange={handleInputChange}
                />
                <label htmlFor="hasAdditionalFeatures">Has Additional Features</label>
              </div>
            </div>
            <div className="search-input">
              <input
                type="text"
                id="featureSearch"
                name="featureSearch"
                value={filters.featureSearch || ''}
                onChange={handleInputChange}
                placeholder="Search in features"
              />
            </div>
          </div>

          <div className="filter-section">
            <h4>Search</h4>
            <div className="search-input">
              <input
                type="text"
                id="searchTerm"
                name="searchTerm"
                value={filters.searchTerm || ''}
                onChange={handleInputChange}
                placeholder="Search by card name or features"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="apply-button" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="reset-button" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
