import React from 'react';

import CategoryCard from './CategoryCard';

export default {
  title: 'Components/CategoryCard',
  component: CategoryCard,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
};

/* State: Travel category */
export const Travel = () => (
  <CategoryCard
    category={{
      slug: 'travel',
      name: 'Travel',
      badge: 'Travel',
      description: 'Travel cards',
      icon: '✈️',
      metaTitle: 'Travel',
      metaDescription: 'Travel cards',
      filters: { hasLoungeAccess: true, ordering: '-lounge_access_international' },
    }}
  />
);

/* State: Cashback category */
export const Cashback = () => (
  <CategoryCard
    category={{
      slug: 'cashback',
      name: 'Cashback',
      badge: 'Cashback',
      description: 'Cashback cards',
      icon: '💸',
      metaTitle: 'Cashback',
      metaDescription: 'Cashback cards',
      filters: { searchTerm: 'cash back' },
    }}
  />
);

/* State: Premium category */
export const Premium = () => (
  <CategoryCard
    category={{
      slug: 'premium',
      name: 'Premium',
      badge: 'Premium',
      description: 'Premium cards',
      icon: '💎',
      metaTitle: 'Premium',
      metaDescription: 'Premium cards',
      filters: { annualFeeRange: { min: 3000 } },
    }}
  />
);

/* State: Student category */
export const Student = () => (
  <CategoryCard
    category={{
      slug: 'student',
      name: 'Student',
      badge: 'Student',
      description: 'Student cards',
      icon: '🎓',
      metaTitle: 'Student',
      metaDescription: 'Student cards',
      filters: { searchTerm: 'student' },
    }}
  />
);

/* State: Business category */
export const Business = () => (
  <CategoryCard
    category={{
      slug: 'business',
      name: 'Business',
      badge: 'Business',
      description: 'Business cards',
      icon: '💼',
      metaTitle: 'Business',
      metaDescription: 'Business cards',
      filters: { searchTerm: 'business' },
    }}
  />
);

/* State: No Annual Fee category */
export const NoAnnualFee = () => (
  <CategoryCard
    category={{
      slug: 'no-annual-fee',
      name: 'No Annual Fee',
      badge: 'No Annual Fee',
      description: 'No fee cards',
      icon: '🆓',
      metaTitle: 'No Annual Fee',
      metaDescription: 'No fee cards',
      filters: { hasAnnualFee: false },
    }}
  />
);
