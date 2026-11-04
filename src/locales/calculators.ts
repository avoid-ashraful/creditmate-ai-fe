/**
 * UI copy for the EMI + payoff calculators page (Feature 6).
 * Bengali strings are drafted and need review by a native speaker before release.
 *
 * Copy discipline: calculations always name the APR source — a real card's
 * published APR or the user's own custom rate. Cards that publish no APR
 * (including Islamic cards, whose cost follows the bank's profit-rate terms)
 * are never silently treated as 0%: the page says so and asks for a rate.
 */

import type { Language } from './types';

export interface CalculatorsCopy {
  seoTitle: string;
  seoDescription: string;
  heading: string;
  intro: string;
  tabEmi: string;
  tabPayoff: string;
  loadingCards: string;
  cardsLoadError: string;
  cardLabel: string;
  customRateOption: string;
  /** Suffix appended to a card option when it publishes no APR: placeholders none. */
  aprNotPublishedSuffix: string;
  customAprLabel: string;
  customAprPlaceholder: string;
  /** Placeholders: {card} */
  noAprNotice: string;
  emiHeading: string;
  emiIntro: string;
  amountLabel: string;
  amountPlaceholder: string;
  tenureLabel: string;
  tenureUnit: string;
  calculateEmi: string;
  emiMonthly: string;
  emiTotalInterest: string;
  emiTotalPayable: string;
  payoffHeading: string;
  payoffIntro: string;
  balanceLabel: string;
  balancePlaceholder: string;
  monthlyPaymentLabel: string;
  monthlyPaymentPlaceholder: string;
  calculatePayoff: string;
  payoffMonthsLabel: string;
  /** Placeholders: {months} */
  payoffMonthsValue: string;
  payoffTotalInterest: string;
  payoffTotalPaid: string;
  /** Placeholders: {amount} */
  payoffFinalPayment: string;
  neverClearsTitle: string;
  /** Placeholders: {payment}, {interest} */
  neverClearsBody: string;
  resultsHeading: string;
  /** Placeholders: {apr}, {card} — card includes the bank name. */
  aprSourceCard: string;
  /** Placeholders: {apr} */
  aprSourceCustom: string;
  breakdownHeading: string;
  breakdownYear: string;
  breakdownPrincipal: string;
  breakdownInterest: string;
  breakdownBalance: string;
  /** Placeholders: {year} */
  yearLabel: string;
  errorAmount: string;
  errorTenure: string;
  errorApr: string;
  errorBalance: string;
  errorPayment: string;
  noteHeading: string;
  noteBody: string;
  tabFd: string;
  tabDps: string;
  fdHeading: string;
  fdIntro: string;
  dpsHeading: string;
  dpsIntro: string;
  depositProductLabel: string;
  customDepositRateOption: string;
  depositRateLabel: string;
  /** Placeholders: {product} */
  noRateForTenureNotice: string;
  fdAmountLabel: string;
  fdMonthsLabel: string;
  calculateFd: string;
  fdGross: string;
  fdInterest: string;
  fdTax: string;
  fdNet: string;
  dpsInstalmentLabel: string;
  dpsMonthsLabel: string;
  dpsModeMaturity: string;
  dpsModeGoal: string;
  dpsTargetLabel: string;
  calculateDps: string;
  dpsGross: string;
  dpsContributed: string;
  dpsRequiredInstalment: string;
  hasTinLabel: string;
  errorDepositRate: string;
  errorTarget: string;
  /** Placeholders: {rate}, {product} */
  depositRateSourceProduct: string;
  /** Placeholders: {rate} */
  depositRateSourceCustom: string;
  derivedRateSuffix: string;
}

