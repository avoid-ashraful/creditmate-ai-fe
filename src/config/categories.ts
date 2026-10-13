import { CardFilterOptions } from '../types';

export type CategorySlug =
  | 'travel'
  | 'cashback'
  | 'premium'
  | 'student'
  | 'business'
  | 'no-annual-fee';

export type CategoryFilters = CardFilterOptions & {
  ordering?: string;
  /** Additional search term tried when the primary search returns no results. */
  fallbackSearchTerm?: string;
};

export interface Category {
  slug: CategorySlug;
  name: string;
  badge: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  icon: string;
  /** Guide slugs (src/content/guides.ts) that explain this category's topic. */
  relatedGuideSlugs: string[];
  filters: CategoryFilters;
}

export const CATEGORIES: Category[] = [
  {
    slug: 'travel',
    name: 'Travel',
    badge: 'Travel',
    description:
      'Cards whose data includes airport lounge access (international or domestic), sorted by international lounge entitlement.',
    metaTitle: 'Best Travel Credit Cards in Bangladesh | CreditMate AI',
    metaDescription:
      'Compare travel credit cards in Bangladesh with airport lounge access, travel rewards and perks from top banks.',
    icon: '✈️',
    relatedGuideSlugs: ['maximizing-lounge-access-benefits'],
    filters: { hasLoungeAccess: true, ordering: '-lounge_access_international' },
  },
  {
    slug: 'cashback',
    name: 'Cashback',
    badge: 'Cashback',
    description:
      'Cards mentioning "cash back" or "cashback" in their name or reward policy. Keyword search based on published card data.',
    metaTitle: 'Best Cashback Credit Cards in Bangladesh | CreditMate AI',
    metaDescription:
      'Find cashback credit cards in Bangladesh and earn rewards on everyday spending from leading banks.',
    icon: '💸',
    relatedGuideSlugs: ['credit-card-vs-debit-card', 'understanding-annual-fee-waivers'],
    filters: { searchTerm: 'cash back', fallbackSearchTerm: 'cashback', ordering: 'annual_fee' },
  },
  {
    slug: 'premium',
    name: 'Premium',
    badge: 'Premium',
    description:
      'Cards with a published annual fee of BDT 3,000 or more. Based on annual fee level only; benefits vary by bank.',
    metaTitle: 'Premium Credit Cards in Bangladesh | CreditMate AI',
    metaDescription:
      'Explore premium credit cards in Bangladesh with annual fees of BDT 3,000 or more from top banks.',
    icon: '💎',
    relatedGuideSlugs: ['understanding-annual-fee-waivers'],
    filters: { annualFeeRange: { min: 3000 }, ordering: '-annual_fee' },
  },
  {
    slug: 'student',
    name: 'Student',
    badge: 'Student',
    description:
      'Cards with "student" in their name or terms. Check each bank for actual eligibility criteria before applying.',
    metaTitle: 'Student Credit Cards in Bangladesh | CreditMate AI',
    metaDescription:
      'Browse credit cards in Bangladesh that mention students; check banks for eligibility and fees.',
    icon: '🎓',
    relatedGuideSlugs: ['choosing-your-first-credit-card'],
    filters: { searchTerm: 'student', ordering: 'annual_fee' },
  },
  {
    slug: 'business',
    name: 'Business',
    badge: 'Business',
    description:
      'Cards with "business" or "corporate" in their name, based on published card data.',
    metaTitle: 'Business Credit Cards in Bangladesh | CreditMate AI',
    metaDescription:
      'Find business and corporate credit cards in Bangladesh for company expenses, based on card naming.',
    icon: '💼',
    relatedGuideSlugs: ['credit-card-vs-debit-card'],
    filters: { searchTerm: 'business', fallbackSearchTerm: 'corporate', ordering: 'annual_fee' },
  },
  {
    slug: 'no-annual-fee',
    name: 'No Annual Fee',
    badge: 'No Annual Fee',
    description:
      'Cards whose published annual fee is exactly zero. Cards with unknown fees are not included.',
    metaTitle: 'No Annual Fee Credit Cards in Bangladesh | CreditMate AI',
    metaDescription:
      'Compare credit cards with no annual fee in Bangladesh and save on yearly charges while earning rewards.',
    icon: '🆓',
    relatedGuideSlugs: ['understanding-annual-fee-waivers', 'choosing-your-first-credit-card'],
    filters: { hasAnnualFee: false, ordering: 'annual_fee' },
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find(category => category.slug === slug);

export const getCategoriesForGuide = (guideSlug: string): Category[] =>
  CATEGORIES.filter(category => category.relatedGuideSlugs.includes(guideSlug));
