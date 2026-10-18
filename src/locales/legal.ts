/**
 * Draft copy for the legal and trust pages (privacy, terms, disclaimer, advertiser
 * disclosure, methodology, contact) and the 404 page.
 *
 * All of this text is a DRAFT pending legal review; every page shows a banner saying so.
 * Bengali strings are drafted and need review by a native speaker before release.
 * `{email}` is replaced with CONTACT_EMAIL (src/config/site.ts).
 */

import type { Language } from './types';

export type LegalPageKey =
  | 'privacy'
  | 'terms'
  | 'disclaimer'
  | 'howWeMakeMoney'
  | 'methodology'
  | 'contact';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalPageCopy {
  /** Page heading, browser title and footer link label. */
  title: string;
  description: string;
  sections: LegalSection[];
}

export interface LegalCopy {
  draftBanner: string;
  contactEmailLabel: string;
  pages: Record<LegalPageKey, LegalPageCopy>;
  notFound: {
    title: string;
    description: string;
    suggestionsHeading: string;
    homeLink: string;
    searchLink: string;
    compareLink: string;
    guidesLink: string;
    contactLink: string;
  };
  footerLegalHeading: string;
}

/** Route for each page; keep in step with the routes in src/App.tsx and STATIC_PATHS. */
export const LEGAL_PAGE_PATHS: Record<LegalPageKey, string> = {
  privacy: '/privacy',
  terms: '/terms',
  disclaimer: '/disclaimer',
  howWeMakeMoney: '/how-we-make-money',
  methodology: '/methodology',
  contact: '/contact',
};