const en: CalculatorsCopy = {
  seoTitle: 'EMI & Payoff Calculators | CreditMate AI',
  seoDescription:
    'Work out the monthly EMI on a purchase using a real card’s published APR, or see how long a balance takes to clear with a fixed monthly payment.',
  heading: 'EMI & Payoff Calculators',
  intro:
    'Pick one of the cards in our catalogue and the calculator uses that card’s published APR — or enter your own rate. Numbers are estimates from the standard formulas; a bank’s own EMI plan may add processing fees.',
  tabEmi: 'EMI calculator',
  tabPayoff: 'Payoff calculator',
  loadingCards: 'Loading cards…',
  cardsLoadError: 'Failed to load credit cards. Please try again later.',
  cardLabel: 'Card (uses its published APR)',
  customRateOption: 'Custom rate — enter an APR',
  aprNotPublishedSuffix: ' — APR not published',
  customAprLabel: 'APR (%)',
  customAprPlaceholder: 'e.g. 25',
  noAprNotice:
    '“{card}” publishes no APR, so we cannot calculate with a bank rate for it. Islamic and some other cards set their cost from the bank’s profit-rate terms, which are not published as an APR. Enter a rate below to estimate with your own figure — we never treat a missing APR as 0%.',
  emiHeading: 'EMI calculator',
  emiIntro: 'Spread a purchase over monthly instalments at a card’s APR.',
  amountLabel: 'Purchase amount (BDT)',
  amountPlaceholder: 'e.g. 120000',
  tenureLabel: 'Tenure (months)',
  tenureUnit: 'months',
  calculateEmi: 'Calculate EMI',
  emiMonthly: 'Monthly EMI',
  emiTotalInterest: 'Total interest',
  emiTotalPayable: 'Total payable',
  payoffHeading: 'Payoff calculator',
  payoffIntro: 'See how long a balance takes to clear with a fixed monthly payment.',
  balanceLabel: 'Current balance (BDT)',
  balancePlaceholder: 'e.g. 50000',
  monthlyPaymentLabel: 'Monthly payment (BDT)',
  monthlyPaymentPlaceholder: 'e.g. 5000',
  calculatePayoff: 'Calculate payoff time',
  payoffMonthsLabel: 'Time to clear',
  payoffMonthsValue: '{months} months',
  payoffTotalInterest: 'Total interest paid',
  payoffTotalPaid: 'Total paid',
  payoffFinalPayment: 'The final month’s payment is smaller: {amount}.',
  neverClearsTitle: 'This payment never clears the balance',
  neverClearsBody:
    'Your monthly payment of {payment} does not cover the first month’s interest of {interest}, so the balance would stay the same or grow. Increase the payment above {interest} to start reducing it.',
  resultsHeading: 'Result',
  aprSourceCard: 'APR {apr}% — {card}',
  aprSourceCustom: 'Custom APR {apr}%',
  breakdownHeading: 'Year-by-year breakdown',
  breakdownYear: 'Year',
  breakdownPrincipal: 'Principal paid',
  breakdownInterest: 'Interest paid',
  breakdownBalance: 'Balance left',
  yearLabel: 'Year {year}',
  errorAmount: 'Enter a purchase amount greater than zero.',
  errorTenure: 'Enter a tenure of at least 1 month (whole months only).',
  errorApr: 'Enter an APR of 0% or more.',
  errorBalance: 'Enter a balance greater than zero.',
  errorPayment: 'Enter a monthly payment greater than zero.',
  noteHeading: 'How these numbers are calculated',
  noteBody:
    'EMI uses the standard amortising formula with a monthly rate of APR ÷ 12. The payoff estimate applies your payment each month after that month’s interest. Annual fees, processing fees, VAT and late fees are not included, and banks may round instalments differently — treat the results as a close estimate, not a bank quote.',
  tabFd: 'FD calculator',
  tabDps: 'DPS calculator',
  fdHeading: 'Fixed deposit (FD) calculator',
  fdIntro:
    'Work out what a lump-sum deposit grows to. Pick a real product to use its published rate for your amount and tenure, or enter your own rate.',
  dpsHeading: 'DPS calculator',
  dpsIntro:
    'Work out what a monthly DPS grows to — or, in goal mode, the monthly instalment needed to reach a target amount.',
  depositProductLabel: 'Deposit product (uses its published rate)',
  customDepositRateOption: 'Custom rate — enter a rate',
  depositRateLabel: 'Rate (% per year)',
  noRateForTenureNotice:
    '“{product}” publishes no rate for this amount and tenure, so enter your own rate below — we never invent a rate.',
  fdAmountLabel: 'Deposit amount (BDT)',
  fdMonthsLabel: 'Tenure (months)',
  calculateFd: 'Calculate maturity',
  fdGross: 'Maturity (before tax)',
  fdInterest: 'Interest / expected profit earned',
  fdTax: 'Source tax on interest',
  fdNet: 'You receive (after tax)',
  dpsInstalmentLabel: 'Monthly instalment (BDT)',
  dpsMonthsLabel: 'Tenure (months)',
  dpsModeMaturity: 'Instalment → maturity',
  dpsModeGoal: 'Goal → instalment',
  dpsTargetLabel: 'Target amount at maturity (BDT)',
  calculateDps: 'Calculate',
  dpsGross: 'Maturity (before tax)',
  dpsContributed: 'You pay in total',
  dpsRequiredInstalment: 'Required monthly instalment',
  hasTinLabel: 'I have a TIN (source tax 10% instead of 15%)',
  errorDepositRate: 'Enter a rate of 0% or more.',
  errorTarget: 'Enter a target amount greater than zero.',
  depositRateSourceProduct: 'Rate {rate}% — {product}',
  depositRateSourceCustom: 'Custom rate {rate}%',
  derivedRateSuffix: ' (derived from the bank’s published maturity table)',
};

