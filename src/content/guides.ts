/**
 * CreditMate AI - User guide content (task 9.1)
 *
 * This module is the single source of truth for the copy rendered by
 * `src/pages/GuidesPage.tsx`. The same four guides are published as Markdown in
 * `creditmate-ai-be/docs/user/`, and both copies are measured by
 * `docs/user/readability_check.py` (Flesch-Kincaid grade must stay below 8.0).
 *
 * Editorial rules:
 * - No fee, rate or eligibility figure may appear here unless it comes from a
 *   source listed in the matching guide's `sources` array.
 * - Only features that exist in this app may be linked to (currently `/compare`
 *   and `/glossary`).
 */

export interface GuideSource {
  label: string;
  url: string;
  publisher: string;
}

export interface GuideComparisonRow {
  aspect: string;
  debit: string;
  credit: string;
}

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  steps?: string[];
  comparison?: GuideComparisonRow[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  updated: string;
  sections: GuideSection[];
  sources: GuideSource[];
  disclaimer: string;
}

export const SITE_NAME = 'CreditMate AI';
export const SITE_DESCRIPTION =
  'Plain-language guides that help you compare credit cards, fees and benefits in Bangladesh.';

const DISCLAIMER =
  'This guide gives general information. It is not financial advice. Terms change over time. Check the current card terms from your bank before you act.';

const BB_CARD_RULES: GuideSource = {
  label: 'Guidelines on Credit Card Operations of Banks (BRPD-1 Circular No. 09, 15 March 2026)',
  url: 'https://www.bb.org.bd/mediaroom/circulars/brpd/mar152026brpd-19e.pdf',
  publisher: 'Bangladesh Bank',
};

const BB_SCHEDULE_OF_CHARGES: GuideSource = {
  label: 'Schedule of Charges of Banks',
  url: 'https://www.bb.org.bd/en/index.php/financialactivity/schedule_charg',
  publisher: 'Bangladesh Bank',
};

