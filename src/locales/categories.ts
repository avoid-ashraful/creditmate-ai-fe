/**
 * Bengali text for the card categories defined in src/config/categories.ts.
 * Bengali strings are drafted and need review by a native speaker before release.
 */

import type { Category, CategorySlug } from '../config/categories';

import type { Language } from './types';

interface CategoryText {
  name: string;
  description: string;
}

export const CATEGORY_TEXT_BN: Record<CategorySlug, CategoryText> = {
  travel: {
    name: 'ভ্রমণ',
    description:
      'যেসব কার্ডের তথ্যে বিমানবন্দর লাউঞ্জ সুবিধা (আন্তর্জাতিক বা অভ্যন্তরীণ) আছে; আন্তর্জাতিক লাউঞ্জ সুবিধা অনুযায়ী সাজানো।',
  },
  cashback: {
    name: 'ক্যাশব্যাক',
    description:
      'যেসব কার্ডের নাম বা রিওয়ার্ড নীতিতে "cash back" বা "cashback" উল্লেখ আছে। প্রকাশিত কার্ড তথ্যে কিওয়ার্ড অনুসন্ধানের ভিত্তিতে।',
  },
  premium: {
    name: 'প্রিমিয়াম',
    description:
      'যেসব কার্ডের প্রকাশিত বার্ষিক ফি ৩,০০০ টাকা বা তার বেশি। শুধু বার্ষিক ফির স্তরের ভিত্তিতে; সুবিধা ব্যাংকভেদে ভিন্ন।',
  },
  student: {
    name: 'শিক্ষার্থী',
    description:
      'যেসব কার্ডের নাম বা শর্তে "student" আছে। আবেদনের আগে প্রকৃত যোগ্যতার শর্ত ব্যাংকের কাছ থেকে যাচাই করুন।',
  },
  business: {
    name: 'ব্যবসায়িক',
    description: 'যেসব কার্ডের নামে "business" বা "corporate" আছে, প্রকাশিত কার্ড তথ্যের ভিত্তিতে।',
  },
  'no-annual-fee': {
    name: 'বার্ষিক ফি নেই',
    description: 'যেসব কার্ডের প্রকাশিত বার্ষিক ফি ঠিক শূন্য। ফি অজানা এমন কার্ড অন্তর্ভুক্ত নয়।',
  },
};

/** Display name, badge and description of a category in the given language. */
export function getCategoryText(
  category: Category,
  lang: Language
): { name: string; badge: string; description: string } {
  if (lang === 'bn') {
    const bn = CATEGORY_TEXT_BN[category.slug];
    return { name: bn.name, badge: bn.name, description: bn.description };
  }
  return { name: category.name, badge: category.badge, description: category.description };
}

/** Page heading such as "Travel Credit Cards". */
export const getCategoryHeading = (name: string, lang: Language): string =>
  lang === 'bn' ? `${name} ক্রেডিট কার্ড` : `${name} Credit Cards`;