const bn: CalculatorsCopy = {
  seoTitle: 'ইএমআই ও পরিশোধ ক্যালকুলেটর | CreditMate AI',
  seoDescription:
    'প্রকৃত কার্ডের প্রকাশিত এপিআর ব্যবহার করে কেনাকাটার মাসিক ইএমআই হিসাব করুন, অথবা নির্দিষ্ট মাসিক পেমেন্টে ব্যালেন্স শোধ হতে কত সময় লাগবে দেখুন।',
  heading: 'ইএমআই ও পরিশোধ ক্যালকুলেটর',
  intro:
    'আমাদের তালিকার একটি কার্ড বেছে নিন — ক্যালকুলেটর সেই কার্ডের প্রকাশিত এপিআর ব্যবহার করবে — অথবা নিজের হার লিখুন। সংখ্যাগুলো প্রমিত সূত্র থেকে পাওয়া অনুমান; ব্যাংকের নিজস্ব ইএমআই পরিকল্পনায় প্রসেসিং ফি যোগ হতে পারে।',
  tabEmi: 'ইএমআই ক্যালকুলেটর',
  tabPayoff: 'পরিশোধ ক্যালকুলেটর',
  loadingCards: 'কার্ড লোড হচ্ছে…',
  cardsLoadError: 'ক্রেডিট কার্ড লোড করা যায়নি। পরে আবার চেষ্টা করুন।',
  cardLabel: 'কার্ড (এর প্রকাশিত এপিআর ব্যবহৃত হবে)',
  customRateOption: 'কাস্টম হার — নিজে এপিআর লিখুন',
  aprNotPublishedSuffix: ' — এপিআর প্রকাশিত নয়',
  customAprLabel: 'এপিআর (%)',
  customAprPlaceholder: 'যেমন ২৫',
  noAprNotice:
    "'{card}' কোনো এপিআর প্রকাশ করে না, তাই ব্যাংকের হার দিয়ে এর হিসাব করা যায় না। ইসলামি ও আরও কিছু কার্ডের খরচ ব্যাংকের মুনাফা-হারের শর্ত অনুযায়ী ঠিক হয়, যা এপিআর হিসেবে প্রকাশিত নয়। নিজের সংখ্যা দিয়ে অনুমান করতে নিচে একটি হার লিখুন — অনুপস্থিত এপিআরকে আমরা কখনো ০% ধরি না।",
  emiHeading: 'ইএমআই ক্যালকুলেটর',
  emiIntro: 'কার্ডের এপিআরে একটি কেনাকাটা মাসিক কিস্তিতে ভাগ করুন।',
  amountLabel: 'কেনাকাটার পরিমাণ (টাকা)',
  amountPlaceholder: 'যেমন ১২০০০০',
  tenureLabel: 'মেয়াদ (মাস)',
  tenureUnit: 'মাস',
  calculateEmi: 'ইএমআই হিসাব করুন',
  emiMonthly: 'মাসিক ইএমআই',
  emiTotalInterest: 'মোট সুদ',
  emiTotalPayable: 'মোট পরিশোধযোগ্য',
  payoffHeading: 'পরিশোধ ক্যালকুলেটর',
  payoffIntro: 'নির্দিষ্ট মাসিক পেমেন্টে একটি ব্যালেন্স শোধ হতে কত সময় লাগবে দেখুন।',
  balanceLabel: 'বর্তমান ব্যালেন্স (টাকা)',
  balancePlaceholder: 'যেমন ৫০০০০',
  monthlyPaymentLabel: 'মাসিক পেমেন্ট (টাকা)',
  monthlyPaymentPlaceholder: 'যেমন ৫০০০',
  calculatePayoff: 'পরিশোধের সময় হিসাব করুন',
  payoffMonthsLabel: 'শোধ হতে সময়',
  payoffMonthsValue: '{months} মাস',
  payoffTotalInterest: 'মোট সুদ পরিশোধ',
  payoffTotalPaid: 'মোট পরিশোধ',
  payoffFinalPayment: 'শেষ মাসের পেমেন্টটি ছোট: {amount}।',
  neverClearsTitle: 'এই পেমেন্টে ব্যালেন্স কখনো শোধ হবে না',
  neverClearsBody:
    'আপনার মাসিক পেমেন্ট {payment} প্রথম মাসের সুদ {interest}-এর চেয়ে কম, তাই ব্যালেন্স একই থাকবে বা বাড়বে। কমাতে হলে পেমেন্ট {interest}-এর বেশি করুন।',
  resultsHeading: 'ফলাফল',
  aprSourceCard: 'এপিআর {apr}% — {card}',
  aprSourceCustom: 'কাস্টম এপিআর {apr}%',
  breakdownHeading: 'বছরভিত্তিক বিবরণ',
  breakdownYear: 'বছর',
  breakdownPrincipal: 'পরিশোধিত মূল অর্থ',
  breakdownInterest: 'পরিশোধিত সুদ',
  breakdownBalance: 'অবশিষ্ট ব্যালেন্স',
  yearLabel: 'বছর {year}',
  errorAmount: 'শূন্যের বেশি কেনাকাটার পরিমাণ লিখুন।',
  errorTenure: 'কমপক্ষে ১ মাসের মেয়াদ লিখুন (পূর্ণ মাসে)।',
  errorApr: '০% বা তার বেশি এপিআর লিখুন।',
  errorBalance: 'শূন্যের বেশি ব্যালেন্স লিখুন।',
  errorPayment: 'শূন্যের বেশি মাসিক পেমেন্ট লিখুন।',
  noteHeading: 'এই সংখ্যাগুলো যেভাবে হিসাব করা হয়',
  noteBody:
    'ইএমআই প্রমিত অ্যামোর্টাইজিং সূত্রে হিসাব করা হয়, যেখানে মাসিক হার = এপিআর ভাগ ১২। পরিশোধের অনুমানে প্রতি মাসের সুদের পর আপনার পেমেন্ট প্রয়োগ করা হয়। বার্ষিক ফি, প্রসেসিং ফি, ভ্যাট ও লেট ফি এতে অন্তর্ভুক্ত নয়, এবং ব্যাংক কিস্তি অন্যভাবে রাউন্ড করতে পারে — ফলাফলকে ব্যাংকের কোট নয়, কাছাকাছি অনুমান হিসেবে নিন।',
  tabFd: 'এফডি ক্যালকুলেটর',
  tabDps: 'ডিপিএস ক্যালকুলেটর',
  fdHeading: 'স্থায়ী আমানত (এফডি) ক্যালকুলেটর',
  fdIntro:
    'এককালীন আমানত কত হবে হিসাব করুন। আপনার পরিমাণ ও মেয়াদের জন্য প্রকৃত পণ্যের প্রকাশিত হার ব্যবহার করতে একটি পণ্য বেছে নিন, অথবা নিজের হার লিখুন।',
  dpsHeading: 'ডিপিএস ক্যালকুলেটর',
  dpsIntro:
    'মাসিক ডিপিএস কত হবে হিসাব করুন — অথবা গোল মোডে, লক্ষ্য পরিমাণে পৌঁছাতে প্রয়োজনীয় মাসিক কিস্তি বের করুন।',
  depositProductLabel: 'আমানত পণ্য (এর প্রকাশিত হার ব্যবহৃত হবে)',
  customDepositRateOption: 'কাস্টম হার — নিজে হার লিখুন',
  depositRateLabel: 'হার (বার্ষিক %)',
  noRateForTenureNotice:
    "'{product}' এই পরিমাণ ও মেয়াদের জন্য কোনো হার প্রকাশ করে না, তাই নিচে নিজের হার লিখুন — আমরা কখনো হার অনুমান করি না।",
  fdAmountLabel: 'আমানতের পরিমাণ (টাকা)',
  fdMonthsLabel: 'মেয়াদ (মাস)',
  calculateFd: 'মেয়াদপূর্তি হিসাব করুন',
  fdGross: 'মেয়াদপূর্তি (করের আগে)',
  fdInterest: 'অর্জিত সুদ / প্রত্যাশিত মুনাফা',
  fdTax: 'সুদের উপর উৎস কর',
  fdNet: 'আপনি পাবেন (করের পর)',
  dpsInstalmentLabel: 'মাসিক কিস্তি (টাকা)',
  dpsMonthsLabel: 'মেয়াদ (মাস)',
  dpsModeMaturity: 'কিস্তি থেকে মেয়াদপূর্তি',
  dpsModeGoal: 'লক্ষ্যের জন্য কিস্তি',
  dpsTargetLabel: 'মেয়াদপূর্তিতে লক্ষ্য পরিমাণ (টাকা)',
  calculateDps: 'হিসাব করুন',
  dpsGross: 'মেয়াদপূর্তি (করের আগে)',
  dpsContributed: 'আপনার মোট জমা',
  dpsRequiredInstalment: 'প্রয়োজনীয় মাসিক কিস্তি',
  hasTinLabel: 'আমার টিন আছে (উৎস কর ১৫%-এর বদলে ১০%)',
  errorDepositRate: '০% বা তার বেশি হার লিখুন।',
  errorTarget: 'শূন্যের বেশি লক্ষ্য পরিমাণ লিখুন।',
  depositRateSourceProduct: 'হার {rate}% — {product}',
  depositRateSourceCustom: 'কাস্টম হার {rate}%',
  derivedRateSuffix: ' (ব্যাংকের প্রকাশিত মেয়াদপূর্তি সারণি থেকে নির্ণীত)',
};

export const CALCULATORS_COPY: Record<Language, CalculatorsCopy> = { en, bn };

export const getCalculatorsCopy = (lang: Language): CalculatorsCopy => CALCULATORS_COPY[lang];
