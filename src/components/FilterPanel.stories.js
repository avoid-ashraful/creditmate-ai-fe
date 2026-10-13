import React from 'react';

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
    banks: { control: false },
    onFilterChange: { action: 'onFilterChange' },
    initialFilters: { control: false },
  },
};

/* State: collapsed panel with bank filters */
const banks = [
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

/* State: expanded with various filters */
export const Expanded = () => (
  <FilterPanel banks={banks} onFilterChange={() => {}} initialFilters={{}} />
);

/* State: filtered by annual fee range */
export const ByAnnualFee = () => (
  <FilterPanel
    banks={banks.slice(0, 2)}
    onFilterChange={() => {}}
    initialFilters={{ annualFeeRange: { min: 1000, max: 5000 } }}
  />
);

/* State: filtered by interest rate */
export const ByInterestRate = () => (
  <FilterPanel
    banks={banks.slice(0, 2)}
    onFilterChange={() => {}}
    initialFilters={{ interestRateRange: { min: 18, max: 25 } }}
  />
);

/* State: filtered by lounge access */
export const ByLoungeAccess = () => (
  <FilterPanel banks={banks} onFilterChange={() => {}} initialFilters={{ hasLoungeAccess: true }} />
);

/* State: filtered by features */
export const ByFeatures = () => (
  <FilterPanel
    banks={banks.slice(0, 1)}
    onFilterChange={() => {}}
    initialFilters={{ hasAdditionalFeatures: true }}
  />
);

/* State: full filter panel with all options */
export const FullPanel = () => (
  <FilterPanel
    banks={banks}
    onFilterChange={() => {}}
    initialFilters={{
      searchTerm: 'Platinum',
      hasAnnualFee: true,
      hasLoungeAccess: true,
      hasAdditionalFeatures: true,
    }}
  />
);
