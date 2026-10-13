/**
 * CreditMate AI - User guide content (task 9.1)
 *
 * This module is the single source of truth for the copy rendered by
 * `src/pages/GuidesPage.tsx`. The same four guides are published as Markdown in
 * `creditmate-ai-be/docs/user/`, and both copies are measured by
 * `docs/user/readability_check.py` (Flesch-Kincaid grade must stay below 8.0)
 * and cross-checked with `docs/user/readability_textstat.py`.
 *
 * Editorial rules:
 * - No fee, rate or eligibility figure may appear here unless it comes from a
 *   source listed in the matching guide's `sources` array.
 * - Regulatory summaries must keep the qualifications in the source (for
 *   example the 7 working day closure deadline applies only when there is no
 *   outstanding balance).
 * - Only features that exist in this app may be described. The filter panel
 *   (fee waiver, lounge) lives on `/`; `/compare` only shows cards that were
 *   already selected on `/`.
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

export interface GuideFaq {
  question: string;
  /**
   * Must restate something the guide body already says. FAQPage markup has to
   * match visible text.
   */
  answer: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  updated: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  sources: GuideSource[];
  disclaimer: string;
  /** Language of this guide. Defaults to 'en'. */
  language?: 'en' | 'bn';
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
          'Bangladesh Bank sets the basic rules. You must be a citizen or a resident. You must be 18 years old or older on the day you apply. A student aged 16 can get a second card. The student must be directly dependent on the main cardholder.',
          'You also need a valid e-TIN. Your credit report, called a CIB report, must be clean. You must pass the bank Know Your Customer check. That check asks for your identity papers.',
          'A bank may give a low-income applicant a card that sits on a fixed deposit. Retirees may qualify on pension and investment income. Neither one is a right. The bank decides.',
        ],
      },
      {
        heading: 'Know the costs',
        paragraphs: [
          'The annual fee is a price you pay each year. Some cards drop that fee if you spend enough. Read our guide on annual fee waivers to learn more.',
          'Interest is the big cost. Bangladesh Bank caps the yearly interest at 25 percent. The bank charges that rate only on money you owe. It does not charge you on the full bill.',
          'Pay the full bill by the due date. The card then gives you an interest free period. A cash advance may not get that free period. You could owe interest sooner on cash than on a purchase.',
          'The late fee is a fine for late payment. The bank can charge it once, unless you have made new buys. It cannot add a fresh fine each day. The fine never joins the sum used to work out interest.',
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
          'To line cards up side by side, start on the home page. Pick two to four cards there, then press Compare Cards.',
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
          'Only the main cardholder can ask to close a card. You can use a hotline, email, website or a branch. If you owe nothing, the bank must close it within seven working days. Any credit left then goes back to your bank account.',
          'Report a lost card fast. Your bank must block it at once. Once the bank knows the card is lost or stolen, it must pay back any charge you did not make. It has seven working days to do that.',
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
    faqs: [
      {
        question: 'How old do I need to be to get a credit card in Bangladesh?',
        answer:
          'You must be 18 years old or older on the day you apply. A student aged 16 can get a second card, but the student must be directly dependent on the main cardholder.',
      },
      {
        question: 'What is the most yearly interest a bank can charge?',
        answer:
          'Bangladesh Bank caps the yearly interest at 25 percent. The bank charges that rate only on the money you still owe, not on the full bill.',
      },
      {
        question: 'What happens if I owe nothing and ask to close my card?',
        answer:
          'If you owe nothing, the bank must close the card within seven working days. Any credit left then goes back to your bank account.',
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
    language: 'en',
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
          'An annual fee is the price of holding a card. Your bank charges it once a year. Bangladesh Bank calls it a non-transactional fee. That name means the fee is not linked to a sale. The rule also names the CIB fee and the SMS fee as examples.',
          'Your bank cannot charge that fee before your card works. A card you never activated must not cost you.',
          'Paying only that fee cannot make you late. If you owe nothing on sales, no extra fine applies. The bank may add the normal interest on the fee. It must not mark you as a bad payer for the fee.',
          'If you pay only part of your bill, the bank may settle that fee first. It then adjusts what you owe on sales.',
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
          'Late fines can be charged only once, and only if no new sale is added.',
          'A late fine never joins the sum used to work out interest.',
        ],
      },
      {
        heading: 'How to get a waiver',
        paragraphs: [
          'Each bank sets its own terms. Start on our home page. Tick the box marked Has Fee Waiver Policy. The list then shows only the cards that publish a waiver rule. Keep every email. Keep every text message. They are your proof.',
          'Some banks state the deal in plain words. Eastern Bank PLC lists cards with a yearly fee waiver. It also lists cards with no renewal fee. Some of its cards ask for 24 sales a year. Others drop the fee for life.',
          'Bangladesh Bank keeps links to every bank fee page. Use that page to find the right link. Our home page lists the waiver rule for each card we track.',
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
          'Ask for the reason in writing. Your bank must tell you 30 days before a fee change. It must send that note in clear writing. The changed part must stand out. If the change hurts you, you can surrender the card. The bank must allow that with no extra charge.',
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
    faqs: [
      {
        question: 'What is an annual fee?',
        answer:
          'An annual fee is the price of holding a card. Your bank charges it once a year. Bangladesh Bank calls it a non-transactional fee.',
      },
      {
        question: 'Can my bank charge the annual fee before my card is active?',
        answer:
          'No. Your bank cannot charge that fee before your card works. A card you never activated must not cost you.',
      },
      {
        question: 'Can paying only the annual fee make me late?',
        answer:
          'No. Paying only that fee cannot make you late. The bank may add normal interest on the fee, but it must not mark you as a bad payer for the fee.',
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
    language: 'en',
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
          'The bank says its privilege clients and premium credit card holders can use the rooms as per policy. That phrase means terms apply. Read the terms for your card before you fly.',
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
          'Our home page shows the lounge count for each card. Tick Any Lounge Access to cut the list down. You can also set a lowest number of visits. Pick the cards you like, then press Compare Cards to see them side by side.',
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
    faqs: [
      {
        question: 'Are airport lounge perks set by law?',
        answer:
          'No. Card perks are set by the bank, not by law. Read the card terms to see what you get, and check the count for your own card.',
      },
      {
        question: 'What should I do if a lounge refuses my card?',
        answer:
          'Ask the lounge desk for the reason in writing, and ask your bank the same question. Take a photo of the screen or the note. Ask your bank for a complaint number.',
      },
      {
        question: 'Who can I contact about a refused lounge visit?',
        answer:
          'Your bank must name a dispute officer on its website. You can also call Bangladesh Bank at 16236, or write to bb.cipc@bb.org.bd if the case drags on.',
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
    language: 'en',
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
          'If you pay the full bill on time, you get an interest free period. If you pay part of it, interest starts the day after the due date. The bank never charges you interest from the day of sale. A cash advance may have no interest free period, so you could owe interest sooner on cash.',
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
          'Read our first credit card guide. It walks you through the steps. Then open our home page. The filters there can show only cards with a fee waiver or a lounge plan. Pick two or three, then press Compare Cards.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Where does the money come from on each card?',
        answer:
          'A debit card spends your own cash from your account. A credit card is a loan from your bank, and you pay the bank back later.',
      },
      {
        question: 'Can a debit card take me past my balance?',
        answer:
          'No. Your debit card cannot take you past your own cash. That is a hard stop, and it is a good guard.',
      },
      {
        question: 'How much interest can a credit card charge?',
        answer:
          'Bangladesh Bank caps the yearly interest on a credit card at 25 percent, and only on what you owe. If you pay the full bill on time, you get an interest free period.',
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
    language: 'en',
  },
  {
    slug: 'create-account-sign-in',
    title: 'Create an account and sign in',
    description:
      'Step-by-step guide to creating your CreditMate AI account, signing in, resetting your password, and managing your session.',
    category: 'Account',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Why create an account?',
        paragraphs: [
          'An account lets you save comparisons, organize cards into collections, set up email alerts for card changes, and write community reviews. Your data stays private unless you choose to share it.',
        ],
      },
      {
        heading: 'Create your account',
        steps: [
          'Open the home page and click "Sign up" in the top right.',
          'Enter your email address and a strong password.',
          'Check your email for the verification link and click it.',
          'Return to CreditMate AI and sign in with your new credentials.',
        ],
        paragraphs: [
          'The sign-up form validates your email format and requires a password of at least 8 characters. If the email is already registered, you will see a prompt to sign in instead.',
        ],
      },
      {
        heading: 'Sign in',
        steps: [
          'Click "Sign in" in the top right.',
          'Enter your registered email and password.',
          'Click the "Sign in" button.',
        ],
        paragraphs: [
          'If you forget your password, click "Forgot password?" on the sign-in page. You will receive a reset link by email.',
        ],
      },
      {
        heading: 'Reset your password',
        steps: [
          'On the sign-in page, click "Forgot password?".',
          'Enter your registered email address.',
          'Check your email for the reset link (valid for 1 hour).',
          'Click the link and enter a new password.',
          'Sign in with your new password.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Stay signed in',
        paragraphs: [
          'Your session lasts 14 days. After that, you will be asked to sign in again. There is no "Remember me" checkbox; the 14-day expiry is fixed for security.',
        ],
      },
      {
        heading: 'Sign out',
        steps: ['Open the account menu (your email in the top right).', 'Click "Sign out".'],
        paragraphs: [
          'Signing out clears your session on this device. Saved comparisons, collections, and alert subscriptions stay linked to your account and will be there when you sign in again.',
        ],
      },
      {
        heading: 'Troubleshooting',
        bullets: [
          'No verification email? Check spam/junk, then request a new one from the sign-in page.',
          'Reset link expired? Request a new one — links expire after 1 hour.',
          'Still stuck? Contact support from the About page.',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'Can I use CreditMate AI without an account?',
        answer:
          'Yes. You can browse cards, filter, compare, and use the quiz and calculator without signing in. An account is only needed to save, share, set alerts, or write reviews.',
      },
      {
        question: 'What if I do not receive the verification email?',
        answer:
          'Check your spam or junk folder. If it is not there, wait a minute and click "Resend verification email" on the sign-in page.',
      },
      {
        question: 'How long does a session last?',
        answer:
          '14 days. After that you must sign in again. There is no way to extend this for security reasons.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI authentication flow',
        url: 'https://creditmate.ai/auth',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'save-share-comparison',
    title: 'Save and share a comparison',
    description:
      'Learn how to save a card comparison, give it a name, make it public, and share a link with others.',
    category: 'Tools',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Before you start',
        paragraphs: [
          'You must be signed in. The comparison must have 2 to 4 cards selected on the home page, then you press "Compare Cards" to open the comparison view.',
        ],
      },
      {
        heading: 'Save a comparison',
        steps: [
          'On the comparison page (/compare), click "Save comparison".',
          'Enter a name for your comparison (e.g., "Travel cards shortlist").',
          'Choose "Private" (only you can see it) or "Public" (anyone with the link can view).',
          'Click "Save".',
        ],
        paragraphs: [
          'Saved comparisons appear on your Saved page (/saved). Private comparisons show a lock icon; public ones show a link icon.',
        ],
      },
      {
        heading: 'Share a comparison',
        steps: [
          'On the Saved page, find your comparison.',
          'Click "Copy share link".',
          'Paste the link into a message, email, or document.',
        ],
        paragraphs: [
          'The link looks like https://creditmate.ai/shared/<token>. Anyone who opens it sees the same side-by-side comparison. They do not need an account.',
        ],
      },
      {
        heading: 'Manage saved comparisons',
        bullets: [
          'Rename: click the pencil icon next to the name.',
          'Toggle public/private: edit the comparison and change the visibility.',
          'Delete: click the trash icon. This cannot be undone.',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'How many comparisons can I save?',
        answer:
          'There is no hard limit, but very large numbers may slow down the Saved page. We recommend keeping only the ones you actively use.',
      },
      {
        question: 'Can I edit the cards in a saved comparison?',
        answer:
          'No. A saved comparison is a snapshot. To change the cards, create a new comparison on the home page and save it.',
      },
      {
        question: 'Does a public link expire?',
        answer: 'No. The link works until you delete the comparison or make it private.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI saved comparisons feature',
        url: 'https://creditmate.ai/saved',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'organize-cards-collections',
    title: 'Organize cards in collections',
    description:
      'Create named collections, add cards with personal notes, and share collections with others.',
    category: 'Tools',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'What is a collection?',
        paragraphs: [
          'A collection is a named group of cards you curate. Unlike a comparison (which is a fixed side-by-side view of 2–4 cards), a collection can hold any number of cards. You can add notes to each card — for example, why you shortlisted it or what you liked about it.',
        ],
      },
      {
        heading: 'Create a collection',
        steps: [
          'Go to /saved and click "New collection".',
          'Enter a name (required) and an optional description.',
          'Choose "Private" or "Public".',
          'Click "Create".',
        ],
        paragraphs: [],
      },
      {
        heading: 'Add cards to a collection',
        steps: [
          'Open the collection from the Saved page.',
          'Click "Add card".',
          'Enter the card ID (you can find this on the card detail page URL: /card/<bank>/<card>).',
          'Optionally add a note (e.g., "Good for travel, 4 lounge visits/year").',
          'Click "Add".',
        ],
        paragraphs: [
          'You can also add cards from a card detail page: click "Add to collection" and pick an existing collection or create a new one.',
        ],
      },
      {
        heading: 'Manage cards in a collection',
        bullets: [
          'Edit note: click the note text, change it, press Enter.',
          'Remove card: click the remove icon next to the card.',
          'Reorder: drag and drop (desktop) or use the move buttons (mobile).',
        ],
        paragraphs: [],
      },
      {
        heading: 'Share a collection',
        steps: [
          'Open the collection.',
          'Click "Copy share link".',
          'Share the link. Viewers see the cards and your notes (if public).',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'How is a collection different from a saved comparison?',
        answer:
          'A comparison is a fixed side-by-side view of 2–4 cards. A collection is a flexible list of any number of cards with your personal notes. Collections do not have the side-by-side table view.',
      },
      {
        question: 'Can I add the same card to multiple collections?',
        answer: 'Yes. A card can belong to as many collections as you like.',
      },
      {
        question: 'Do shared collections show my notes?',
        answer: 'Yes, if the collection is public. Private collections are only visible to you.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI collections feature',
        url: 'https://creditmate.ai/saved',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'email-alerts-card-changes',
    title: 'Get email alerts when a card changes',
    description:
      'Set up email notifications for fee changes, APR changes, new cards, or any change on cards you watch.',
    category: 'Account',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'How alerts work',
        paragraphs: [
          'When you "watch" a card, you create a subscription. Our system checks for changes daily. If a change matches your subscription type, you get an email (or a digest, depending on your preference).',
        ],
      },
      {
        heading: 'Watch a card',
        steps: [
          'Sign in.',
          'Open a card detail page (/card/<bank>/<card>).',
          'Click "Watch this card".',
          'Choose the alert type: Fee changes, APR changes, New cards, or Any change.',
          'Click "Confirm".',
        ],
        paragraphs: [],
      },
      {
        heading: 'Choose delivery frequency',
        steps: [
          'Go to /alerts.',
          'Under "Notification Preferences", pick: Immediate (email per change), Daily digest (one email per day), or Weekly digest (one email per week).',
          'Click "Save preferences".',
        ],
        paragraphs: [],
      },
      {
        heading: 'Manage subscriptions',
        paragraphs: [
          'On the /alerts page you see all your subscriptions. Each shows the alert type, the card name, and when you created it. Click "Remove" to stop watching that card.',
        ],
      },
      {
        heading: 'Unsubscribe from all alerts',
        steps: [
          'Go to /alerts.',
          'Click "Unsubscribe me" at the bottom.',
          'Confirm. You will stop receiving all alert emails.',
        ],
        paragraphs: ['You can re-subscribe anytime from /alerts or by watching a card again.'],
      },
    ],
    faqs: [
      {
        question: 'What counts as a "change"?',
        answer:
          'Fee changes: annual fee amount or waiver terms. APR changes: purchase or cash advance rate. New cards: a new card added to our database. Any change: any of the above.',
      },
      {
        question: 'How often are changes checked?',
        answer:
          'Daily. If you choose "Immediate", you get an email soon after the daily check detects a change. Digests group changes into one email.',
      },
      {
        question: 'Can I watch a card without an account?',
        answer: 'No. You must be signed in to create a subscription.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI alerts feature',
        url: 'https://creditmate.ai/alerts',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'write-read-community-reviews',
    title: 'Write and read community reviews',
    description:
      'How to write a review for a credit card, edit or delete your review, vote on helpfulness, and read what other cardholders say.',
    category: 'Community',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Who can write a review?',
        paragraphs: [
          'Any signed-in user. You do not need to own the card, but reviews from verified cardholders (detected via your saved cards or collections) show a "Verified cardholder" badge.',
        ],
      },
      {
        heading: 'Write a review',
        steps: [
          'Open a card detail page.',
          'Scroll to "Customer Reviews" and click "Write a Review".',
          'Select a star rating (1–5).',
          'Enter a title (max 100 characters).',
          'Write your review (max 5,000 characters).',
          'Optionally add Pros and Cons (max 500 characters each).',
          'Click "Submit review".',
        ],
        paragraphs: [
          'Your review goes into moderation. It will be visible to others after approval (usually 24–48 hours). You will see "Pending moderation" on your review until then.',
        ],
      },
      {
        heading: 'Edit or delete your review',
        steps: [
          'Open the card detail page and find your review in the list.',
          'Click "Edit" to change the rating, title, body, pros, or cons. The review goes back to moderation.',
          'Click "Delete" to remove it permanently. Confirm in the dialog.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Vote on helpfulness',
        steps: [
          'On any review, click the thumbs-up icon.',
          'The count increments. Click again to remove your vote.',
        ],
        paragraphs: ['You must be signed in to vote. You can vote on any review except your own.'],
      },
      {
        heading: 'Read reviews',
        paragraphs: [
          'Reviews show the author name, star rating, date, and "Verified cardholder" badge when applicable. Sort by Newest, Oldest, Most helpful, Highest rating, or Lowest rating. Pagination shows 10 reviews per page.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long does moderation take?',
        answer:
          'Usually 24–48 hours. Reviews that violate guidelines (spam, abuse, off-topic) are rejected.',
      },
      {
        question: 'Can I review a card I do not own?',
        answer: 'Yes. The review will not show the "Verified cardholder" badge.',
      },
      {
        question: 'What are the character limits?',
        answer: 'Title: 100. Body: 5,000. Pros/Cons: 500 each.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI reviews feature',
        url: 'https://creditmate.ai/card/<bank>/<card>',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'advanced-search-filters',
    title: 'Use advanced search and filters',
    description:
      'Master the filter panel on the home page: bank selection, fee ranges, interest rate ranges, fee waiver, lounge access, feature search, and keyword search.',
    category: 'Tools',
    readingTime: '5 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Open the filter panel',
        steps: [
          'Go to the home page (/).',
          'Click "Expand" on the "Filter Options" panel (left side on desktop, top on mobile).',
        ],
        paragraphs: [],
      },
      {
        heading: 'Filter by bank',
        paragraphs: [
          'Check one or more banks in the "Banks" section. The card list updates to show only cards from those banks.',
        ],
      },
      {
        heading: 'Filter by annual fee',
        paragraphs: [
          'Use "Min (BDT)" and "Max (BDT)" to set a numeric range. Or use "Or Range (min,max)" with a comma (e.g., "0,200"). Tick "Has Annual Fee" to show only cards with a fee, or untick to show only no-fee cards. Tick "Has Fee Waiver Policy" to show only cards that publish a waiver rule.',
        ],
      },
      {
        heading: 'Filter by interest rate (APR)',
        paragraphs: [
          'Set Min (%) and Max (%) for purchase APR. Or use "Or Range (min,max)" (e.g., "18.0,25.0").',
        ],
      },
      {
        heading: 'Filter by lounge access',
        paragraphs: [
          'Tick "Any Lounge Access" for cards with any lounge benefit. Tick "International Lounge Access" or "Domestic Lounge Access" for specific types. Set "Min International" and "Min Domestic" for minimum visit counts per year.',
        ],
      },
      {
        heading: 'Filter by features',
        paragraphs: [
          'Tick "Has Additional Features" to show only cards that list extra features. Use "Search in features" to find cards mentioning a specific keyword in their feature list (e.g., "insurance", "concierge").',
        ],
      },
      {
        heading: 'Keyword search',
        paragraphs: [
          'Use "Search by card name or features" at the bottom of the panel. This searches card names, bank names, and feature text.',
        ],
      },
      {
        heading: 'Apply, reset, and combine',
        steps: [
          'Click "Apply Filters" to run the query.',
          'Click "Reset" to clear all filters at once.',
          'Filters combine with AND logic: a card must match every active filter to appear.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Autocomplete search bar',
        paragraphs: [
          'The search bar in the header suggests cards, banks, and categories as you type. Select a suggestion to go directly to that card, bank category page, or filter results.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I filter by multiple banks at once?',
        answer: 'Yes. Check as many banks as you like. Results show cards from any checked bank.',
      },
      {
        question: 'What does "Has Fee Waiver Policy" mean?',
        answer:
          'The card issuer publishes a rule (e.g., "24 transactions/year waives the fee"). The filter shows only cards with such a published rule.',
      },
      {
        question: 'Why do no cards appear after I apply filters?',
        answer: 'The filters may be too restrictive. Try widening ranges or unchecking some boxes.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI filter panel',
        url: 'https://creditmate.ai/',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'switch-dark-mode-language',
    title: 'Switch dark mode and language',
    description:
      'How to toggle dark/light mode and switch between English and Bengali. Both settings persist across sessions.',
    category: 'Basics',
    readingTime: '3 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Dark mode',
        steps: [
          'Click the moon/sun icon in the top right (next to the language button).',
          'The page instantly switches. Your choice is saved in your browser and applies on future visits.',
        ],
        paragraphs: [
          'Dark mode uses a dark background with light text. Light mode uses a light background with dark text. The toggle respects your system preference on first visit.',
        ],
      },
      {
        heading: 'Language (English / Bengali)',
        steps: [
          'Click the language button in the top right (shows "BN" when English is active, "EN" when Bengali is active).',
          'The UI text switches immediately. Your choice is saved and applies on future visits.',
        ],
        paragraphs: [
          'The app translates navigation, buttons, form labels, and guide content. Some third-party content (bank names, external links) remains in English. Bengali translations are community-reviewed; see the glossary for term definitions in both languages.',
        ],
      },
      {
        heading: 'Keyboard shortcuts',
        paragraphs: [
          'There are no dedicated keyboard shortcuts for these toggles. Use Tab to focus the buttons, then Enter or Space to activate.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does dark mode work on all pages?',
        answer:
          'Yes. The theme applies to the entire app, including guides, card detail pages, and the comparison view.',
      },
      {
        question: 'Is every page fully translated to Bengali?',
        answer:
          'Navigation, buttons, form labels, alerts, reviews, and guides are translated. Bank names, card names, and external source text remain in English.',
      },
      {
        question: 'How do I reset to system preference?',
        answer:
          'Clear your browser localStorage for this site, or open in a private window. The app will then follow your OS theme and browser language.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI theme and language settings',
        url: 'https://creditmate.ai/',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'how-creditmate-handles-your-data',
    title: 'How CreditMate handles your data (analytics consent, what is tracked)',
    description:
      'What data CreditMate AI collects, how analytics opt-in/opt-out works, what events are tracked, and your rights.',
    category: 'Privacy',
    readingTime: '4 min read',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'Data we collect',
        bullets: [
          'Account data: email, hashed password, display name (when you register).',
          'Saved data: comparisons, collections, notes, alert subscriptions (only if you create them).',
          'Reviews: rating, title, body, pros, cons, and your user ID (when you submit a review).',
          'Analytics events (only if you opt in): page views, searches, filter applications, card selections, comparison starts, shares, quiz starts/completions, calculator uses, signups, logins.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Analytics consent (opt-in / opt-out)',
        paragraphs: [
          'Analytics is opt-in by default. No events are sent until you explicitly opt in. You can opt in or out at any time from the About page or by clearing your browser data.',
        ],
        steps: [
          'Go to /about.',
          'Find the "Analytics" section.',
          'Click "Opt in" to enable tracking, or "Opt out" to disable and delete local analytics data.',
        ],
      },
      {
        heading: 'What is tracked when opted in',
        bullets: [
          'page_view: every page you visit (path, referrer, UTM parameters).',
          'search: queries you type in the autocomplete bar.',
          'filter_apply: which filters you apply and how many.',
          'card_select: which cards you add to a comparison.',
          'compare_start: when you open the comparison view.',
          'compare_share: when you copy a comparison share link.',
          'card_detail_view: which card detail pages you open.',
          'quiz_start / quiz_complete: the recommendation quiz.',
          'calculator_use: the reward calculator.',
          'signup / login: authentication events.',
        ],
        paragraphs: [
          'We do NOT track: passwords, email contents, IP addresses (beyond what the provider logs), precise location, or any data not listed above. All property values are sanitized (length limits, character allow-lists) before sending.',
        ],
      },
      {
        heading: 'Data retention and deletion',
        bullets: [
          'Account data: kept while your account exists. Delete your account to remove it.',
          'Saved items: kept until you delete them or delete your account.',
          'Reviews: kept until you delete them or delete your account.',
          'Analytics events: not stored by us; sent to the analytics provider (if configured) with their own retention policy.',
          'Opt-out flag: stored in localStorage (creditmate.analytics.optOut) until you clear browser data or opt in again.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Your rights',
        bullets: [
          'Access: request a copy of your account data via support.',
          'Rectification: update your email or display name in account settings.',
          'Erasure: delete your account (removes all linked data).',
          'Opt-out: disable analytics anytime — no further events are sent.',
          'Portability: exported data available on request.',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'Is analytics on by default?',
        answer: 'No. You must explicitly opt in. Until you do, zero analytics events are sent.',
      },
      {
        question: 'What happens when I opt out?',
        answer:
          'The opt-out flag is saved in localStorage. The analytics client stops sending events immediately. If a provider deletion callback is registered, it is called. Your past events already sent to the provider are governed by their policy.',
      },
      {
        question: 'Do you sell my data?',
        answer:
          'No. We do not sell personal data. Analytics events (if you opt in) go only to the configured analytics provider for product improvement.',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI privacy policy',
        url: 'https://creditmate.ai/privacy',
        publisher: 'CreditMate AI',
      },
      {
        label: 'Analytics implementation (src/lib/analytics.ts)',
        url: 'https://github.com/creditmate/creditmate-ai-fe',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'en',
  },
  {
    slug: 'create-account-sign-in-bn',
    title: 'অ্যাকাউন্ট তৈরি করুন এবং সাইন ইন করুন',
    description:
      'CreditMate AI অ্যাকাউন্ট তৈরি করার ধাপে ধাপে নির্দেশিকা, সাইন ইন করা, পাসওয়ার্ড রিসেট করা এবং আপনার সেশন পরিচালনা করা।',
    category: 'অ্যাকাউন্ট',
    readingTime: '৪ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'কেন অ্যাকাউন্ট তৈরি করবেন?',
        paragraphs: [
          'একটি অ্যাকাউন্ট আপনাকে তুলনা সংরক্ষণ করতে, কার্ডগুলোকে সংগ্রহে সংগঠিত করতে, কার্ড পরিবর্তনের জন্য ইমেল সতর্কতা সেট আপ করতে এবং কমিউনিটি রিভিউ লিখতে দেয়। আপনার ডেটা ব্যক্তিগত থাকে যদি না আপনি এটি শেয়ার করার বেছে নেন।',
        ],
      },
      {
        heading: 'আপনার অ্যাকাউন্ট তৈরি করুন',
        steps: [
          'হোম পেজ খুলুন এবং উপরের ডানে "Sign up" এ ক্লিক করুন।',
          'আপনার ইমেল ঠিকানা এবং একটি শক্তিশালী পাসওয়ার্ড লিখুন।',
          'আপনার ইমেল চেক করুন যাচাইকরণ লিংকের জন্য এবং সেটিতে ক্লিক করুন।',
          'CreditMate AI-তে ফিরে আসুন এবং আপনার নতুন শংসাপত্র দিয়ে সাইন ইন করুন।',
        ],
        paragraphs: [
          'সাইন-আপ ফর্ম আপনার ইমেল ফরম্যাট যাচাই করে এবং কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড চায়। যদি ইমেলটি ইতিমধ্যে নিবন্ধিত থাকে, তবে আপনি সাইন ইন করার অনুরোধ দেখবেন।',
        ],
      },
      {
        heading: 'সাইন ইন করুন',
        steps: [
          'উপরের ডানে "Sign in" এ ক্লিক করুন।',
          'আপনার নিবন্ধিত ইমেল এবং পাসওয়ার্ড লিখুন।',
          '"Sign in" বাটনে ক্লিক করুন।',
        ],
        paragraphs: [
          'আপনি আপনার পাসওয়ার্ড ভুলে গেলে, সাইন-ইন পৃষ্ঠায় "Forgot password?" এ ক্লিক করুন। আপনি ইমেল দ্বারা একটি রিসেট লিংক পাবেন।',
        ],
      },
      {
        heading: 'আপনার পাসওয়ার্ড রিসেট করুন',
        steps: [
          'সাইন-ইন পৃষ্ঠায়, "Forgot password?" এ ক্লিক করুন।',
          'আপনার নিবন্ধিত ইমেল ঠিকানা লিখুন।',
          'আপনার ইমেল চেক করুন রিসেট লিংকের জন্য (১ ঘন্টার জন্য বৈধ)।',
          'লিংকে ক্লিক করুন এবং একটি নতুন পাসওয়ার্ড লিখুন।',
          'আপনার নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'সাইন ইন থাকুন',
        paragraphs: [
          'আপনার সেশন ১৪ দিন থাকে। এরপর আপনাকে আবার সাইন ইন করতে বলা হবে। "Remember me" চেকবক্স নেই; নিরাপত্তার জন্য ১৪ দিনের মেয়াদ ফিক্সড।',
        ],
      },
      {
        heading: 'সাইন আউট করুন',
        steps: ['অ্যাকাউন্ট মেনু খুলুন (উপরের ডানে আপনার ইমেল)।', '"Sign out" এ ক্লিক করুন।'],
        paragraphs: [
          'সাইন আউট করলে এই ডিভাইসে আপনার সেশন মুছে যায়। সংরক্ষিত তুলনা, সংগ্রহ এবং সতর্কতা সাবস্ক্রিপশন আপনার অ্যাকাউন্টের সাথে লিংকড থাকে এবং আপনি আবার সাইন ইন করলে সেগুলো ফেরত আসবে।',
        ],
      },
      {
        heading: 'সমস্যা সমাধান',
        bullets: [
          'যাচাইকরণ ইমেল পেলেন না? স্প্যাম/জাঙ্ক ফোল্ডার চেক করুন, তারপর সাইন-ইন পৃষ্ঠা থেকে নতুন করে অনুরোধ করুন।',
          'রিসেট লিংকের মেয়াদ শেষ? নতুন করে অনুরোধ করুন — লিংক ১ ঘন্টা পরে মেয়াদোত্তীর্ণ হয়।',
          'এখনও সমস্যা? About পৃষ্ঠা থেকে সাপোর্টে যোগাযোগ করুন।',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'কি আমি অ্যাকাউন্ট ছাড়া CreditMate AI ব্যবহার করতে পারি?',
        answer:
          'হ্যাঁ। আপনি সাইন ইন ছাড়াই কার্ড ব্রাউজ করতে, ফিল্টার করতে, তুলনা করতে এবং কুইজ ও ক্যালকুলেটর ব্যবহার করতে পারেন। শুধু সংরক্ষণ, শেয়ার, সতর্কতা সেট আপ বা রিভিউ লিখতে অ্যাকাউন্ট দরকার।',
      },
      {
        question: 'যাচাইকরণ ইমেল না পেলে কী করব?',
        answer:
          'আপনার স্প্যাম বা জাঙ্ক ফোল্ডার চেক করুন। সেটাও না থাকলে এক মিনিট অপেক্ষা করুন এবং সাইন-ইন পৃষ্ঠায় "Resend verification email" এ ক্লিক করুন।',
      },
      {
        question: 'সেশন কতক্ষণ চলে?',
        answer: '১৪ দিন। এরপর আবার সাইন ইন করতে হবে। নিরাপত্তার কারণে এই সময় বাড়ানো যায় না।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI প্রমাণীকরণ প্রবাহ',
        url: 'https://creditmate.ai/auth',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
  {
    slug: 'save-share-comparison-bn',
    title: 'তুলনা সংরক্ষণ ও শেয়ার করুন',
    description:
      'কার্ড তুলনা কীভাবে সংরক্ষণ করবেন, নাম দেবেন, পাবলিক করবেন এবং অন্যদের সাথে লিংক শেয়ার করবেন তা শিখুন।',
    category: 'টুলস',
    readingTime: '৪ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'শুরু করার আগে',
        paragraphs: [
          'আপনাকে অবশ্যই সাইন ইন থাকতে হবে। হোম পেজে ২ থেকে ৪ টি কার্ড সিলেক্ট করে "Compare Cards" চাপলে তুলনা ভিউ খুলবে।',
        ],
      },
      {
        heading: 'একটি তুলনা সংরক্ষণ করুন',
        steps: [
          'তুলনা পৃষ্ঠায় (/compare), "Save comparison" এ ক্লিক করুন।',
          'আপনার তুলনার জন্য একটি নাম দিন (যেমন: "Travel cards shortlist")।',
          '"Private" (শুধু আপনি দেখবেন) বা "Public" (লিংক 가진 কেউ দেখতে পারবে) বেছে নিন।',
          '"Save" এ ক্লিক করুন।',
        ],
        paragraphs: [
          'সংরক্ষিত তুলনাগুলো আপনার Saved পেজে (/saved) দেখাবে। প্রাইভেট তুলনায় লক আইকন থাকে, পাবলিকতায় লিংক আইকন।',
        ],
      },
      {
        heading: 'একটি তুলনা শেয়ার করুন',
        steps: [
          'Saved পেজে আপনার তুলনা খুঁজুন।',
          '"Copy share link" এ ক্লিক করুন।',
          'লিংকটি কোনো মেসেজ, ইমেল বা ডকুমেন্টে পেস্ট করুন।',
        ],
        paragraphs: [
          'লিংকটি দেখতে যেন: https://creditmate.ai/shared/<token>। কেউ এটি খোললে সে একই সাইড-বাই-সাইড তুলনা দেখবে। তাদের অ্যাকাউন্ট দরকার নেই।',
        ],
      },
      {
        heading: 'সংরক্ষিত তুলনা পরিচালনা করুন',
        bullets: [
          'নাম পরিবর্তন: নামের পাশের পেনসিল আইকনে ক্লিক করুন।',
          'পাবলিক/প্রাইভেট টগল: তুলনা এডিট করুন এবং видиবিলিটি পরিবর্তন করুন।',
          'মুছুন: ট্র্যাশ আইকনে ক্লিক করুন। এটি ফেরত আনা যাবে না।',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'কতগুলো তুলনা সংরক্ষণ করতে পারি?',
        answer:
          'কোনো হার্ড লিমিট নেই, কিন্তু অনেক বেশি হলে Saved পেজ ধীরে চলে। আমরা পরামর্শ দিই শুধু যেগুলো সক্রিয়ভাবে ব্যবহার করেন সেগুলো রাখুন।',
      },
      {
        question: 'কি সংরক্ষিত তুলনার কার্ডগুলো পরিবর্তন করা যায়?',
        answer:
          'না। একটি সংরক্ষিত তুলনা একটি স্ন্যাপশট। কার্ডগুলো পরিবর্তন করতে হোম পেজে নতুন তুলনা তৈরি করুন এবং সেটি সংরক্ষণ করুন।',
      },
      {
        question: 'পাবলিক লিংক কি মেয়াদোত্তীর্ণ হয়?',
        answer: 'না। লিংক কাজ করবে যতক্ষণ না আপনি তুলনাটি মুছেন বা প্রাইভেট করেন।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI সংরক্ষিত তুলনা ফিচার',
        url: 'https://creditmate.ai/saved',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
  {
    slug: 'organize-cards-collections-bn',
    title: 'কার্ডগুলো সংগ্রহে সংগঠিত করুন',
    description:
      'নামযুক্ত সংগ্রহ তৈরি করুন, ব্যক্তিগত নোটসহ কার্ড যোগ করুন এবং অন্যদের সাথে সংগ্রহ শেয়ার করুন।',
    category: 'টুলস',
    readingTime: '৪ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'সংগ্রহ কী?',
        paragraphs: [
          'একটি সংগ্রহ হলো আপনার ক্যুরেট করা কার্ডের একটি নামযুক্ত গোষ্ঠী। একটি তুলনার মত নয় (যেটি ২-৪টি কার্ডের ফিক্সড সাইড-বাই-সাইড ভিউ), একটি সংগ্রহ যেকোনো সংখ্যক কার্ড ধারণ করতে পারে। আপনি প্রতিটি কার্ডে নোট যোগ করতে পারেন — যেমন, কেন সেটি শর্টলিস্ট করেছেন বা সেটির কী ভালো লেগেছে।',
        ],
      },
      {
        heading: 'একটি সংগ্রহ তৈরি করুন',
        steps: [
          '/saved-এ যান এবং "New collection" এ ক্লিক করুন।',
          'একটি নাম দিন (প্রয়োজনীয়) এবং ঐচ্ছিক বিবরণ লিখুন।',
          '"Private" বা "Public" বেছে নিন।',
          '"Create" এ ক্লিক করুন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'সংগ্রহে কার্ড যোগ করুন',
        steps: [
          'Saved পেজ থেকে সংগ্রহটি খুলুন।',
          '"Add card" এ ক্লিক করুন।',
          'কার্ড আইডি লিখুন (এটি কার্ড ডিটেইল পেজের URL-এ পাবেন: /card/<bank>/<card>)।',
          'ঐচ্ছিকভাবে একটি নোট যোগ করুন (যেমন: "ভালো ট্রাভেলের জন্য, বছরে ৪ লounge ভিজিট")।',
          '"Add" এ ক্লিক করুন।',
        ],
        paragraphs: [
          'আপনি কার্ড ডিটেইল পেজ থেকেও কার্ড যোগ করতে পারেন: "Add to collection" ক্লিক করুন এবং একটি বিদ্যমান সংগ্রহ বেছে নিন বা নতুন তৈরি করুন।',
        ],
      },
      {
        heading: 'সংগ্রহের কার্ডগুলো পরিচালনা করুন',
        bullets: [
          'নোট এডিট করুন: নোট টেক্সটে ক্লিক করুন, পরিবর্তন করুন, Enter চাপুন।',
          'কার্ড সরান: কার্ডের পাশের রিমুভ আইকনে ক্লিক করুন।',
          'क्रम বদলান: ড্র্যাগ অ্যান্ড ড্রপ (ডেস্কটপ) বা মুভ বাটন (মোবাইল) ব্যবহার করুন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'একটি সংগ্রহ শেয়ার করুন',
        steps: [
          'সংগ্রহটি খুলুন।',
          '"Copy share link" এ ক্লিক করুন।',
          'লিংকটি শেয়ার করুন। দর্শকরা কার্ডগুলো এবং আপনার নোট দেখবে (যদি পাবলিক হয়)।',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'সংগ্রহ এবং সংরক্ষিত তুলনার পার্থক্য কী?',
        answer:
          'একটি তুলনা ২-৪টি কার্ডের একটি ফিক্সড সাইড-বাই-সাইড ভিউ। একটি সংগ্রহ যেকোনো সংখ্যক কার্ডের একটি নমনীয় তালিকা যার সাথে আপনার ব্যক্তিগত নোট থাকে। সংগ্রহে সাইড-বাই-সাইড টেবিল ভিউ নেই।',
      },
      {
        question: 'কি একই কার্ড একাধিক সংগ্রহে যোগ করা যায়?',
        answer: 'হ্যাঁ। একটি কার্ড আপনার ইচ্ছামত تعداد সংগ্রহে থাকতে পারে।',
      },
      {
        question: 'শেয়ার করা সংগ্রহে আমার নোট দেখাবে কি?',
        answer: 'হ্যাঁ, যদি সংগ্রহটি পাবলিক হয়। প্রাইভেট সংগ্রহ শুধু আপনার কাছে দৃশ্যমান।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI সংগ্রহ ফিচার',
        url: 'https://creditmate.ai/saved',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
  {
    slug: 'email-alerts-card-changes-bn',
    title: 'কার্ড পরিবর্তন হলে ইমেল সতর্কতা পান',
    description:
      'ফি পরিবর্তন, APR পরিবর্তন, নতুন কার্ড, বা আপনার নজরে রাখা কার্ডগুলোর যেকোনো পরিবর্তনের জন্য ইমেল বিজ্ঞপ্তি সেট আপ করুন।',
    category: 'অ্যাকাউন্ট',
    readingTime: '৪ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'সতর্কতা কীভাবে কাজ করে',
        paragraphs: [
          'যখন আপনি একটি কার্ড "Watch" করেন, তখন আপনি একটি সাবস্ক্রিপশন তৈরি করেন। আমাদের সিস্টেম দিনে একবার পরিবর্তন চেক করে। যদি কোনো পরিবর্তন আপনার সাবস্ক্রিপশন টাইপের সাথে মিলে যায়, তবে আপনাকে একটি ইমেল যাবে (অথবা আপনার পছন্দ অনুযায়ী ডাইজেস্ট)।',
        ],
      },
      {
        heading: 'একটি কার্ড নজরে রাখুন',
        steps: [
          'সাইন ইন করুন।',
          'একটি কার্ড ডিটেইল পেজ খুলুন (/card/<bank>/<card>)।',
          '"Watch this card" এ ক্লিক করুন।',
          'সতর্কতার ধরন বেছে নিন: ফি পরিবর্তন, APR পরিবর্তন, নতুন কার্ড, বা যেকোনো পরিবর্তন।',
          '"Confirm" এ ক্লিক করুন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'ডেলিভারি ফ্রিকোয়েন্সি বেছে নিন',
        steps: [
          '/alerts-এ যান।',
          '"Notification Preferences"-এ, বেছে নিন: Immediate (প্রতি পরিবর্তনে ইমেল), Daily digest (দিনে এক ইমেল), বা Weekly digest (সপ্তাহে এক ইমেল)।',
          '"Save preferences" এ ক্লিক করুন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'সাবস্ক্রিপশনগুলো পরিচালনা করুন',
        paragraphs: [
          '/alerts পেজে আপনার সব সাবস্ক্রিপশন দেখতে পাবেন। প্রতিটিতে সতর্কতার ধরন, কার্ডের নাম এবং আপনি কবে তৈরি করেছেন সেটি থাকে। "Remove" ক্লিক করলে সেই কার্ড নজরে রাখা বন্ধ হবে।',
        ],
      },
      {
        heading: 'সব সতর্কতা থেকে আনসাবস্ক্রাইব করুন',
        steps: [
          '/alerts-এ যান।',
          'নিচে "Unsubscribe me" এ ক্লিক করুন।',
          'নিশ্চিত করুন। আপনি আরও কোনো সতর্কতা ইমেল পাবেন না।',
        ],
        paragraphs: [
          'আপনি যেকোনো সময় /alerts থেকে বা আবার কার্ড Watch করে পুনরায় সাবস্ক্রাইব করতে পারেন।',
        ],
      },
    ],
    faqs: [
      {
        question: '"পরিবর্তন" বলতে কী বোঝায়?',
        answer:
          'ফি পরিবর্তন: বার্ষিক ফির পরিমাণ বা ওয়ার্টার শর্তাবলী। APR পরিবর্তন: ক্রয় বা ক্যাশ অ্যাডভান্সের হার। নতুন কার্ড: আমাদের ডেটাবেসে নতুন কার্ড যোগ করা। যেকোনো পরিবর্তন: উপরের যেকোনো একটি।',
      },
      {
        question: 'পরিবর্তন কতক্ষণ পর পর চেক করা হয়?',
        answer:
          'প্রতিদিন। আপনি "Immediate" বেছে দিলে, দৈনিক চেক পরিবর্তন পেলে শীঘ্রই ইমেল যাবে। ডাইজেস্ট পরিবর্তনগুলোকে এক ইমেলে জমা দেয়।',
      },
      {
        question: 'অ্যাকাউন্ট ছাড়া কি কার্ড Watch করা যায়?',
        answer: 'না। সাবস্ক্রিপশন তৈরি করতে আপনাকে অবশ্যই সাইন ইন থাকতে হবে।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI সতর্কতা ফিচার',
        url: 'https://creditmate.ai/alerts',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
  {
    slug: 'write-read-community-reviews-bn',
    title: 'কমিউনিটি রিভিউ লিখুন ও পড়ুন',
    description:
      'ক্রেডিট কার্ডের জন্য রিভিউ কীভাবে লিখবেন, আপনার রিভিউ এডিট বা ডিলিট করবেন, সহায়কতা ভোট দেবেন এবং অন্যান্য কার্ডহোল্ডাররা কী বলছেন তা পড়বেন।',
    category: 'কমিউনিটি',
    readingTime: '৪ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'কারা রিভিউ লিখতে পারেন?',
        paragraphs: [
          'যেকোনো সাইন-ইন করা ইউজার। আপনাকে কার্ডটি মালিক হতে হবে না, কিন্তু যাচাইকৃত কার্ডহোল্ডারদের (আপনার সংরক্ষিত কার্ড বা সংগ্রহের মাধ্যমে সনাক্ত) রিভিউতে "Verified cardholder" ব্যাজ দেখাবে।',
        ],
      },
      {
        heading: 'একটি রিভিউ লিখুন',
        steps: [
          'একটি কার্ড ডিটেইল পেজ খুলুন।',
          '"Customer Reviews"-এ স্ক্রোল করুন এবং "Write a Review" এ ক্লিক করুন।',
          'স্টার রেটিং বেছে নিন (১-৫)।',
          'একটি শিরোনাম লিখুন (সর্বোচ্চ ১০০ অক্ষর)।',
          'আপনার রিভিউ লিখুন (সর্বোচ্চ ৫,০০০ অক্ষর)।',
          'ঐচ্ছিকভাবে Pros এবং Cons যোগ করুন (প্রতিটিতে সর্বোচ্চ ৫০০ অক্ষর)।',
          '"Submit review" এ ক্লিক করুন।',
        ],
        paragraphs: [
          'আপনার রিভিউ মডারেশনে যাবে। অনুমোদনের পর অন্যদের কাছে দৃশ্যমান হবে (সাধারণত ২৪-৪৮ ঘন্টা)। অনুমোদন পর্যন্ত আপনার রিভিউতে "Pending moderation" দেখাবে।',
        ],
      },
      {
        heading: 'আপনার রিভিউ এডিট বা ডিলিট করুন',
        steps: [
          'কার্ড ডিটেইল পেজ খুলুন এবং তালিকায় আপনার রিভিউ খুঁজুন।',
          '"Edit" এ ক্লিক করুন রেটিং, শিরোনাম, বডি, প্রস বা কনস পরিবর্তন করতে। রিভিউ আবার মডারেশনে যাবে।',
          '"Delete" এ ক্লিক করুন চিরকালের জন্য মুছে ফেলতে। ডায়ালগে নিশ্চিত করুন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'সহায়কতা ভোট দিন',
        steps: [
          'যেকোনো রিভিউতে থাম্বস-আপ আইকনে ক্লিক করুন।',
          'গণনা বাড়বে। আবার ক্লিক করলে আপনার ভোট মুছে যাবে।',
        ],
        paragraphs: [
          'ভোট দেওয়ার জন্য আপনাকে সাইন ইন থাকতে হবে। আপনি নিজের রিভিউ বাদে যেকোনো রিভিউতে ভোট দিতে পারেন।',
        ],
      },
      {
        heading: 'রিভিউ পড়ুন',
        paragraphs: [
          'রিভিউতে লেখকের নাম, স্টার রেটিং, তারিখ এবং প্রযোজ্য হলে "Verified cardholder" ব্যাজ থাকে। Newest, Oldest, Most helpful, Highest rating, বা Lowest rating-এ সর্ট করুন। পেজিনেশন প্রতিটি পেজে ১০ রিভিউ দেখায়।',
        ],
      },
    ],
    faqs: [
      {
        question: 'মডারেশন কতক্ষণ নেয়?',
        answer:
          'সাধারণত ২৪-৪৮ ঘন্টা। গাইডলাইন লঙ্ঘনকারী রিভিউ (স্প্যাম, দুরупযোগ, অফ-টপিক) अस্বীকৃত হয়।',
      },
      {
        question: 'কি আমি এমন কার্ডের রিভিউ লিখতে পারি যা আমার নেই?',
        answer: 'হ্যাঁ। সেই রিভিউতে "Verified cardholder" ব্যাজ দেখাবে না।',
      },
      {
        question: 'অক্ষর সীমা কত?',
        answer: 'শিরোনাম: ১০০। বডি: ৫,০০০। প্রস/কনস: প্রতিটি ৫০০।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI রিভিউ ফিচার',
        url: 'https://creditmate.ai/card/<bank>/<card>',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
  {
    slug: 'advanced-search-filters-bn',
    title: 'উন্নত খোঁজ ও ফিল্টার ব্যবহার করুন',
    description:
      'হোম পেজের ফিল্টার প্যানেল আয়ত্ত করুন: ব্যাংক নির্বাচন, ফি রেঞ্জ, সুদ হার রেঞ্জ, ফি ওয়ার্টার, লাউঞ্জ অ্যাকসেস, ফিচার সার্চ এবং কীওয়ার্ড সার্চ।',
    category: 'টুলস',
    readingTime: '৫ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'ফিল্টার প্যানেল খুলুন',
        steps: [
          'হোম পেজে যান (/).',
          '"Filter Options" প্যানেলে "Expand" এ ক্লিক করুন (ডেস্কটপে বাম পাশে, মোবাইলে উপরে)।',
        ],
        paragraphs: [],
      },
      {
        heading: 'ব্যাংক দিয়ে ফিল্টার করুন',
        paragraphs: [
          '"Banks" সেকশনে এক বা একাধিক ব্যাংক চেক করুন। কার্ড তালিকা শুধু সেই ব্যাংকগুলোর কার্ড দেখাবে।',
        ],
      },
      {
        heading: 'বার্ষিক ফি দিয়ে ফিল্টার করুন',
        paragraphs: [
          '"Min (BDT)" এবং "Max (BDT)" দিয়ে সংখ্যাসূচক রেঞ্জ সেট করুন। অথবা "Or Range (min,max)" কমা দিয়ে ব্যবহার করুন (যেমন: "0,200")। "Has Annual Fee" চেক করলে শুধু ফিযুক্ত কার্ড দেখাবে, আনচেক করলে শুধু নো-ফি কার্ড। "Has Fee Waiver Policy" চেক করলে শুধু ওয়ার্টার নিয়ম পাবলিশ করা কার্ড দেখাবে।',
        ],
      },
      {
        heading: 'সুদ হার (APR) দিয়ে ফিল্টার করুন',
        paragraphs: [
          'ক্রয় APR-এর জন্য Min (%) এবং Max (%) সেট করুন। অথবা "Or Range (min,max)" ব্যবহার করুন (যেমন: "18.0,25.0")।',
        ],
      },
      {
        heading: 'লাউঞ্জ অ্যাকসেস দিয়ে ফিল্টার করুন',
        paragraphs: [
          '"Any Lounge Access" চেক করলে যেকোনো লাউঞ্জ সুবিধা যুক্ত কার্ড দেখাবে। "International Lounge Access" বা "Domestic Lounge Access" চেক করলে নির্দিষ্ট ধরনের। "Min International" এবং "Min Domestic" সেট করলে বছরে ন্যূনতম ভিজিট সংখ্যা বেছে নেওয়া যায়।',
        ],
      },
      {
        heading: 'ফিচার দিয়ে ফিল্টার করুন',
        paragraphs: [
          '"Has Additional Features" চেক করলে শুধু এক্সট্রা ফিচার লিস্ট করা কার্ড দেখাবে। "Search in features"-এ নির্দিষ্ট কীওয়ার্ড দিয়ে খুঁজুন (যেমন: "insurance", "concierge")।',
        ],
      },
      {
        heading: 'কীওয়ার্ড সার্চ',
        paragraphs: [
          'প্যানেলের নিচে "Search by card name or features" ব্যবহার করুন। এটি কার্ডের নাম, ব্যাংকের নাম এবং ফিচার টেক্সটে খোঁজ করে।',
        ],
      },
      {
        heading: 'লাগু করুন, রিসেট করুন এবং সংযোজন করুন',
        steps: [
          '"Apply Filters" এ ক্লিক করুন কোয়েরি চালাতে।',
          '"Reset" এ ক্লিক করুন সব ফিল্টার একসাথে মুছতে।',
          'ফিল্টারগুলো AND লজিক দিয়ে জমা হয়: একটি কার্ড كلّ সক্রিয় ফিল্টার মিলে থাকলে দেখাবে।',
        ],
        paragraphs: [],
      },
      {
        heading: 'অটোকমপ্লিট সার্চ বার',
        paragraphs: [
          'হেডারের সার্চ বারে টাইপ করার সাথে সাথে কার্ড, ব্যাংক এবং ক্যাটাগরি সাজেস্ট করে। সাজেস্টশন সিলেক্ট করলে সেটি সরাসরি ওই কার্ড, ব্যাংক ক্যাটাগরি পেজ বা ফিল্টার রেজাল্টে নিয়ে যাবে।',
        ],
      },
    ],
    faqs: [
      {
        question: 'কি একসাথে একাধিক ব্যাংক দিয়ে ফিল্টার করা যায়?',
        answer: 'হ্যাঁ। যত চান তত ব্যাংক চেক করুন। ফলাফলে যেকোনো চেক করা ব্যাংকের কার্ড দেখাবে।',
      },
      {
        question: '"Has Fee Waiver Policy" মানে কী?',
        answer:
          'কার্ড ইস্যুর একটি পাবলিশড নিয়ম আছে (যেমন: "২৪ ট্রানজ্যাকশন/বছরে ফি ওয়ার্টার")। ফিল্টার শুধু যেসব কার্ডের এমন নিয়ম থাকে সেগুলো দেখাবে।',
      },
      {
        question: 'ফিল্টার লাগালে কেন কোনো কার্ড দেখা যাচ্ছে না?',
        answer: 'ফিল্টারগুলো খুব সীমাবদ্ধ হতে পারে। রেঞ্জ चौড়া করুন বা কিছু বক্স আনচেক করুন।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI ফিল্টার প্যানেল',
        url: 'https://creditmate.ai/',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
  {
    slug: 'switch-dark-mode-language-bn',
    title: 'ডার্ক মোড এবং ভাষা বদলান',
    description:
      'ডার্ক/লাইট মোড টগল করা এবং ইংরেজি ও বাংলার মধ্যে স্যুইচ করা। দুটি সেটিং সেশন জুড়ে সংরক্ষিত থাকে।',
    category: 'বেসিকস',
    readingTime: '৩ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'ডার্ক মোড',
        steps: [
          'উপরের ডানে চাঁদ/সূর্য আইকনে ক্লিক করুন (ভাষা বাটনের পাশে)।',
          'পেজইনস্ট্যান্টলি স্যুইচ করবে। আপনার পছন্দ আপনার ব্রাউজারে সংরক্ষিত হবে এবং ভবিষ্যতের ভিজিটেও কাজ করবে।',
        ],
        paragraphs: [
          'ডার্ক মোডে গাঢ় পটভূমিতে হালকা লেখা থাকে। লাইট মোডে হালকা পটভূমিতে গাঢ় লেখা। প্রথম ভিজিটে এটি আপনার সিস্টেম পছন্দ মেনে চলে।',
        ],
      },
      {
        heading: 'ভাষা (English / বাংলা)',
        steps: [
          'উপরের ডানে ভাষা বাটনে ক্লিক করুন (ইংরেজি চললে "BN" দেখাবে, বাংলা চললে "EN" দেখাবে)।',
          'UI টেক্সটইনস্ট্যান্টলি বদলে যাবে। আপনার পছন্দ সংরক্ষিত হবে এবং ভবিষ্যতের ভিজিটেও কাজ করবে।',
        ],
        paragraphs: [
          'অ্যাপ নেভিগেশন, বাটন, ফর্ম লেবেল এবং গাইড কন্টেন্ট অনুবাদ করে। কিছু থার্ড-পার্টি কন্টেন্ট (ব্যাংক নাম, এক্সটার্নাল লিংক) ইংরেজিতে থাকবে। বাংলা অনুবাদ কমিউনিটি-রিভিউড; শব্দকোষে উভয় ভাষায় সংজ্ঞা দেখুন।',
        ],
      },
      {
        heading: 'কীবোর্ড শর্টকাট',
        paragraphs: [
          'এই টগলগুলোর জন্য কোনো ডেডিকেটেড কীবোর্ড শর্টকাট নেই। Tab দিয়ে বাটনে ফোকাস করুন, তারপর Enter বা Space চাপুন।',
        ],
      },
    ],
    faqs: [
      {
        question: 'ডার্ক মোড কি সব পেজে কাজ করে?',
        answer: 'হ্যাঁ। থিম পুরো অ্যাপে লাগে, গাইড, কার্ড ডিটেইল পেজ এবং তুলনা ভিউসহ।',
      },
      {
        question: 'কি প্রতিটি পেজ সম্পূর্ণ বাংলায় অনুবাদিত?',
        answer:
          'নেভিগেশন, বাটন, ফর্ম লেবেল, সতর্কতা, রিভিউ এবং গাইড অনুবাদিত। ব্যাংক নাম, কার্ড নাম এবং এক্সটার্নাল সোর্স টেক্সট ইংরেজিতে থাকে।',
      },
      {
        question: 'সিস্টেম পছন্দে ফিরে যেতে কী করব?',
        answer:
          'এই সাইটের জন্য ব্রাউজার localStorage মুছুন, অথবা প্রাইভেট উইন্ডোতে খুলুন। অ্যাপ তখন আপনার OS থিম এবং ব্রাউজার ভাষা মেনে চলে।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI থিম এবং ভাষা সেটিংস',
        url: 'https://creditmate.ai/',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
  {
    slug: 'how-creditmate-handles-your-data-bn',
    title: 'CreditMate কীভাবে আপনার ডেটা হ্যান্ডেল করে (অ্যানালিটিক্স সম্মতি, কী ট্র্যাক করা হয়)',
    description:
      'CreditMate AI কী ডেটা সংগ্রহ করে, অ্যানালিটিক্স অপ্ট-ইন/অপ্ট-আউট কীভাবে কাজ করে, কী ইভেন্ট ট্র্যাক করা হয় এবং আপনার অধিকার।',
    category: 'গোপনীয়তা',
    readingTime: '৪ মিনিট পড়া',
    updated: '2026-10-12',
    sections: [
      {
        heading: 'আমরা কী ডেটা সংগ্রহ করি',
        bullets: [
          'অ্যাকাউন্ট ডেটা: ইমেল, হ্যাশড পাসওয়ার্ড, প্রদর্শন নাম (নিবন্ধন করলে)।',
          'সংরক্ষিত ডেটা: তুলনা, সংগ্রহ, নোট, সতর্কতা সাবস্ক্রিপশন (শুধু আপনি তৈরি করলে)।',
          'রিভিউ: রেটিং, শিরোনাম, বডি, প্রস, কনস এবং আপনার ইউজার আইডি (রিভিউ জমা দিলে)।',
          'অ্যানালিটিক্স ইভেন্ট (শুধু অপ্ট-ইন করলে): পেজ ভিউ, সার্চ, ফিল্টার লাগানো, কার্ড সিলেকশন, তুলনা শুরু, শেয়ার, কুইজ শুরু/সমাপ্তি, ক্যালকুলেটর ব্যবহার, সাইনআপ, লগইন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'অ্যানালিটিক্স সম্মতি (অপ্ট-ইন / অপ্ট-আউট)',
        paragraphs: [
          'অ্যানালিটিক্স ডিফল্টভাবে অপ্ট-ইন। আপনি যতক্ষণ স্পষ্টভাবে অপ্ট-ইন করবেন না, কোনো ইভেন্ট পাঠানো হয় না। আপনি যেকোনো সময় About পেজ থেকে বা ব্রাউজার ডেটা মুছে অপ্ট-ইন বা অপ্ট-আউট করতে পারেন।',
        ],
        steps: [
          '/about-এ যান।',
          '"Analytics" সেকশন খুঁজুন।',
          '"Opt in" ক্লিক করুন ট্র্যাকিং চালু করতে, বা "Opt out" ক্লিক করুন বন্ধ করতে এবং লোকাল অ্যানালিটিক্স ডেটা মুছতে।',
        ],
      },
      {
        heading: 'অপ্ট-ইন করলে কী ট্র্যাক করা হয়',
        bullets: [
          'page_view: আপনি যেসব পেজ ভিজিট করেছেন (পাথ, রেফারার, UTM প্যারামিটার)।',
          'search: অটোকমপ্লিট বারে আপনি যা টাইপ করেছেন।',
          'filter_apply: আপনি কোন ফিল্টারগুলো লাগিয়েছেন এবং কতগুলো।',
          'card_select: তুলনায় আপনি কোন কার্ডগুলো যোগ করেছেন।',
          'compare_start: আপনি কখন তুলনা ভিউ খোলেছেন।',
          'compare_share: আপনি কখন তুলনা শেয়ার লিংক কপি করেছেন।',
          'card_detail_view: আপনি কোন কার্ড ডিটেইল পেজ খোলেছেন।',
          'quiz_start / quiz_complete: রিকমেন্ডেশন কুইজ।',
          'calculator_use: রিওয়ার্ড ক্যালকুলেটর।',
          'signup / login: প্রমাণীকরণ ইভেন্ট।',
        ],
        paragraphs: [
          'আমরা ট্র্যাক করি না: পাসওয়ার্ড, ইমেল কন্টেন্ট, IP ঠিকানা (প্রভাইডার লগের বাইরে), সুনির্দিষ্ট লোকেশন, বা উপরে লিস্ট করা ছাড়া অন্য কোনো ডেটা। পাঠানোর আগে সব প্রপার্টি মান স্যানিটাইজ করা হয় (ল 長 সীমা, ক্যারেক্টার আলাউ-লিস্ট)।',
        ],
      },
      {
        heading: 'ডেটা ধারণ এবং মুছে ফেলা',
        bullets: [
          'অ্যাকাউন্ট ডেটা: যতক্ষণ আপনার অ্যাকাউন্ট থাকে। অ্যাকাউন্ট ডিলিট করলে মুছে যাবে।',
          'সংরক্ষিত আইটেম: আপনি মুছা না পর্যন্ত অথবা অ্যাকাউন্ট ডিলিট না করা পর্যন্ত।',
          'রিভিউ: আপনি মুছা না পর্যন্ত অথবা অ্যাকাউন্ট ডিলিট না করা পর্যন্ত।',
          'অ্যানালিটিক্স ইভেন্ট: আমরা সংরক্ষণ করি না; কনফিগার্ড থাকলে অ্যানালিটিক্স প্রোভাইডারকে পাঠানো হয় তাদের নিজস্ব রিটেনশন পলিসি সহ।',
          'অপ্ট-আউট ফ্ল্যাগ: localStorage-এ (creditmate.analytics.optOut) সংরক্ষিত থাকে যতক্ষণ না ব্রাউজার ডেটা মুছেন বা আবার অপ্ট-ইন করেন।',
        ],
        paragraphs: [],
      },
      {
        heading: 'আপনার অধিকার',
        bullets: [
          'অ্যাক্সেস: সাপোর্টের মাধ্যমে আপনার অ্যাকাউন্ট ডেটার কপি অনুরোধ করুন।',
          'সংশোধন: অ্যাকাউন্ট সেটিংসে আপনার ইমেল বা প্রদর্শন নাম আপডেট করুন।',
          'মুছে ফেলা: অ্যাকাউন্ট ডিলিট করুন (সব লিংকড ডেটা মুছে যাবে)।',
          'অপ্ট-আউট: যেকোনো সময় অ্যানালিটিক্স বন্ধ করুন — আর কোনো ইভেন্ট পাঠানো হবে না।',
          'পোর্টিবিলিটি: অনুরোধ করলে এক্সপোর্টেড ডেটা উপলব্ধ।',
        ],
        paragraphs: [],
      },
    ],
    faqs: [
      {
        question: 'অ্যানালিটিক্স ডিফল্টভাবে অন থাকে?',
        answer:
          'না। আপনাকে স্পষ্টভাবে অপ্ট-ইন করতে হবে। আপনি অপ্ট-ইন না করার পর্যন্ত শূন্য অ্যানালিটিক্স ইভেন্ট পাঠানো হয়।',
      },
      {
        question: 'অপ্ট-আউট করলে কী হয়?',
        answer:
          'অপ্ট-আউট ফ্ল্যাগ localStorage-এ সংরক্ষিত হয়। অ্যানালিটিক্স ক্লায়েন্টইনস্ট্যান্টলি ইভেন্ট পাঠানো বন্ধ করে দেয়। প্রোভাইডার ডিলিশন কলব্যাক নিবন্ধিত থাকলে তা কল করা হয়। ইতিমধ্যে প্রোভাইডারে পাঠানো গയেগুলো তাদের পলিসি দ্বারা গভิร์ন করা হয়।',
      },
      {
        question: 'আপনি কি আমার ডেটা বিক্রি করেন?',
        answer:
          'না। আমরা ব্যক্তিগত ডেটা বিক্রি করি না। অ্যানালিটিক্স ইভেন্ট (আপনি অপ্ট-ইন করলে) শুধু কনফিগার্ড করা অ্যানালিটিক্স প্রোভাইডারে পণ্য উন্নতির জন্য যায়।',
      },
    ],
    sources: [
      {
        label: 'CreditMate AI গোপনীয়তা নীতি',
        url: 'https://creditmate.ai/privacy',
        publisher: 'CreditMate AI',
      },
      {
        label: 'অ্যানালিটিক্স ইমপ্লিমেন্টেশন (src/lib/analytics.ts)',
        url: 'https://github.com/creditmate/creditmate-ai-fe',
        publisher: 'CreditMate AI',
      },
    ],
    disclaimer: DISCLAIMER,
    language: 'bn',
  },
];

export const guideSlugs: string[] = guides.map(guide => guide.slug);

export const getGuide = (slug: string | undefined): Guide | undefined =>
  guides.find(guide => guide.slug === slug);
