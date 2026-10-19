/**
 * Small, eagerly loaded part of the legal copy: routes and footer link labels.
 * The full page text lives in ./legal and is only loaded with the lazy legal/404 pages.
 */

import type { Language } from './types';

export type LegalPageKey =
  | 'privacy'
  | 'terms'
  | 'disclaimer'
  | 'howWeMakeMoney'
  | 'methodology'
  | 'contact';

/** Route for each page; keep in step with the routes in src/App.tsx and STATIC_PATHS. */
export const LEGAL_PAGE_PATHS: Record<LegalPageKey, string> = {
  privacy: '/privacy',
  terms: '/terms',
  disclaimer: '/disclaimer',
  howWeMakeMoney: '/how-we-make-money',
  methodology: '/methodology',
  contact: '/contact',
};

export interface LegalNavCopy {
  footerLegalHeading: string;
  /** Page heading, browser title and footer link label. */
  titles: Record<LegalPageKey, string>;
}

export const LEGAL_NAV: Record<Language, LegalNavCopy> = {
  en: {
    footerLegalHeading: 'Legal',
    titles: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      disclaimer: 'Disclaimer: data accuracy',
      howWeMakeMoney: 'How We Make Money',
      methodology: 'Methodology',
      contact: 'Contact',
    },
  },
  bn: {
    footerLegalHeading: 'আইনগত',
    titles: {
      privacy: 'গোপনীয়তা নীতি',
      terms: 'সেবার শর্তাবলি',
      disclaimer: 'দাবিত্যাগ: তথ্যের নির্ভুলতা',
      howWeMakeMoney: 'আমরা কীভাবে আয় করি',
      methodology: 'কার্যপদ্ধতি',
      contact: 'যোগাযোগ',
    },
  },
};

export function getLegalNav(lang: Language): LegalNavCopy {
  return LEGAL_NAV[lang];
}