export const LEGAL_COPY: Record<Language, LegalCopy> = {
  en: {
    draftBanner: 'Draft — pending legal review',
    contactEmailLabel: 'Email',
    footerLegalHeading: 'Legal',
    notFound: {
      title: 'Page not found',
      description:
        'We could not find the page you were looking for. It may have moved, or the link may be mistyped.',
      suggestionsHeading: 'Try one of these instead',
      homeLink: 'Go to the home page',
      searchLink: 'Search credit cards',
      compareLink: 'Compare cards side by side',
      guidesLink: 'Read the guides',
      contactLink: 'Tell us about a broken link',
    },
    pages: {
      privacy: {
        title: 'Privacy Policy',
        description:
          'What personal data CreditMate AI collects, why, how long we keep it, and your rights under Bangladesh’s Personal Data Protection Ordinance 2025.',
        sections: [
          {
            heading: 'About this policy',
            paragraphs: [
              'CreditMate AI helps people in Bangladesh compare credit cards. This policy explains what personal data we handle and why. It is drafted with the Personal Data Protection Ordinance 2025 of Bangladesh in mind. It is a draft and has not yet been reviewed by a lawyer, so it may change.',
            ],
          },
          {
            heading: 'What data we collect',
            bullets: [
              'Account data: your email address, a display name if you add one, and your password (stored only in hashed form). We collect this only if you register.',
              'Saved comparisons, collections and notes that you create while signed in.',
              'Alert subscriptions: the cards you watch and your email alert preferences.',
              'Reviews you submit: rating, title, text, pros and cons, linked to your account.',
              'Data in your browser’s local storage: your language and theme choice, and the session information that keeps you signed in. It stays on your device.',
              'Analytics data: none, unless you opt in (see “Analytics”).',
            ],
            paragraphs: [
              'We do not ask for your credit card numbers, bank account details, national ID number or credit report.',
            ],
          },
          {
            heading: 'Why we use your data',
            bullets: [
              'To create and secure your account and keep you signed in.',
              'To show your saved comparisons, collections and notes.',
              'To send the email alerts you subscribed to.',
              'To publish and manage the reviews you submit.',
              'To answer your messages and requests.',
            ],
          },
          {
            heading: 'Consent',
            paragraphs: [
              'We use account data because you ask us to provide the features you sign up for. For anything optional, such as analytics or email alerts, we rely on your consent. You can withdraw consent at any time. Withdrawing does not affect what we did before you withdrew.',
            ],
          },
          {
            heading: 'Analytics',
            paragraphs: [
              'Analytics is off. No analytics events are sent unless you opt in, and no analytics provider is connected today, so there is currently no consent banner. If we add analytics, we will ask for your consent first and update this policy before any data is collected.',
            ],
          },
          {
            heading: 'Sharing',
            paragraphs: [
              'We do not sell your personal data. We may use service providers, for example for hosting and email delivery, who process data only on our instructions. Reviews you submit are shown on card pages, so please do not put personal information in them.',
              'Our service providers may store data outside Bangladesh. We will transfer personal data abroad only as the law allows.',
            ],
          },
          {
            heading: 'How long we keep data',
            bullets: [
              'Account data: while your account exists. It is deleted when you delete your account.',
              'Saved items and alert subscriptions: until you delete them or delete your account.',
              'Reviews: until you delete them or delete your account.',
              'Local storage on your device: until you sign out or clear your browser data.',
            ],
          },
          {
            heading: 'Your rights',
            bullets: [
              'Access: ask for a copy of the personal data we hold about you.',
              'Correction: fix inaccurate data. You can change your email and display name in your account settings.',
              'Deletion: ask us to delete your data or delete your account.',
              'Export: ask for your data in a commonly used, machine-readable format.',
              'Withdraw consent: stop optional processing, including analytics, at any time.',
            ],
            paragraphs: [
              'To use these rights, email {email}. We aim to reply within 30 days. You may also complain to the authority named in the Ordinance.',
            ],
          },
          {
            heading: 'Security and children',
            paragraphs: [
              'We use reasonable measures to protect your data, but no online service is completely secure. CreditMate AI is meant for adults and is not directed at children.',
            ],
          },
          {
            heading: 'Changes and contact',
            paragraphs: [
              'We will post changes to this policy on this page. Questions about privacy: {email}.',
            ],
          },
        ],
      },
      terms: {
        title: 'Terms of Service',
        description:
          'The rules for using CreditMate AI: what the service is, your account, your reviews, and our limits of responsibility.',
        sections: [
          {
            heading: 'Using CreditMate AI',
            paragraphs: [
              'By using CreditMate AI you agree to these terms. If you do not agree, please do not use the service. These terms are a draft pending legal review.',
            ],
          },
          {
            heading: 'What the service is',
            paragraphs: [
              'CreditMate AI is an information and comparison service for credit cards offered in Bangladesh. It is not a bank, a lender or a financial adviser. We do not process card applications. If you apply for a card, you do so with the bank, under the bank’s own terms.',
              'Nothing on the site is financial advice. Please read the Disclaimer about data accuracy.',
            ],
          },
          {
            heading: 'Your account',
            bullets: [
              'Give accurate information and keep your password private.',
              'You are responsible for what happens under your account.',
              'You can delete your account at any time.',
            ],
          },
          {
            heading: 'Reviews and other content you submit',
            bullets: [
              'Write honestly about your own experience. Do not post unlawful, abusive, misleading or private information.',
              'You keep ownership of your content. You allow us to display it on the site for as long as it is published.',
              'We may remove content that breaks these terms.',
            ],
          },
          {
            heading: 'Acceptable use',
            paragraphs: [
              'Do not misuse the service: no attempts to break its security, overload it, or copy it in bulk without permission.',
            ],
          },
          {
            heading: 'Third-party links',
            paragraphs: [
              'Links to bank websites are provided for your convenience. We do not control those sites and are not responsible for their content or terms.',
            ],
          },
          {
            heading: 'Limits of responsibility',
            paragraphs: [
              'The service is provided “as is”. To the extent the law allows, CreditMate AI is not liable for losses that result from relying on information on the site. You should verify details with the bank before you apply.',
            ],
          },
          {
            heading: 'Changes, governing law and contact',
            paragraphs: [
              'We may update these terms and will post the new version here. These terms are governed by the laws of Bangladesh. Questions: {email}.',
            ],
          },
        ],
      },
      disclaimer: {
        title: 'Disclaimer: data accuracy',
        description:
          'Where CreditMate AI card data comes from, why it may be out of date, and why you should verify with the bank before applying.',
        sections: [
          {
            heading: 'Where the data comes from',
            paragraphs: [
              'Card details such as fees, interest rates and benefits come from banks’ published schedules of charges and official card pages. We do not receive them from the banks privately.',
            ],
          },
          {
            heading: 'It can change',
            paragraphs: [
              'Banks can change fees, rates and benefits at any time, and not always with notice. Our data may be out of date, incomplete or contain mistakes even though we check it. Where we know when a card was last updated, we show the date on the card page.',
            ],
          },
          {
            heading: 'Verify with the bank before applying',
            paragraphs: [
              'Always confirm the current fees, interest rate, eligibility and terms directly with the bank before you apply. The bank’s own documents are the final word.',
            ],
          },
          {
            heading: 'Missing data',
            paragraphs: [
              'When a bank has not published a detail, we show “Data not available” or “Unknown”. We do not guess or fill the gap with estimates.',
            ],
          },
          {
            heading: 'Highlights and comparisons',
            paragraphs: [
              'Pros, considerations and comparison summaries are generated from the published fields using simple, fixed rules. They are not recommendations and do not know your personal situation.',
            ],
          },
          {
            heading: 'Found a mistake?',
            paragraphs: [
              'Please tell us at {email}. See the Methodology page for what to include.',
            ],
          },
        ],
      },
      howWeMakeMoney: {
        title: 'How We Make Money',
        description:
          'Our advertiser disclosure: CreditMate AI currently has no paid relationships with banks, and how we would label any in future.',
        sections: [
          {
            heading: 'Today',
            paragraphs: [
              'CreditMate AI currently has no paid relationship with any bank or card issuer. We do not take commissions, referral fees or payment for placement.',
            ],
          },
          {
            heading: 'If that changes',
            bullets: [
              'Sponsored placements will be clearly labelled as sponsored.',
              'Payment will never affect how cards are rated, ranked or described.',
              'We will update this page before any paid relationship starts.',
            ],
          },
          {
            heading: 'Questions',
            paragraphs: ['Ask us anything about this at {email}.'],
          },
        ],
      },
      methodology: {
        title: 'Methodology',
        description:
          'How CreditMate AI lists cards, where the data comes from, how it is verified by people, how fee waivers and lounge data are read, and how to report errors.',
        sections: [
          {
            heading: 'How cards are listed',
            paragraphs: [
              'We list credit cards that Bangladeshi banks publish. Cards that are marked inactive are not shown in search and comparison.',
              'Category pages use simple rules that are written on each page. For example, “Premium” means a published annual fee of BDT 3,000 or more.',
            ],
          },
          {
            heading: 'Data sources',
            bullets: [
              'Banks’ published schedules of charges.',
              'Official bank card pages and product documents.',
              'Bangladesh Bank rules, where our guides refer to them.',
            ],
          },
          {
            heading: 'Human verification',
            paragraphs: [
              'A person checks each card record against its source before it is published, and again when the bank changes its published terms. The card page shows when the record was last updated, where we know it.',
            ],
          },
          {
            heading: 'How we read annual fee waivers',
            paragraphs: [
              'We show the waiver condition exactly as the bank states it, for example a yearly spending threshold. We do not predict whether you would qualify. If a bank does not publish a waiver condition, we show “Data not available”, not “no waiver”.',
            ],
          },
          {
            heading: 'How we read lounge access',
            bullets: [
              'We show what the bank publishes, such as “5 visits” or “Unlimited”. We never invent a number.',
              '“None” means the bank states there is no lounge access.',
              '“Unknown” means we have no data. It does not mean there is no lounge access.',
            ],
          },
          {
            heading: 'No paid influence',
            paragraphs: [
              'Cards are not ranked or highlighted because of payment. See How We Make Money.',
            ],
          },
          {
            heading: 'Report an error',
            paragraphs: [
              'Email {email} with the card name, the field that looks wrong, and a link to the bank page that shows the correct value. We will review it and correct the record when the source confirms it.',
            ],
          },
        ],
      },
      contact: {
        title: 'Contact',
        description: 'How to reach CreditMate AI about errors, privacy requests, or anything else.',
        sections: [
          {
            heading: 'Get in touch',
            paragraphs: [
              'The best way to reach us is by email. We usually reply within a few business days.',
            ],
          },
          {
            heading: 'What to write to us about',
            bullets: [
              'A mistake in card data. Include the card name, the field and a source link.',
              'A privacy request: access, correction, deletion or export of your data. We aim to reply within 30 days.',
              'A broken page or link.',
              'Anything else about CreditMate AI.',
            ],
          },
        ],
      },
    },
  },
  bn: {
    draftBanner: 'খসড়া — আইনি পর্যালোচনার অপেক্ষায়',
    contactEmailLabel: 'ইমেল',
    footerLegalHeading: 'আইনগত',
    notFound: {
      title: 'পেজটি পাওয়া যায়নি',
      description:
        'আপনি যে পেজটি খুঁজছেন তা আমরা খুঁজে পাইনি। পেজটি সরে গিয়ে থাকতে পারে, অথবা লিংকে ভুল থাকতে পারে।',
      suggestionsHeading: 'এর বদলে এগুলো দেখুন',
      homeLink: 'হোম পেজে যান',
      searchLink: 'ক্রেডিট কার্ড খুঁজুন',
      compareLink: 'কার্ড পাশাপাশি তুলনা করুন',
      guidesLink: 'গাইডগুলো পড়ুন',
      contactLink: 'নষ্ট লিংকের কথা জানান',
    },
    pages: {
      privacy: {
        title: 'গোপনীয়তা নীতি',
        description:
          'CreditMate AI কী ব্যক্তিগত তথ্য সংগ্রহ করে, কেন করে, কতদিন রাখে এবং ব্যক্তিগত উপাত্ত সুরক্ষা অধ্যাদেশ ২০২৫ অনুযায়ী আপনার অধিকার কী।',
        sections: [
          {
            heading: 'এই নীতি সম্পর্কে',
            paragraphs: [
              'CreditMate AI বাংলাদেশের মানুষকে ক্রেডিট কার্ড তুলনা করতে সাহায্য করে। এই নীতিতে বলা হয়েছে আমরা কী ব্যক্তিগত তথ্য নিয়ে কাজ করি এবং কেন। এটি বাংলাদেশের ব্যক্তিগত উপাত্ত সুরক্ষা অধ্যাদেশ ২০২৫ মাথায় রেখে লেখা। এটি একটি খসড়া, এখনো কোনো আইনজীবী পর্যালোচনা করেননি, তাই পরিবর্তন হতে পারে।',
            ],
          },
          {
            heading: 'আমরা কী তথ্য সংগ্রহ করি',
            bullets: [
              'অ্যাকাউন্ট তথ্য: আপনার ইমেল ঠিকানা, দিলে প্রদর্শন নাম, এবং আপনার পাসওয়ার্ড (শুধু হ্যাশ করা আকারে সংরক্ষিত)। নিবন্ধন করলেই কেবল এগুলো নেওয়া হয়।',
              'সাইন ইন অবস্থায় আপনার তৈরি সংরক্ষিত তুলনা, সংগ্রহ ও নোট।',
              'সতর্কতা সাবস্ক্রিপশন: আপনি কোন কার্ড নজরে রেখেছেন এবং ইমেল সতর্কতার পছন্দ।',
              'আপনার জমা দেওয়া রিভিউ: রেটিং, শিরোনাম, লেখা, সুবিধা ও অসুবিধা, যা আপনার অ্যাকাউন্টের সঙ্গে যুক্ত।',
              'ব্রাউজারের লোকাল স্টোরেজের তথ্য: আপনার ভাষা ও থিমের পছন্দ এবং সাইন ইন থাকার সেশন তথ্য। এটি আপনার ডিভাইসেই থাকে।',
              'অ্যানালিটিক্স তথ্য: আপনি অপ্ট-ইন না করলে কিছুই নয় ("অ্যানালিটিক্স" অংশ দেখুন)।',
            ],
            paragraphs: [
              'আমরা আপনার ক্রেডিট কার্ড নম্বর, ব্যাংক অ্যাকাউন্টের তথ্য, জাতীয় পরিচয়পত্রের নম্বর বা ক্রেডিট রিপোর্ট চাই না।',
            ],
          },
          {
            heading: 'কেন আপনার তথ্য ব্যবহার করি',
            bullets: [
              'আপনার অ্যাকাউন্ট তৈরি ও সুরক্ষিত রাখতে এবং সাইন ইন রাখতে।',
              'আপনার সংরক্ষিত তুলনা, সংগ্রহ ও নোট দেখাতে।',
              'আপনার সাবস্ক্রাইব করা ইমেল সতর্কতা পাঠাতে।',
              'আপনার জমা দেওয়া রিভিউ প্রকাশ ও পরিচালনা করতে।',
              'আপনার বার্তা ও অনুরোধের উত্তর দিতে।',
            ],
          },
          {
            heading: 'সম্মতি',
            paragraphs: [
              'আপনি যেসব সুবিধার জন্য নিবন্ধন করেন সেগুলো দিতে আমরা অ্যাকাউন্ট তথ্য ব্যবহার করি। অ্যানালিটিক্স বা ইমেল সতর্কতার মতো ঐচ্ছিক বিষয়ে আমরা আপনার সম্মতির ওপর নির্ভর করি। আপনি যেকোনো সময় সম্মতি প্রত্যাহার করতে পারেন। প্রত্যাহারের আগে যা করা হয়েছে তার ওপর এর প্রভাব পড়ে না।',
            ],
          },
          {
            heading: 'অ্যানালিটিক্স',
            paragraphs: [
              'অ্যানালিটিক্স বন্ধ আছে। আপনি অপ্ট-ইন না করলে কোনো অ্যানালিটিক্স ইভেন্ট পাঠানো হয় না, এবং বর্তমানে কোনো অ্যানালিটিক্স প্রোভাইডার সংযুক্ত নেই, তাই এখনো কোনো সম্মতি ব্যানার নেই। ভবিষ্যতে অ্যানালিটিক্স যোগ করলে কোনো তথ্য সংগ্রহের আগে আপনার সম্মতি চাইব এবং এই নীতি হালনাগাদ করব।',
            ],
          },
          {
            heading: 'তথ্য শেয়ার করা',
            paragraphs: [
              'আমরা আপনার ব্যক্তিগত তথ্য বিক্রি করি না। হোস্টিং ও ইমেল পাঠানোর মতো কাজে আমরা সেবাদাতা ব্যবহার করতে পারি, যারা শুধু আমাদের নির্দেশ অনুযায়ী তথ্য প্রক্রিয়া করে। আপনার রিভিউ কার্ড পেজে দেখানো হয়, তাই রিভিউতে ব্যক্তিগত তথ্য দেবেন না।',
              'আমাদের সেবাদাতারা বাংলাদেশের বাইরে তথ্য রাখতে পারে। আইন যতটুকু অনুমতি দেয় কেবল ততটুকুই আমরা ব্যক্তিগত তথ্য বিদেশে পাঠাব।',
            ],
          },
          {
            heading: 'কতদিন তথ্য রাখা হয়',
            bullets: [
              'অ্যাকাউন্ট তথ্য: অ্যাকাউন্ট থাকা পর্যন্ত। অ্যাকাউন্ট মুছলে তথ্যও মুছে যায়।',
              'সংরক্ষিত আইটেম ও সতর্কতা সাবস্ক্রিপশন: আপনি মোছা পর্যন্ত বা অ্যাকাউন্ট মোছা পর্যন্ত।',
              'রিভিউ: আপনি মোছা পর্যন্ত বা অ্যাকাউন্ট মোছা পর্যন্ত।',
              'আপনার ডিভাইসের লোকাল স্টোরেজ: সাইন আউট বা ব্রাউজার ডেটা মোছা পর্যন্ত।',
            ],
          },
          {
            heading: 'আপনার অধিকার',
            bullets: [
              'অ্যাক্সেস: আপনার সম্পর্কে আমাদের কাছে থাকা ব্যক্তিগত তথ্যের একটি কপি চাইতে পারেন।',
              'সংশোধন: ভুল তথ্য ঠিক করাতে পারেন। অ্যাকাউন্ট সেটিংসে ইমেল ও প্রদর্শন নাম বদলাতে পারেন।',
              'মুছে ফেলা: আপনার তথ্য মুছতে বা অ্যাকাউন্ট মুছে ফেলতে অনুরোধ করতে পারেন।',
              'এক্সপোর্ট: সাধারণভাবে ব্যবহৃত, মেশিন-পাঠযোগ্য ফরম্যাটে আপনার তথ্য চাইতে পারেন।',
              'সম্মতি প্রত্যাহার: অ্যানালিটিক্সসহ ঐচ্ছিক প্রক্রিয়াকরণ যেকোনো সময় বন্ধ করতে পারেন।',
            ],
            paragraphs: [
              'এই অধিকার ব্যবহার করতে {email} ঠিকানায় ইমেল করুন। আমরা ৩০ দিনের মধ্যে উত্তর দেওয়ার চেষ্টা করি। অধ্যাদেশে উল্লিখিত কর্তৃপক্ষের কাছেও আপনি অভিযোগ করতে পারেন।',
            ],
          },
          {
            heading: 'নিরাপত্তা ও শিশু',
            paragraphs: [
              'আপনার তথ্য রক্ষায় আমরা যুক্তিসঙ্গত ব্যবস্থা নিই, কিন্তু কোনো অনলাইন সেবাই পুরোপুরি নিরাপদ নয়। CreditMate AI প্রাপ্তবয়স্কদের জন্য, শিশুদের জন্য নয়।',
            ],
          },
          {
            heading: 'পরিবর্তন ও যোগাযোগ',
            paragraphs: [
              'নীতিতে পরিবর্তন হলে আমরা এই পেজে জানাব। গোপনীয়তা বিষয়ে প্রশ্ন: {email}।',
            ],
          },
        ],
      },
      terms: {
        title: 'সেবার শর্তাবলি',
        description:
          'CreditMate AI ব্যবহারের নিয়ম: সেবাটি কী, আপনার অ্যাকাউন্ট, আপনার রিভিউ এবং আমাদের দায়ের সীমা।',
        sections: [
          {
            heading: 'CreditMate AI ব্যবহার',
            paragraphs: [
              'CreditMate AI ব্যবহার করে আপনি এই শর্তে সম্মত হচ্ছেন। সম্মত না হলে অনুগ্রহ করে সেবাটি ব্যবহার করবেন না। এই শর্তাবলি আইনি পর্যালোচনার অপেক্ষায় থাকা একটি খসড়া।',
            ],
          },
          {
            heading: 'সেবাটি কী',
            paragraphs: [
              'CreditMate AI বাংলাদেশে প্রচলিত ক্রেডিট কার্ডের তথ্য ও তুলনার সেবা। এটি ব্যাংক, ঋণদাতা বা আর্থিক পরামর্শদাতা নয়। আমরা কার্ডের আবেদন প্রক্রিয়া করি না। কার্ডের জন্য আবেদন করলে তা ব্যাংকের কাছেই, ব্যাংকের নিজস্ব শর্তে করতে হয়।',
              'সাইটের কোনো কিছুই আর্থিক পরামর্শ নয়। তথ্যের নির্ভুলতা সম্পর্কে অনুগ্রহ করে দাবিত্যাগ পেজটি পড়ুন।',
            ],
          },
          {
            heading: 'আপনার অ্যাকাউন্ট',
            bullets: [
              'সঠিক তথ্য দিন এবং পাসওয়ার্ড গোপন রাখুন।',
              'আপনার অ্যাকাউন্টে যা ঘটে তার দায় আপনার।',
              'আপনি যেকোনো সময় অ্যাকাউন্ট মুছে ফেলতে পারেন।',
            ],
          },
          {
            heading: 'রিভিউ ও আপনার জমা দেওয়া অন্যান্য বিষয়বস্তু',
            bullets: [
              'নিজের অভিজ্ঞতা সততার সঙ্গে লিখুন। বেআইনি, আপত্তিকর, বিভ্রান্তিকর বা ব্যক্তিগত তথ্য দেবেন না।',
              'বিষয়বস্তুর মালিকানা আপনারই থাকে। প্রকাশিত থাকা পর্যন্ত সাইটে তা দেখানোর অনুমতি আপনি আমাদের দেন।',
              'এই শর্ত ভাঙলে আমরা বিষয়বস্তু সরিয়ে দিতে পারি।',
            ],
          },
          {
            heading: 'গ্রহণযোগ্য ব্যবহার',
            paragraphs: [
              'সেবার অপব্যবহার করবেন না: এর নিরাপত্তা ভাঙার চেষ্টা, অতিরিক্ত চাপ সৃষ্টি, বা অনুমতি ছাড়া বড় আকারে কপি করা চলবে না।',
            ],
          },
          {
            heading: 'তৃতীয় পক্ষের লিংক',
            paragraphs: [
              'ব্যাংকের ওয়েবসাইটের লিংক আপনার সুবিধার জন্য দেওয়া। ওই সাইটগুলো আমাদের নিয়ন্ত্রণে নয়, এবং সেগুলোর বিষয়বস্তু বা শর্তের দায় আমাদের নয়।',
            ],
          },
          {
            heading: 'দায়ের সীমা',
            paragraphs: [
              'সেবাটি "যেমন আছে" অবস্থায় দেওয়া হয়। আইন যতটুকু অনুমতি দেয়, সাইটের তথ্যের ওপর নির্ভর করে হওয়া ক্ষতির দায় CreditMate AI-এর নয়। আবেদনের আগে ব্যাংকের কাছ থেকে তথ্য যাচাই করুন।',
            ],
          },
          {
            heading: 'পরিবর্তন, প্রযোজ্য আইন ও যোগাযোগ',
            paragraphs: [
              'আমরা এই শর্ত হালনাগাদ করতে পারি এবং নতুন সংস্করণ এখানে প্রকাশ করব। এই শর্ত বাংলাদেশের আইন দ্বারা পরিচালিত। প্রশ্ন: {email}।',
            ],
          },
        ],
      },
      disclaimer: {
        title: 'দাবিত্যাগ: তথ্যের নির্ভুলতা',
        description:
          'CreditMate AI-এর কার্ড তথ্য কোথা থেকে আসে, কেন তা পুরনো হতে পারে, এবং আবেদনের আগে কেন ব্যাংকের কাছে যাচাই করা উচিত।',
        sections: [
          {
            heading: 'তথ্য কোথা থেকে আসে',
            paragraphs: [
              'ফি, সুদের হার ও সুবিধার মতো কার্ডের তথ্য ব্যাংকগুলোর প্রকাশিত সার্ভিস চার্জ তালিকা ও অফিসিয়াল কার্ড পেজ থেকে নেওয়া। ব্যাংকগুলো আমাদের গোপনে এসব তথ্য দেয় না।',
            ],
          },
          {
            heading: 'তথ্য বদলাতে পারে',
            paragraphs: [
              'ব্যাংক যেকোনো সময় ফি, হার ও সুবিধা বদলাতে পারে, সবসময় আগাম জানায়ও না। আমরা যাচাই করলেও আমাদের তথ্য পুরনো, অসম্পূর্ণ বা ভুল হতে পারে। কার্ড সর্বশেষ কবে হালনাগাদ হয়েছে জানা থাকলে কার্ড পেজে সেই তারিখ দেখানো হয়।',
            ],
          },
          {
            heading: 'আবেদনের আগে ব্যাংকের কাছে যাচাই করুন',
            paragraphs: [
              'আবেদনের আগে বর্তমান ফি, সুদের হার, যোগ্যতা ও শর্ত সরাসরি ব্যাংকের কাছ থেকে নিশ্চিত করুন। ব্যাংকের নিজস্ব নথিই চূড়ান্ত।',
            ],
          },
          {
            heading: 'তথ্য না থাকলে',
            paragraphs: [
              'কোনো ব্যাংক কোনো তথ্য প্রকাশ না করলে আমরা "তথ্য পাওয়া যায়নি" বা "অজানা" দেখাই। আমরা অনুমান করে বা আন্দাজ বসিয়ে ফাঁক পূরণ করি না।',
            ],
          },
          {
            heading: 'হাইলাইট ও তুলনা',
            paragraphs: [
              'সুবিধা, বিবেচ্য বিষয় ও তুলনার সারসংক্ষেপ প্রকাশিত তথ্য থেকে সহজ, নির্দিষ্ট নিয়মে তৈরি। এগুলো সুপারিশ নয় এবং আপনার ব্যক্তিগত অবস্থা জানে না।',
            ],
          },
          {
            heading: 'কোনো ভুল পেয়েছেন?',
            paragraphs: [
              'অনুগ্রহ করে {email} ঠিকানায় জানান। কী কী দিতে হবে তা কার্যপদ্ধতি পেজে দেখুন।',
            ],
          },
        ],
      },
      howWeMakeMoney: {
        title: 'আমরা কীভাবে আয় করি',
        description:
          'আমাদের বিজ্ঞাপনদাতা প্রকাশ: CreditMate AI-এর বর্তমানে কোনো ব্যাংকের সঙ্গে অর্থের বিনিময়ের সম্পর্ক নেই, এবং ভবিষ্যতে হলে আমরা কীভাবে তা চিহ্নিত করব।',
        sections: [
          {
            heading: 'বর্তমান অবস্থা',
            paragraphs: [
              'CreditMate AI-এর বর্তমানে কোনো ব্যাংক বা কার্ড ইস্যুকারীর সঙ্গে অর্থের বিনিময়ের সম্পর্ক নেই। আমরা কমিশন, রেফারেল ফি বা অগ্রাধিকারমূলক স্থানের জন্য অর্থ নিই না।',
            ],
          },
          {
            heading: 'এটি বদলালে',
            bullets: [
              'স্পনসর্ড স্থান স্পষ্টভাবে "স্পনসর্ড" হিসেবে চিহ্নিত থাকবে।',
              'অর্থ কখনো কার্ডের রেটিং, র‍্যাঙ্কিং বা বর্ণনায় প্রভাব ফেলবে না।',
              'অর্থের বিনিময়ের কোনো সম্পর্ক শুরুর আগে আমরা এই পেজ হালনাগাদ করব।',
            ],
          },
          {
            heading: 'প্রশ্ন',
            paragraphs: ['এ বিষয়ে যেকোনো প্রশ্ন {email} ঠিকানায় করুন।'],
          },
        ],
      },
      methodology: {
        title: 'কার্যপদ্ধতি',
        description:
          'CreditMate AI কীভাবে কার্ড তালিকাভুক্ত করে, তথ্য কোথা থেকে আসে, কীভাবে মানুষ তা যাচাই করে, ফি মওকুফ ও লাউঞ্জ তথ্য কীভাবে পড়া হয়, এবং ভুল কীভাবে জানাবেন।',
        sections: [
          {
            heading: 'কার্ড কীভাবে তালিকাভুক্ত হয়',
            paragraphs: [
              'বাংলাদেশের ব্যাংকগুলো যেসব ক্রেডিট কার্ড প্রকাশ করে আমরা সেগুলো তালিকাভুক্ত করি। নিষ্ক্রিয় চিহ্নিত কার্ড অনুসন্ধান ও তুলনায় দেখানো হয় না।',
              'বিভাগ পেজগুলো সহজ নিয়মে চলে, যা প্রতিটি পেজে লেখা আছে। যেমন "প্রিমিয়াম" মানে প্রকাশিত বার্ষিক ফি ৩,০০০ টাকা বা তার বেশি।',
            ],
          },
          {
            heading: 'তথ্যের উৎস',
            bullets: [
              'ব্যাংকগুলোর প্রকাশিত সার্ভিস চার্জ তালিকা।',
              'ব্যাংকের অফিসিয়াল কার্ড পেজ ও পণ্যের নথি।',
              'আমাদের গাইডে উল্লেখ থাকলে বাংলাদেশ ব্যাংকের নিয়ম।',
            ],
          },
          {
            heading: 'মানুষের যাচাই',
            paragraphs: [
              'প্রকাশের আগে একজন মানুষ প্রতিটি কার্ডের তথ্য তার উৎসের সঙ্গে মিলিয়ে দেখেন, এবং ব্যাংক প্রকাশিত শর্ত বদলালে আবার দেখেন। জানা থাকলে কার্ড পেজে দেখানো হয় তথ্যটি সর্বশেষ কবে হালনাগাদ হয়েছে।',
            ],
          },
          {
            heading: 'বার্ষিক ফি মওকুফ আমরা কীভাবে পড়ি',
            paragraphs: [
              'ব্যাংক যেভাবে মওকুফের শর্ত লিখেছে, আমরা ঠিক সেভাবেই দেখাই, যেমন বছরে নির্দিষ্ট পরিমাণ খরচ। আপনি যোগ্য হবেন কি না তা আমরা অনুমান করি না। কোনো ব্যাংক মওকুফের শর্ত প্রকাশ না করলে আমরা "মওকুফ নেই" না লিখে "তথ্য পাওয়া যায়নি" দেখাই।',
            ],
          },
          {
            heading: 'লাউঞ্জ সুবিধা আমরা কীভাবে পড়ি',
            bullets: [
              'ব্যাংক যা প্রকাশ করে তা-ই দেখাই, যেমন "৫ বার" বা "সীমাহীন"। কোনো সংখ্যা আমরা বানাই না।',
              '"নেই" মানে ব্যাংক বলেছে লাউঞ্জ সুবিধা নেই।',
              '"অজানা" মানে আমাদের কাছে তথ্য নেই। এর অর্থ এই নয় যে লাউঞ্জ সুবিধা নেই।',
            ],
          },
          {
            heading: 'অর্থের প্রভাব নেই',
            paragraphs: [
              'অর্থ পাওয়ার কারণে কোনো কার্ডকে ওপরে রাখা বা হাইলাইট করা হয় না। "আমরা কীভাবে আয় করি" পেজ দেখুন।',
            ],
          },
          {
            heading: 'ভুল জানান',
            paragraphs: [
              'কার্ডের নাম, যে তথ্যটি ভুল মনে হচ্ছে সেটি, এবং সঠিক মান দেখানো ব্যাংক পেজের লিংকসহ {email} ঠিকানায় ইমেল করুন। আমরা তা দেখব এবং উৎস নিশ্চিত করলে তথ্য সংশোধন করব।',
            ],
          },
        ],
      },
      contact: {
        title: 'যোগাযোগ',
        description:
          'ভুল তথ্য, গোপনীয়তা বিষয়ক অনুরোধ বা অন্য যেকোনো বিষয়ে CreditMate AI-এর সঙ্গে কীভাবে যোগাযোগ করবেন।',
        sections: [
          {
            heading: 'যোগাযোগ করুন',
            paragraphs: [
              'আমাদের সঙ্গে যোগাযোগের সবচেয়ে ভালো উপায় ইমেল। আমরা সাধারণত কয়েক কর্মদিবসের মধ্যে উত্তর দিই।',
            ],
          },
          {
            heading: 'কী নিয়ে লিখবেন',
            bullets: [
              'কার্ডের তথ্যে ভুল। কার্ডের নাম, তথ্যের ক্ষেত্র এবং উৎসের লিংক দিন।',
              'গোপনীয়তা বিষয়ক অনুরোধ: আপনার তথ্যের অ্যাক্সেস, সংশোধন, মুছে ফেলা বা এক্সপোর্ট। আমরা ৩০ দিনের মধ্যে উত্তর দেওয়ার চেষ্টা করি।',
              'নষ্ট পেজ বা লিংক।',
              'CreditMate AI সম্পর্কে অন্য যেকোনো বিষয়।',
            ],
          },
        ],
      },
    },
  },
};

export function getLegalCopy(lang: Language): LegalCopy {
  return LEGAL_COPY[lang];
}
