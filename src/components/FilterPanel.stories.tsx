import React from 'react';

import { Bank, CardFilterOptions } from '../types';

import FilterPanel from './FilterPanel';

export default {
  title: 'Components/FilterPanel',
  component: FilterPanel,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
  argTypes: {
    banks: { control: false, description: 'Array of bank objects for filter options' },
    onFilterChange: { action: 'onFilterChange', description: 'Callback when filters are applied' },
    initialFilters: { control: false, description: 'Initial filter state' },
  },
};

const banks: Bank[] = [
  {
    id: 1,
    name: 'Eastern Bank Limited',
    logo: '/assets/logos/ebl.png',
    website: 'https://www.ebl.com.bd',
    isActive: true,
  },
  {
    id: 2,
    name: 'Standard Chartered Bank',
    logo: '/assets/logos/scb.png',
    website: 'https://www.sc.com/bd',
    isActive: true,
  },
  {
    id: 3,
    name: 'BRAC Bank Limited',
    logo: '/assets/logos/brac.png',
    website: 'https://www.bracbank.com',
    isActive: true,
  },
];

/* State: expanded panel with bank filters */
export const Expanded = {
  args: {
    banks,
    onFilterChange: () => {},
    initialFilters: {},
  },
};

/* State: collapsed panel (default) */
export const Collapsed = {
  args: {
    banks: banks.slice(0, 2),
    onFilterChange: () => {},
    initialFilters: {},
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/* State: filtered by annual fee range */
export const ByAnnualFee = {
  args: {
    banks: banks.slice(0, 2),
    onFilterChange: () => {},
    initialFilters: { annualFeeRange: { min: 1000, max: 5000 } },
  },
};

/* State: filtered by interest rate */
export const ByInterestRate = {
  args: {
    banks: banks.slice(0, 2),
    onFilterChange: () => {},
    initialFilters: { interestRateRange: { min: 18, max: 25 } },
  },
};

/* State: filtered by lounge access */
export const ByLoungeAccess = {
  args: {
    banks,
    onFilterChange: () => {},
    initialFilters: { hasLoungeAccess: true },
  },
};

/* State: filtered by features */
export const ByFeatures = {
  args: {
    banks: banks.slice(0, 1),
    onFilterChange: () => {},
    initialFilters: { hasAdditionalFeatures: true },
  },
};

/* State: full filter panel with all options populated */
export const FullPanel = {
  args: {
    banks,
    onFilterChange: () => {},
    initialFilters: {
      searchTerm: 'Platinum',
      hasAnnualFee: true,
      hasLoungeAccess: true,
      hasAdditionalFeatures: true,
    },
  },
};

/* State: interactive demo with mocked onFilterChange logging */
export const Interactive = () => {
  const [lastFilters, setLastFilters] = React.useState<CardFilterOptions>({});

  return (
    <div style={{ maxWidth: '400px' }}>
      <FilterPanel
        banks={banks}
        onFilterChange={filters => setLastFilters(filters)}
        initialFilters={{}}
      />
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'var(--color-background-surface)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
        }}
      >
        <strong>Last Applied Filters:</strong>
        <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(lastFilters, null, 2) || '(none)'}
        </pre>
      </div>
    </div>
  );
};

/* State: Bengali language (filters with Bengali bank names) */
export const Bengali = {
  args: {
    banks: [
      { id: 1, name: 'ইস্টার্ন ব্যাংক লিমিটেড', logo: '', website: '', isActive: true },
      { id: 2, name: 'স্ট্যান্ডার্ড চার্টার্ড ব্যাংক', logo: '', website: '', isActive: true },
      { id: 3, name: 'ব্র্যাক ব্যাংক লিমিটেড', logo: '', website: '', isActive: true },
    ],
    onFilterChange: () => {},
    initialFilters: { searchTerm: 'প্ল্যাটিনাম' },
  },
};

/* State: error state (invalid range format) */
export const WithValidationError = () => {
  const [error] = React.useState<string | null>(null);

  // This simulates the internal error state by passing invalid initialFilters
  // The actual validation happens on "Apply Filters" click
  return (
    <div style={{ maxWidth: '400px' }}>
      <FilterPanel
        banks={banks}
        onFilterChange={() => {}}
        initialFilters={{ annualFeeRangeString: 'invalid,format' }}
      />
      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
};

/* State: with string range format for annual fee */
export const WithStringRange = {
  args: {
    banks: banks.slice(0, 2),
    onFilterChange: () => {},
    initialFilters: { annualFeeRangeString: '0,200' },
  },
};

/* State: with string range format for interest rate */
export const WithInterestRateStringRange = {
  args: {
    banks: banks.slice(0, 2),
    onFilterChange: () => {},
    initialFilters: { interestRateRangeString: '18.0,25.0' },
  },
};

/* State: mobile viewport */
export const Mobile = {
  args: {
    banks,
    onFilterChange: () => {},
    initialFilters: { hasAnnualFee: true },
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/* State: desktop viewport */
export const Desktop = {
  args: {
    banks,
    onFilterChange: () => {},
    initialFilters: { hasLoungeAccess: true, hasFeeWaiver: true },
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};

/* State: dark mode */
export const DarkMode = {
  args: {
    banks,
    onFilterChange: () => {},
    initialFilters: { hasAdditionalFeatures: true },
  },
  decorators: [
    (Story: React.FC) => (
      <div data-theme="dark" style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};