export const guides: Guide[] = [
  {
    slug: 'choosing-your-first-credit-card',
    title: 'How to choose your first credit card',
    description:
      'A simple, step-by-step guide to picking your first credit card in Bangladesh: eligibility, costs, key terms and the rights you have under Bangladesh Bank rules.',
    category: 'Getting started',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Your first card is a loan',
        paragraphs: [
          'Your first credit card is a loan. Your bank lets you spend money now. You pay the bank back later. That sounds simple, but the small print matters. This guide shows you what to check. All the rules here come from Bangladesh Bank. The fees come from your bank. Always read your own bank page too.',
        ],
      },
      {
        heading: 'Check if you can get one',
        paragraphs: [
          'Bangladesh Bank sets the basic rules. You must be a citizen or a resident. You must be 18 years old or older on the day you apply. A student as young as 16 can get a second card. The student must be a dependent on the main cardholder.',
          'You also need a valid e-TIN. Your credit report, called a CIB report, must be clean. You must pass the bank Know Your Customer check. That check asks for your identity papers.',
          'Low-income earners can ask for a secured card. A secured card sits on a fixed deposit. Retirees may qualify on pension and savings income.',
        ],
      },
      {
        heading: 'Know the costs',
        paragraphs: [
          'The annual fee is a price you pay each year. Some cards drop that fee if you spend enough. Read our guide on annual fee waivers to learn more.',
          'Interest is the big cost. Bangladesh Bank caps the yearly interest at 25 percent. The bank charges that rate only on money you owe. It does not charge you on the full bill.',
          'Pay the full bill by the due date. The card then gives you an interest free period. Cash advances break that rule. You may pay interest from day one on cash.',
          'The late fee is a fine for late payment. The bank can charge it once. It cannot stack a new fine on top each day.',
        ],
        bullets: [
          'Annual fee: a yearly price for holding the card.',
          'Interest: what you pay on money you still owe.',
          'Late fee: a one-off fine when you miss the due date.',
          'Cash advance fee: the price of drawing cash on your card.',
        ],
      },
      {
        heading: 'Look at these five things',
        paragraphs: [
          'Compare each card on one page with our compare tool. Use it after you shortlist two or three cards.',
        ],
        steps: [
          'The annual fee, and how to get it waived.',
          'The yearly interest rate, and the grace period.',
          'The late fee and the cash advance fee.',
          'The rewards, such as points or cash back.',
          'The lounge access, if you fly often.',
        ],
      },
      {
        heading: 'Read the right pages',
        paragraphs: [
          'Every bank must post its card terms on its website. The bank must also post its schedule of charges. That list shows each fee in one place. Bangladesh Bank keeps a list of bank links too.',
        ],
        bullets: [
          'What is the annual fee in the first year?',
          'How do I get that fee waived?',
          'How many days do I get interest free?',
          'What happens if I pay late?',
        ],
      },
      {
        heading: 'Know your rights',
        paragraphs: [
          'Your bank cannot send you a card you did not ask for. It cannot raise your limit or swap your card without your OK. A text code must confirm each new card before you use it.',
          'The bank must tell you 30 days before any fee change. It must highlight the new part. You can close the card free if the terms get worse for you.',
          'You can ask to close a card through a hotline, email or a branch. The bank has seven working days to close it. Any credit left on the card goes back to your bank account.',
          'Report a lost card fast. Your bank must block it at once. It must pay back any charge you did not make within seven working days.',
        ],
      },
      {
        heading: 'Before you apply',
        steps: [
          'Pick two or three cards you like.',
          'Read the fee page for each card.',
          'Work out your cost for one full year.',
          'Check your pay against the due date.',
          'Apply with your e-TIN and your ID.',
        ],
        paragraphs: [
          'Do not chase a bonus you will not use. A low fee you can pay beats a big perk you never touch.',
        ],
      },
    ],
    sources: [
      BB_CARD_RULES,
      BB_SCHEDULE_OF_CHARGES,
      {
        label: 'Credit cards listed by Eastern Bank PLC',
        url: 'https://ebl.com.bd/retail/EBL-Cards',
        publisher: 'Eastern Bank PLC',
      },
    ],
    disclaimer: DISCLAIMER,
  },
  {
    slug: 'understanding-annual-fee-waivers',
    title: 'Understanding annual fee waivers',
    description:
      'What an annual fee is, how credit card fee waivers work in Bangladesh, the Bangladesh Bank rules that protect you, and how to ask your bank for a waiver.',
    category: 'Fees',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Why this matters',
        paragraphs: [
          'An annual fee can eat into your savings. A waiver can save you that cash. This guide explains both. It shows what the law says. It shows how to ask for a waiver. It shows what to do if your bank says no.',
        ],
      },
      {
        heading: 'What is an annual fee?',
        paragraphs: [
          'An annual fee is the price of holding a card. Your bank charges it once a year. Bangladesh Bank calls it a non-transactional fee. That name means the fee is not linked to a sale. Other examples are the card report fee and the text alert fee.',
          'Your bank cannot charge that fee before your card works. A card you never activated must not cost you.',
          'Paying only that fee cannot make you late. If you owe nothing on sales, no extra fine applies. The bank may add the normal interest on the fee. It must not mark you as a bad payer for the fee.',
        ],
      },
      {
        heading: 'What is a waiver?',
        paragraphs: [
          'A waiver is a promise to drop a fee. The bank sets the terms of the waiver. Common terms look like this:',
        ],
        bullets: [
          'Spend a set amount in a year.',
          'Make a set number of sales each year.',
          'Pay the full bill on time.',
          'Keep a set balance in your account.',
        ],
      },
      {
        heading: 'What the rules say',
        paragraphs: ['Bangladesh Bank has clear rules on fees. Your bank must follow them all.'],
        steps: [
          'No fee before the card is active.',
          'No extra fine when only the fee is left to pay.',
          'No bad credit mark for unpaid fees.',
          'Late fines can be charged only once at a time.',
          'A late fine never joins the sum used to work out interest.',
        ],
      },
      {
        heading: 'How to get a waiver',
        paragraphs: [
          'Each bank sets its own terms. We list the words each bank uses on our compare page. Tick the box marked Has Fee Waiver Policy to see them. Keep every email. Keep every text message. They are your proof.',
          'Some banks state the deal in plain words. Eastern Bank PLC lists cards with a yearly fee waiver. It also lists cards with no renewal fee. Some of its cards ask for 24 sales a year. Others drop the fee for life.',
        ],
        steps: [
          'Open your bank schedule of charges.',
          'Find the row for your card annual fee.',
          'Read the waiver terms in that row.',
          'Ask your banker to confirm the terms by email.',
          'Meet the terms before the fee date.',
          'Check your next bill for the waiver.',
        ],
      },
      {
        heading: 'If the fee still shows up',
        paragraphs: [
          'Ask for the reason in writing. Your bank must tell you 30 days before a fee change. It must send that note in clear writing. The changed part must stand out. If the change hurts you, you can close the card. The bank must close it with no extra charge.',
          'Bangladesh Bank runs a Customers Interest Protection Center. You can call 16236 or write to bb.cipc@bb.org.bd. Your bank must also name a dispute officer on its website. Ask for a complaint number when you call.',
        ],
      },
      {
        heading: 'When a waiver is not worth it',
        paragraphs: [
          'A waiver often comes with a high spend target. Do not buy things just to hit that target. Work out the fee you save. Then work out what you must spend to earn it.',
        ],
        bullets: [
          'Will I hit the target in normal life?',
          'Does the card charge a high fee to start?',
          'Is there a cheaper card with a no strings waiver?',
        ],
      },
    ],
    sources: [
      BB_CARD_RULES,
      BB_SCHEDULE_OF_CHARGES,
      {
        label: 'Fee and charge pages',
        url: 'https://www.ebl.com.bd/charges',
        publisher: 'Eastern Bank PLC',
      },
      {
        label: 'Credit cards and their fee waivers',
        url: 'https://ebl.com.bd/retail/EBL-Cards',
        publisher: 'Eastern Bank PLC',
      },
    ],
    disclaimer: DISCLAIMER,
  },
  {
    slug: 'maximizing-lounge-access-benefits',
    title: 'Maximizing lounge access benefits',
    description:
      'Learn how to use your credit card airport lounge benefit in Bangladesh: where lounges are, what to check, how to get more visits and what to do if access is refused.',
    category: 'Benefits',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Why this matters',
        paragraphs: [
          'Airport lounges make travel calm. You get a seat, a drink and fast wifi. Some credit cards open that door for you. This guide shows how to use that perk well. It also shows the fine print to read first.',
        ],
      },
      {
        heading: 'What lounge access means',
        paragraphs: [
          'A lounge is a quiet room past the security gate. Some are for all guests. Others are for invited guests only. A bank may give you free visits. It may also sell you a pass.',
          'Card perks are set by the bank, not by law. Read the card terms to see what you get. Check the count for your own card. The count for one card rarely matches the next.',
        ],
      },
      {
        heading: 'Where lounges are in Bangladesh',
        paragraphs: [
          'Banks run their own lounges in our four big airports. Mutual Trust Bank runs lounges at these airports:',
        ],
        bullets: [
          'Hazrat Shahjalal International Airport, Dhaka',
          'Shah Amanat International Airport, Chattogram',
          'Osmani International Airport, Sylhet',
          "Cox's Bazar Airport",
        ],
      },
      {
        heading: 'Read the fine print',
        paragraphs: [
          'The bank says its premium cardholders can use the rooms as per policy. That phrase means terms apply. Read the terms for your card before you fly.',
          'Some banks join world wide lounge groups. Eastern Bank PLC lists lounge access with SKYLOUNGE. It also lists a Priority Pass plan. Those groups work in airports outside Bangladesh. Save the fee list for your card. Keep it with your tickets.',
        ],
        bullets: [
          'Is the lounge in your city, or abroad?',
          'How many free visits do you get?',
          'Do the visits reset each year or each bill?',
          'Can you bring a friend in?',
          'Do you pay a fee after the free visits end?',
          'Must you book a seat before you go?',
        ],
      },
      {
        heading: 'Five ways to get more from it',
        steps: [
          'Check your visit count before you book a trip.',
          'Carry your card and your boarding pass.',
          'Reach the airport one hour early.',
          'Ask if a guest can come in with you.',
          'Save your lounge receipt for your claim.',
        ],
        paragraphs: [
          'Our compare page shows the lounge count for each card. Use the lounge filters to sort them. You can set a low mark for a count.',
        ],
      },
      {
        heading: 'Mistakes to skip',
        paragraphs: [
          'Do not pay for a lounge you already get free. Show your card first. Do not assume a pass works at every gate. Check the lounge map for the day of your flight.',
          'Do not let a lounge plan drive your card choice. The fee for a card can be worth more than the lounge. Do the math for your own travel each year.',
        ],
      },
      {
        heading: 'If access is refused',
        paragraphs: [
          'Ask the lounge desk for the reason in writing. Ask your bank the same question. Take a photo of the screen or the note.',
          'Ask your bank for a complaint number. Your bank must name a dispute officer on its website. You can also call Bangladesh Bank at 16236. Write to bb.cipc@bb.org.bd if the case drags on.',
        ],
      },
    ],
    sources: [
      BB_CARD_RULES,
      {
        label: 'MTB Air Lounge network',
        url: 'https://www.mutualtrustbank.com/mtb-air-lounge/',
        publisher: 'Mutual Trust Bank PLC',
      },
      {
        label: 'MTB LoungeKey',
        url: 'https://www.mutualtrustbank.com/cards/mtb-lounge-key/',
        publisher: 'Mutual Trust Bank PLC',
      },
      {
        label: 'Credit cards and lounge perks',
        url: 'https://ebl.com.bd/retail/EBL-Cards',
        publisher: 'Eastern Bank PLC',
      },
    ],
    disclaimer: DISCLAIMER,
  },
  {
    slug: 'credit-card-vs-debit-card',
    title: 'Credit card vs debit card in Bangladesh',
    description:
      'See how credit cards and debit cards differ in Bangladesh: where the money comes from, interest, fees, limits, and which card fits each kind of spending.',
    category: 'Basics',
    readingTime: '5 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Both cards look the same. They work in a very different way. One spends your own cash. The other spends the bank cash. This guide shows the gap in plain words. It helps you pick the right card for the job.',
        ],
      },
      {
        heading: 'How a debit card works',
        paragraphs: [
          'A debit card links to your bank account. Your bank gives you one when you open a savings or current account. The cash leaves your account as you spend. You can only spend the cash you hold.',
          'Bangladeshi banks issue chip and PIN debit cards. The chip makes each sale safe. Dutch-Bangla Bank says its Visa card works at Visa tills and ATMs. It says the card also works for online sales. Mutual Trust Bank says the same for its own debit cards.',
        ],
        bullets: ['At an ATM machine', 'At a shop till', 'On an online store'],
      },
      {
        heading: 'How a credit card works',
        paragraphs: [
          'A credit card is a small loan in your pocket. Your bank gives you a set sum to spend. You pay the bank back on a set date. Bangladesh Bank calls that sum a credit limit.',
          'Only a bank can give you a credit card in Bangladesh. Any scheduled bank may issue a Taka card. A bank that handles foreign cash may issue a foreign card.',
          'If you pay the full bill on time, you get an interest free period. If you pay part of it, interest starts the day after the due date. The bank never charges you interest from the day of sale. Cash advances are the one case that breaks this rule.',
        ],
      },
      {
        heading: 'Side by side',
        paragraphs: ['Here is how the two cards compare.'],
        comparison: [
          {
            aspect: 'Where the cash comes from',
            debit: 'Your own account',
            credit: 'Your bank loan',
          },
          { aspect: 'Who you pay back', debit: 'No one, the cash is gone', credit: 'The bank' },
          { aspect: 'Usable amount', debit: 'Cash you hold', credit: 'Your credit limit' },
          {
            aspect: 'Yearly interest',
            debit: 'None on a normal sale',
            credit: 'Up to 25 percent on what you owe',
          },
          { aspect: 'Interest free days', debit: 'Not in play', credit: 'Yes, if you pay in full' },
          {
            aspect: 'Cash from an ATM',
            debit: 'Cash you hold',
            credit: 'Up to half your limit',
          },
          { aspect: 'Annual fee', debit: 'Some banks charge one', credit: 'Some banks charge one' },
          { aspect: 'Lounge and reward perks', debit: 'Rare', credit: 'Common' },
          {
            aspect: 'Miss a payment',
            debit: 'Your spend stops',
            credit: 'A fine and a credit mark',
          },
        ],
      },
      {
        heading: 'What to watch out for',
        paragraphs: [
          'Your credit card can cost more than you think. Interest grows fast on a rolled over sum. A late payment adds a fine. It also goes to your credit report.',
          'The bank must send a clear bill each month. That bill comes at least 14 days before any interest. It must show the total due, the least you can pay and the due date. It also carries a warning about paying only the least.',
          'Your debit card cannot take you past your own cash. That is a hard stop, and it is a good guard. Watch for a low balance when a shop holds a sum for a card hold.',
        ],
      },
      {
        heading: 'Which card should you use?',
        paragraphs: [
          'Use a debit card when you want to spend your own cash. It is the safe pick for daily bills. It works well for a set budget.',
          'Use a credit card when you can pay the full bill each month. It gives you a free loan for a few weeks. It also gives you perks such as lounge access.',
          'Use both for what they do best. Many people in Bangladesh do just that.',
        ],
      },
      {
        heading: 'If you do not have a credit card yet',
        paragraphs: [
          'Read our first credit card guide. It walks you through the steps. Then compare cards on our compare page. The filters can show only cards with a fee waiver or a lounge plan.',
        ],
      },
    ],
    sources: [
      BB_CARD_RULES,
      {
        label: 'VISA Debit Card',
        url: 'https://www.dutchbanglabank.com/electronic-banking/visadebitcard.html',
        publisher: 'Dutch-Bangla Bank PLC',
      },
      {
        label: 'MasterCard Debit',
        url: 'https://www.dutchbanglabank.com/electronic-banking/mastercarddebit.html',
        publisher: 'Dutch-Bangla Bank PLC',
      },
      {
        label: 'Debit cards',
        url: 'https://www.mutualtrustbank.com/cards/debit-card/',
        publisher: 'Mutual Trust Bank PLC',
      },
      BB_SCHEDULE_OF_CHARGES,
    ],
    disclaimer: DISCLAIMER,
  },
];

export const guideSlugs: string[] = guides.map(guide => guide.slug);

export const getGuide = (slug: string | undefined): Guide | undefined =>
  guides.find(guide => guide.slug === slug);
