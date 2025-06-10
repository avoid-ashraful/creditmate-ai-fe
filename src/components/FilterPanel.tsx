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

    setFilters(prev => ({
      ...prev,
      [name]: newValue,
    }));
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
    onFilterChange(filters);
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
          </div>

          <div className="filter-section">
            <h4>Lounge Access</h4>
            <div className="checkbox-inputs">
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
