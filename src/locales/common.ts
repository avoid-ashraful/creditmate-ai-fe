/**
 * Common UI copy used across components (toast, skeleton, theme toggle, search,
 * filters, experiment results, comparison, quiz, calculator, guides, categories).
 * Bengali strings are drafted and need review by a native speaker before release.
 */

import type { Language } from './types';

export interface CommonCopy {
  // ThemeToggle
  themeToggleAriaLabel: string;
  themeLight: string;
  themeDark: string;

  // Toast / Skeleton
  skeletonLoading: string;

  // SearchAutocomplete
  searchPlaceholder: string;
  searchAriaLabel: string;
  searchSuggestionsAriaLabel: string;
  searchGroupCards: string;
  searchGroupBanks: string;
  searchGroupCategories: string;
  searchLoading: string;
  searchNoSuggestions: string;
  searchByMeta: string;
  searchCategoryNoFee: string;
  searchDidYouMean: string;

  // FilterPanel
  filterPanelTitle: string;
  filterExpand: string;
  filterCollapse: string;
  filterSectionBanks: string;
  filterSectionAnnualFee: string;
  filterSectionInterestRate: string;
  filterSectionAnnualFeeOptions: string;
  filterSectionLoungeAccess: string;
  filterSectionFeatures: string;
  filterSectionSearch: string;
  filterLabelMinAnnualFee: string;
  filterLabelMaxAnnualFee: string;
  filterLabelMinInterestRate: string;
  filterLabelMaxInterestRate: string;
  filterLabelAnnualFeeRange: string;
  filterLabelInterestRateRange: string;
  filterLabelHasAnnualFee: string;
  filterLabelHasFeeWaiver: string;
  filterLabelHasLoungeAccess: string;
  filterLabelHasInternationalLounge: string;
  filterLabelHasDomesticLounge: string;
  filterLabelMinInternationalLounge: string;
  filterLabelMinDomesticLounge: string;
  filterLabelHasAdditionalFeatures: string;
  filterLabelFeatureSearch: string;
  filterLabelSearchTerm: string;
  filterSectionCardNetwork: string;
  filterSectionCardType: string;
  filterSectionIncome: string;
  filterLabelIslamic: string;
  filterLabelDualCurrency: string;
  filterLabelMonthlyIncome: string;
  filterLabelIncludeUnknownIncome: string;
  filterErrorAnnualFeeFormat: string;
  filterErrorInterestRateFormat: string;
  filterApply: string;
  filterReset: string;

  // ExperimentResults
  experimentResultsTitle: string;
  experimentResultsSubtitle: string;
  experimentBackToApp: string;
  experimentEmptyStateTitle: string;
  experimentEmptyStateDesc: string;
  experimentLegendTitle: string;
  experimentLegendZTest: string;
  experimentLegendZTestDesc: string;
  experimentLegendConfidence: string;
  experimentLegendConfidenceDesc: string;
  experimentLegendMinSample: string;
  experimentLegendMinSampleDesc: string;
  experimentLegendGuardrail: string;
  experimentLegendGuardrailDesc: string;
  experimentLegendLift: string;
  experimentLegendLiftDesc: string;
  experimentLegendAutoStop: string;
  experimentLegendAutoStopDesc: string;
  experimentCardTitle: string;
  experimentCardControl: string;
  experimentCardTreatment: string;
  experimentCardVariant: string;
  experimentCardExposures: string;
  experimentCardConversions: string;
  experimentCardRate: string;
  experimentCardStatusHarm: string;
  experimentCardStatusSignificant: string;
  experimentCardStatusRunning: string;
  experimentCardStatusCollecting: string;
  experimentCardStatLift: string;
  experimentCardStatZScore: string;
  experimentCardStatPValue: string;
  experimentCardStatConfidence: string;
  experimentCardSampleStatus: string;
  experimentCardSampleMet: string;
  experimentCardSampleNotMet: string;
  experimentCardHarmWarning: string;
  experimentCardConfigTitle: string;
  experimentCardConfigTreatmentAlloc: string;
  experimentCardConfigMinSample: string;
  experimentCardConfigConfidence: string;
  experimentCardConfigEnabled: string;
  experimentCardConfigYes: string;
  experimentCardConfigNo: string;

  // ComparisonPage
  comparisonTitle: string;
  comparisonBackLink: string;
  comparisonShareButton: string;
  comparisonSaveButton: string;
  comparisonEmptyTitle: string;
  comparisonEmptyDesc: string;
  comparisonBrowseCards: string;
  comparisonSelectedTitle: string;
  comparisonSummaryCount: string;
  comparisonRemoveAriaLabel: string;
  comparisonFooterBrowse: string;
  comparisonFooterShare: string;
  comparisonDisclaimer: string;
  comparisonShareSuccess: string;
  comparisonShareError: string;
  comparisonAddCard: string;
  comparisonSelectedLabel: string;
  comparisonFeatureLabel: string;

  // CardDetailsPopup / CardListItem
  cardRewards: string;
  cardKeyFeatures: string;
  cardAdditionalFeatures: string;
  cardMoreFeatures: string;
  cardMoreInfo: string;
  cardSource: string;
  cardOfficialWebsite: string;
  cardLastUpdated: string;

  // RecommendationQuiz
  quizTitle: string;
  quizSubtitle: string;
  quizStepSpend: string;
  quizStepUse: string;
  quizStepTravel: string;
  quizStepFee: string;
  quizStepTier: string;
  quizStepResults: string;
  quizMonthlySpendLabel: string;
  quizMonthlySpendValue: string;
  quizMonthlySpendPerMonth: string;
  quizPrimaryUseLabel: string;
  quizPrimaryUseOptions: string[];
  quizTravelFrequencyLabel: string;
  quizTravelFrequencyOptions: string[];
  quizFeeToleranceLabel: string;
  quizFeeToleranceOptions: string[];
  quizCardTierLabel: string;
  quizCardTierOptions: string[];
  quizProgressLabel: string;
  quizLoadingCards: string;
  quizErrorLoading: string;
  quizErrorDetail: string;
  quizEmptyCards: string;
  quizResultsTitle: string;
  quizResultRank: string;
  quizResultScore: string;
  quizResultReason: string;
  quizShareButton: string;
  quizSeeAllButton: string;
  quizRetakeButton: string;
  quizShareSuccess: string;
  quizShareError: string;
  quizNavBack: string;
  quizNavNext: string;
  quizNavSeeResults: string;
  quizNoFee: string;

  // RewardCalculatorPage
  calcTitle: string;
  calcSubtitle: string;
  calcFormTitle: string;
  calcCategoryDining: string;
  calcCategoryTravel: string;
  calcCategoryGroceries: string;
  calcCategoryFuel: string;
  calcCategoryOther: string;
  calcTotalSpend: string;
  calcAssumptionsTitle: string;
  calcAssumption1: string;
  calcAssumption2: string;
  calcAssumption3: string;
  calcCalculateButton: string;
  calcEmptyTitle: string;
  calcEmptyDesc: string;
  calcErrorTitle: string;
  calcErrorDesc: string;
  calcResultsTitle: string;
  calcResultAnnualFee: string;
  calcResultEstRewards: string;
  calcResultNetValue: string;
  calcResultBreakEven: string;
  calcResultBreakEvenUnknown: string;
  calcExportCompare: string;
  calcLoading: string;

  // HomePage
  homeHeroCtaControl: string;
  homeHeroCtaTreatment: string;
  homeHeroSubtextControl: string;
  homeHeroSubtextTreatment: string;
  homeSearchPlaceholder: string;
  homeSearchAriaLabel: string;
  homeStatsPartnerBanks: string;
  homeStatsCreditCards: string;
  homeStatsExpertSupport: string;
  homeStatsFreeService: string;
  homeBenefitsTitle: string;
  homeBenefitComparison: string;
  homeBenefitComparisonDesc: string;
  homeBenefitValue: string;
  homeBenefitValueDesc: string;
  homeBenefitData: string;
  homeBenefitDataDesc: string;
  homeBenefitMobile: string;
  homeBenefitMobileDesc: string;
  homeSkeletonLabel: string;

  // CategoryPage
  categoryNotFoundTitle: string;
  categoryNotFoundDesc: string;
  categoryBackHome: string;
  categoryBadge: string;
  categoryCount: string;
  categoryLoadMore: string;
  categoryLoadingMore: string;
  categoryErrorLoading: string;
  categoryErrorLoadingMore: string;
  categorySkeletonLabel: string;
  categorySelectionLimit: string;
  categoryCardAriaLabel: string;
  categoryRelatedGuides: string;
  categoryOtherCategories: string;

  // GuidesPage
  guidesNotFoundTitle: string;
  guidesNotFoundDesc: string;
  guidesNotFoundButton: string;
  guidesIndexEyebrow: string;
  guidesIndexTitle: string;
  guidesIndexLede: string;
  guidesIndexReadButton: string;
  guidesArticleEyebrow: string;
  guidesArticleMetaReadingTime: string;
  guidesArticleMetaUpdated: string;
  guidesSectionFaq: string;
  guidesSectionSources: string;
  guidesSourcesDesc: string;
  guidesRelatedMore: string;
  guidesRelatedCategories: string;
  guidesButtonAll: string;
  guidesCtaTitle: string;
  guidesCtaDesc: string;
  guidesCtaButton: string;

  // AccountMenu (additional)
  accountMenuSavedItems: string;

  // Generic/Shared
  loading: string;
  error: string;
  unknown: string;
  aprIslamicNoInterest: string;
  loungeNotListed: string;

  // AboutPage
  aboutTitle: string;
  aboutSubtitle: string;
  missionTitle: string;
  missionDescription: string;
  problemTitle: string;
  problemInfoFragmentationTitle: string;
  problemInfoFragmentationDesc: string;
  problemComplexDocsTitle: string;
  problemComplexDocsDesc: string;
  problemTransparencyTitle: string;
  problemTransparencyDesc: string;
  problemDecisionFatigueTitle: string;
  problemDecisionFatigueDesc: string;
  solutionTitle: string;
  solutionDescription: string;
  solutionDataAggregationTitle: string;
  solutionDataAggregationDesc: string;
  solutionStandardizedComparisonsTitle: string;
  solutionStandardizedComparisonsDesc: string;
  solutionIntuitiveSearchTitle: string;
  solutionIntuitiveSearchDesc: string;
  solutionEducationalContentTitle: string;
  solutionEducationalContentDesc: string;
  teamTitle: string;
  teamIntro: string;
  teamMember1Name: string;
  teamMember1Role: string;
  teamMember1Bio: string;
  teamMember2Name: string;
  teamMember2Role: string;
  teamMember2Bio: string;
  teamMember3Name: string;
  teamMember3Role: string;
  teamMember3Bio: string;
  contactTitle: string;
  contactDescription: string;
  contactEmailLabel: string;
  contactEmailValue: string;
  contactAddressLabel: string;
  contactAddressValue: string;
  contactStartComparing: string;
  contactExploreGlossary: string;

  // GlossaryPage
  glossaryTitle: string;
  glossaryDescription: string;
  glossarySearchPlaceholder: string;
  glossarySearchAriaLabel: string;
  glossaryNoResults: string;

  // CardDetailsPopup / CardListItem / CardComparisonTable
  closeCardDetailsAriaLabel: string;
  prevImageAriaLabel: string;
  nextImageAriaLabel: string;
  feesSectionTitle: string;
  annualFeeWaiverSectionTitle: string;
  aprSuffix: string;
  intlSuffix: string;
  domesticSuffix: string;
  cashAdvanceFeeLabel: string;
  latePaymentFeeLabel: string;
  annualFeeWaiverLabel: string;
  featureColumnLabel: string;
  bankIdLabel: string;
  unknownBank: string;
  cardsByNetAnnualValue: string;

  // Saved service error fallback
  savedErrorFallback: string;
}

export const COMMON_COPY: Record<Language, CommonCopy> = {
  en: {
    // ThemeToggle
    themeToggleAriaLabel: 'Toggle dark mode',
    themeLight: 'Light',
    themeDark: 'Dark',

    // Toast / Skeleton
    skeletonLoading: 'Loading content...',

    // SearchAutocomplete
    searchPlaceholder: 'Search by card name, bank, or features...',
    searchAriaLabel: 'Search credit cards by name, bank, or features',
    searchSuggestionsAriaLabel: 'Search suggestions',
    searchGroupCards: 'Cards',
    searchGroupBanks: 'Banks',
    searchGroupCategories: 'Categories',
    searchLoading: 'Loading suggestions…',
    searchNoSuggestions: 'No suggestions',
    searchByMeta: 'by',
    searchCategoryNoFee: 'No Fee',
    searchDidYouMean: 'Did you mean:',

    // FilterPanel
    filterPanelTitle: 'Filter Options',
    filterExpand: 'Expand',
    filterCollapse: 'Collapse',
    filterSectionBanks: 'Banks',
    filterSectionAnnualFee: 'Annual Fee',
    filterSectionInterestRate: 'Interest Rate (APR)',
    filterSectionAnnualFeeOptions: 'Annual Fee Options',
    filterSectionLoungeAccess: 'Lounge Access',
    filterSectionFeatures: 'Features',
    filterSectionSearch: 'Search',
    filterLabelMinAnnualFee: 'Min (BDT):',
    filterLabelMaxAnnualFee: 'Max (BDT):',
    filterLabelMinInterestRate: 'Min (%):',
    filterLabelMaxInterestRate: 'Max (%):',
    filterLabelAnnualFeeRange: 'Or Range (min,max):',
    filterLabelInterestRateRange: 'Or Range (min,max):',
    filterLabelHasAnnualFee: 'Has Annual Fee',
    filterLabelHasFeeWaiver: 'Has Fee Waiver Policy',
    filterLabelHasLoungeAccess: 'Any Lounge Access',
    filterLabelHasInternationalLounge: 'International Lounge Access',
    filterLabelHasDomesticLounge: 'Domestic Lounge Access',
    filterLabelMinInternationalLounge: 'Min International:',
    filterLabelMinDomesticLounge: 'Min Domestic:',
    filterLabelHasAdditionalFeatures: 'Has Additional Features',
    filterLabelFeatureSearch: 'Search in features',
    filterLabelSearchTerm: 'Search by card name or features',
    filterSectionCardNetwork: 'Card network',
    filterSectionCardType: 'Card type',
    filterSectionIncome: 'Income requirement',
    filterLabelIslamic: 'Islamic (Shariah) cards only',
    filterLabelDualCurrency: 'Dual-currency only',
    filterLabelMonthlyIncome: 'My monthly income (BDT)',
    filterLabelIncludeUnknownIncome: "Include cards whose income requirement isn't published",
    filterErrorAnnualFeeFormat:
      'Invalid annual fee range format. Please use "min,max" format (e.g., "0,200").',
    filterErrorInterestRateFormat:
      'Invalid interest rate range format. Please use "min,max" format (e.g., "18.0,25.0").',
    filterApply: 'Apply Filters',
    filterReset: 'Reset',

    // ExperimentResults
    experimentResultsTitle: 'Experiment Results',
    experimentResultsSubtitle: 'Internal A/B Testing Dashboard',
    experimentBackToApp: '← Back to App',
    experimentEmptyStateTitle: 'No Experiments Running',
    experimentEmptyStateDesc: 'Experiments will appear here once they receive traffic.',
    experimentLegendTitle: 'Legend & Methodology',
    experimentLegendZTest: 'Two-Proportion Z-Test',
    experimentLegendZTestDesc:
      'Tests whether the difference in conversion rates between control and treatment is statistically significant.',
    experimentLegendConfidence: 'Confidence Level',
    experimentLegendConfidenceDesc:
      'Default 95% (α = 0.05). The probability that the observed difference is not due to chance.',
    experimentLegendMinSample: 'Minimum Sample Size',
    experimentLegendMinSampleDesc:
      'Both variants must reach this exposure count before significance is evaluated (default: 100).',
    experimentLegendGuardrail: 'Guardrail (Harm)',
    experimentLegendGuardrailDesc:
      'If treatment performs significantly worse than control (one-tailed), experiment auto-stops.',
    experimentLegendLift: 'Lift',
    experimentLegendLiftDesc:
      'Relative improvement: (treatment_rate - control_rate) / control_rate.',
    experimentLegendAutoStop: 'Auto-Stop',
    experimentLegendAutoStopDesc:
      'Experiments stop automatically on significance or harm detection.',
    experimentCardTitle: 'Experiment Configuration',
    experimentCardControl: 'Control',
    experimentCardTreatment: 'Treatment',
    experimentCardVariant: 'Variant',
    experimentCardExposures: 'Exposures',
    experimentCardConversions: 'Conversions',
    experimentCardRate: 'Rate',
    experimentCardStatusHarm: '⚠️ STOPPED – Harm Detected',
    experimentCardStatusSignificant: '✅ STOPPED – Significant',
    experimentCardStatusRunning: '🔄 Running (min sample met)',
    experimentCardStatusCollecting: '⏳ Collecting Data',
    experimentCardStatLift: 'Lift',
    experimentCardStatZScore: 'Z-Score',
    experimentCardStatPValue: 'P-Value',
    experimentCardStatConfidence: 'Confidence',
    experimentCardSampleStatus: 'Minimum sample size',
    experimentCardSampleMet: '✓',
    experimentCardSampleNotMet: '✗',
    experimentCardHarmWarning: '⚠️ Guardrail triggered: Treatment significantly worse than control',
    experimentCardConfigTitle: 'Experiment Configuration',
    experimentCardConfigTreatmentAlloc: 'Treatment Allocation',
    experimentCardConfigMinSample: 'Min Sample Size',
    experimentCardConfigConfidence: 'Confidence Level',
    experimentCardConfigEnabled: 'Enabled',
    experimentCardConfigYes: 'Yes',
    experimentCardConfigNo: 'No',

    // ComparisonPage
    comparisonTitle: 'Credit Card Comparison',
    comparisonBackLink: '← Back to All Cards',
    comparisonShareButton: 'Share Comparison',
    comparisonSaveButton: 'Save comparison',
    comparisonEmptyTitle: 'No Cards Selected',
    comparisonEmptyDesc: 'Please select credit cards to compare from the home page.',
    comparisonBrowseCards: 'Browse Credit Cards',
    comparisonSelectedTitle: 'Comparing Cards',
    comparisonSummaryCount: '',
    comparisonRemoveAriaLabel: 'Remove from comparison',
    comparisonFooterBrowse: 'Browse More Cards',
    comparisonFooterShare: 'Share This Comparison',
    comparisonDisclaimer:
      'Disclaimer: This information is provided for comparison purposes only. Please verify all details with the respective banks before applying for any credit card. Terms and conditions may apply.',
    comparisonShareSuccess: 'Comparison link copied to clipboard!',
    comparisonShareError: 'Could not copy the link. Please copy it from the address bar.',
    comparisonAddCard: 'Add a card',
    comparisonSelectedLabel: 'Selected: {count} of {max}',
    comparisonFeatureLabel: 'Feature',

    // CardDetailsPopup / CardListItem
    cardRewards: 'Rewards',
    cardKeyFeatures: 'Key Features',
    cardAdditionalFeatures: 'Additional Features',
    cardMoreFeatures: '+{count} more',
    cardMoreInfo: 'More Information',
    cardSource: 'Source:',
    cardOfficialWebsite: 'Official Website',
    cardLastUpdated: 'Last Updated:',

    // RecommendationQuiz
    quizTitle: 'Find Your Perfect Credit Card',
    quizSubtitle: 'Answer a few quick questions to get personalized recommendations',
    quizStepSpend: 'Spending',
    quizStepUse: 'Use',
    quizStepTravel: 'Travel',
    quizStepFee: 'Fees',
    quizStepTier: 'Tier',
    quizStepResults: 'Results',
    quizMonthlySpendLabel: "What's your typical monthly spending?",
    quizMonthlySpendValue: '৳',
    quizMonthlySpendPerMonth: 'per month',
    quizPrimaryUseLabel: 'What will you use the card for most?',
    quizPrimaryUseOptions: ['Travel', 'Dining', 'Shopping', 'Cashback', 'Premium'],
    quizTravelFrequencyLabel: 'How often do you travel?',
    quizTravelFrequencyOptions: ['Frequent', 'Occasional', 'Never'],
    quizFeeToleranceLabel: "What's your annual fee tolerance?",
    quizFeeToleranceOptions: ['No fees', 'Low', 'Moderate', 'High'],
    quizCardTierLabel: 'What card tier interests you?',
    quizCardTierOptions: ['Basic', 'Standard', 'Premium'],
    quizProgressLabel: 'Step',
    quizLoadingCards: 'Loading available cards...',
    quizErrorLoading: "Sorry, we couldn't load the cards right now. Please try again later.",
    quizErrorDetail: '',
    quizEmptyCards: 'No cards available at the moment. Please try again later.',
    quizResultsTitle: 'Your Top Recommendations',
    quizResultRank: '#',
    quizResultScore: '',
    quizResultReason: 'Why this card:',
    quizShareButton: '📤 Share Results',
    quizSeeAllButton: '👀 See All Cards',
    quizRetakeButton: '🔄 Retake Quiz',
    quizShareSuccess: 'Results link copied to clipboard!',
    quizShareError: 'Unable to copy the link automatically. Please copy it from the address bar.',
    quizNavBack: '← Back',
    quizNavNext: 'Next →',
    quizNavSeeResults: 'See Results →',
    quizNoFee: 'No fees',

    // RewardCalculatorPage
    calcTitle: 'Annual Fee vs Rewards Calculator',
    calcSubtitle:
      "Estimate whether a card's annual rewards outweigh its annual fee, based on your monthly spending pattern.",
    calcFormTitle: 'Your monthly spend by category',
    calcCategoryDining: 'Dining',
    calcCategoryTravel: 'Travel',
    calcCategoryGroceries: 'Groceries',
    calcCategoryFuel: 'Fuel',
    calcCategoryOther: 'Other',
    calcTotalSpend: 'Total monthly spend:',
    calcAssumptionsTitle: 'Assumptions',
    calcAssumption1:
      "Reward earn rates are parsed only from each card's published reward policy text. Categories without an explicitly stated boost use the card's base earn rate.",
    calcAssumption2:
      "To express rewards in BDT we conservatively assume 1 reward point = BDT 1. This is an estimate, not a bank-stated value; check each bank's redemption catalogue.",
    calcAssumption3: 'Lounge access, discounts and fee waivers are not monetised.',
    calcCalculateButton: 'Calculate best value cards',
    calcEmptyTitle: 'Enter your monthly spend',
    calcEmptyDesc:
      'Fill in your typical monthly spending above and we will rank the top cards by annual rewards minus annual fee.',
    calcErrorTitle: 'No cards to rank',
    calcErrorDesc: 'No active cards with known fees and parseable reward policies were found.',
    calcResultsTitle: 'Top',
    calcResultAnnualFee: 'Annual fee',
    calcResultEstRewards: 'Est. annual rewards',
    calcResultNetValue: 'Net annual value',
    calcResultBreakEven: 'Break-even monthly spend',
    calcResultBreakEvenUnknown: 'Not computable with current allocation',
    calcExportCompare: 'Export to comparison',
    calcLoading: 'Loading credit cards...',

    // HomePage
    homeHeroCtaControl: 'Find Your Perfect Credit Card',
    homeHeroCtaTreatment: 'Start Your Card Search',
    homeHeroSubtextControl:
      'Compare credit cards from top banks in Bangladesh and make informed financial decisions',
    homeHeroSubtextTreatment: "Compare top credit cards from Bangladesh's leading banks in seconds",
    homeSearchPlaceholder: 'Search by card name, bank, or features...',
    homeSearchAriaLabel: 'Search credit cards by name, bank, or features',
    homeStatsPartnerBanks: 'Partner Banks',
    homeStatsCreditCards: 'Credit Cards',
    homeStatsExpertSupport: 'Expert Support',
    homeStatsFreeService: 'Free Service',
    homeBenefitsTitle: 'Why Use CreditMate AI?',
    homeBenefitComparison: 'Clear Comparisons',
    homeBenefitComparisonDesc: 'Side-by-side comparisons of key features, fees, and benefits.',
    homeBenefitValue: 'Find the Best Value',
    homeBenefitValueDesc:
      'Easily identify cards with the lowest fees and best rewards for your needs.',
    homeBenefitData: 'Comprehensive Data',
    homeBenefitDataDesc: 'Detailed information from all major banks in Bangladesh.',
    homeBenefitMobile: 'Mobile Friendly',
    homeBenefitMobileDesc: 'Research and compare credit cards on any device.',
    homeSkeletonLabel: 'Loading credit cards...',

    // CategoryPage
    categoryNotFoundTitle: 'Category not found',
    categoryNotFoundDesc: 'The category you are looking for does not exist.',
    categoryBackHome: 'Back to homepage',
    categoryBadge: '',
    categoryCount: 'card(s) found',
    categoryLoadMore: 'Load more cards',
    categoryLoadingMore: 'Loading more cards...',
    categoryErrorLoading: 'Failed to load credit cards. Please try again later.',
    categoryErrorLoadingMore: 'Failed to load additional credit cards. Please try again later.',
    categorySkeletonLabel: 'Loading credit cards...',
    categorySelectionLimit: 'You can only select up to 4 cards for comparison.',
    categoryCardAriaLabel: 'Browse {name} credit cards',
    categoryRelatedGuides: 'Learn before you apply',
    categoryOtherCategories: 'Other categories',

    // GuidesPage
    guidesNotFoundTitle: 'Guide not found',
    guidesNotFoundDesc: 'That guide address does not exist. Browse the guides we do have.',
    guidesNotFoundButton: 'See all guides',
    guidesIndexEyebrow: 'Learn',
    guidesIndexTitle: 'Credit card guides and how-tos',
    guidesIndexLede:
      'Plain-language guides about credit cards, fees, interest and benefits in Bangladesh.',
    guidesIndexReadButton: 'Read guide',
    guidesArticleEyebrow: '',
    guidesArticleMetaReadingTime: '',
    guidesArticleMetaUpdated: 'Updated',
    guidesSectionFaq: 'Frequently asked questions',
    guidesSectionSources: 'Sources',
    guidesSourcesDesc: 'Every claim in this guide comes from one of these pages.',
    guidesRelatedMore: 'More guides',
    guidesRelatedCategories: 'Browse cards in these categories',
    guidesButtonAll: 'All guides',
    guidesCtaTitle: 'Ready to compare cards?',
    guidesCtaDesc:
      'Start on the home page. Use the fee waiver and lounge filters there, pick two to four cards, then press Compare Cards to see them side by side.',
    guidesCtaButton: 'Browse cards on the home page',

    // AccountMenu (additional)
    accountMenuSavedItems: 'Saved items',

    // Generic/Shared
    loading: 'Loading...',
    error: 'Something went wrong. Please try again.',
    unknown: 'Unknown',
    aprIslamicNoInterest: 'No interest (Islamic)',
    loungeNotListed: 'Not listed',

    // AboutPage
    aboutTitle: 'About CreditMate AI',
    aboutSubtitle: 'Compare credit cards in Bangladesh using published bank data',
    missionTitle: 'Our Mission',
    missionDescription:
      "CreditMate AI aims to simplify financial decision-making for Bangladeshi consumers by providing clear, unbiased, and easily comparable credit card information. Our platform aggregates, standardizes, and presents complex financial data in a user-friendly format, supporting informed decisions aligned with users' unique financial goals and lifestyles.",
    problemTitle: "The Problem We're Solving",
    problemInfoFragmentationTitle: 'Information Fragmentation',
    problemInfoFragmentationDesc:
      'Users struggle to access consistent and clear credit card information due to scattered data across numerous bank websites.',
    problemComplexDocsTitle: 'Complex Documentation',
    problemComplexDocsDesc:
      'Key information like fees and interest rates is buried in lengthy, difficult-to-interpret PDF documents.',
    problemTransparencyTitle: 'Transparency Issues',
    problemTransparencyDesc:
      'Hidden terms, ambiguous reward policies, and unclear eligibility criteria make it challenging to assess true card value.',
    problemDecisionFatigueTitle: 'Decision Fatigue',
    problemDecisionFatigueDesc:
      'Lack of comparative tools leads to confusion, causing suboptimal decisions based on promotional material rather than factual comparisons.',
    solutionTitle: 'Our Solution',
    solutionDescription:
      "CreditMate AI offers a comprehensive platform with standardized comparisons, intuitive search functionality, and educational resources to help users make informed financial decisions. We maintain transparency through clear presentation of information and don't promote specific cards without clear indication.",
    solutionDataAggregationTitle: 'Data Aggregation',
    solutionDataAggregationDesc:
      'Centralized repository containing up-to-date credit card information from all major Bangladeshi banks',
    solutionStandardizedComparisonsTitle: 'Standardized Comparisons',
    solutionStandardizedComparisonsDesc:
      'Clear, consistent formats to easily compare critical information such as fees, rewards, and lounge access',
    solutionIntuitiveSearchTitle: 'Intuitive Search & Filters',
    solutionIntuitiveSearchDesc:
      'User-friendly search functionality and filters enabling quick identification of suitable credit cards',
    solutionEducationalContentTitle: 'Educational Content',
    solutionEducationalContentDesc:
      'Informative articles and guides covering financial literacy topics to help users understand credit cards better',
    teamTitle: 'Our Team',
    teamIntro:
      'CreditMate AI was founded by a team of financial experts and technology enthusiasts committed to bringing transparency to the Bangladeshi financial market.',
    teamMember1Name: 'Jane Doe',
    teamMember1Role: 'Founder & CEO',
    teamMember1Bio: 'Former banking executive with 15 years of experience in the financial sector.',
    teamMember2Name: 'John Smith',
    teamMember2Role: 'Chief Technology Officer',
    teamMember2Bio: 'Tech entrepreneur with expertise in fintech solutions and data analytics.',
    teamMember3Name: 'Sarah Rahman',
    teamMember3Role: 'Head of Content',
    teamMember3Bio: 'Financial educator with a passion for simplifying complex financial concepts.',
    contactTitle: 'Contact Us',
    contactDescription: "Have questions or suggestions? We'd love to hear from you!",
    contactEmailLabel: 'Email',
    contactEmailValue: 'info@creditmate.ai',
    contactAddressLabel: 'Address',
    contactAddressValue: '123 Financial Street, Dhaka, Bangladesh',
    contactStartComparing: 'Start Comparing Cards',
    contactExploreGlossary: 'Explore Our Glossary',

    // GlossaryPage
    glossaryTitle: 'Financial Terms Glossary',
    glossaryDescription:
      'Understanding the key terminology used in credit card offers and financial products',
    glossarySearchPlaceholder: 'Search for terms...',
    glossarySearchAriaLabel: 'Search glossary',
    glossaryNoResults:
      'No terms match your search criteria. Try adjusting your search or category filter.',

    // CardDetailsPopup / CardListItem / CardComparisonTable
    closeCardDetailsAriaLabel: 'Close card details',
    prevImageAriaLabel: 'Previous image',
    nextImageAriaLabel: 'Next image',
    feesSectionTitle: 'Fees',
    annualFeeWaiverSectionTitle: 'Annual Fee Waiver',
    aprSuffix: '% APR',
    intlSuffix: "(Int'l)",
    domesticSuffix: '(Domestic)',
    cashAdvanceFeeLabel: 'Cash Advance Fee',
    latePaymentFeeLabel: 'Late Payment Fee',
    annualFeeWaiverLabel: 'Annual Fee Waiver',
    featureColumnLabel: 'Feature',
    bankIdLabel: 'Bank ID: {id}',
    unknownBank: 'Unknown bank',
    cardsByNetAnnualValue: 'cards by net annual value',

    // Saved service error fallback
    savedErrorFallback: 'Something went wrong. Please try again.',
  },
  bn: {
    // ThemeToggle
    themeToggleAriaLabel: 'ডার্ক মোড টগল করুন',
    themeLight: 'লাইট',
    themeDark: 'ডার্ক',

    // Toast / Skeleton
    skeletonLoading: 'বিষয়বস্তু লোড হচ্ছে…',

    // SearchAutocomplete
    searchPlaceholder: 'কার্ডের নাম, ব্যাংক বা বৈশিষ্ট্য দিয়ে খুঁজুন…',
    searchAriaLabel: 'নাম, ব্যাংক বা বৈশিষ্ট্য অনুযায়ী ক্রেডিট কার্ড খুঁজুন',
    searchSuggestionsAriaLabel: 'সার্চ সাজেশন',
    searchGroupCards: 'কার্ড',
    searchGroupBanks: 'ব্যাংক',
    searchGroupCategories: 'বিভাগ',
    searchLoading: 'সাজেশন লোড হচ্ছে…',
    searchNoSuggestions: 'কোনো সাজেশন নেই',
    searchByMeta: 'দ্বারা',
    searchCategoryNoFee: 'কোনো ফি নেই',
    searchDidYouMean: 'আপনি কি বলেisaient:',

    // FilterPanel
    filterPanelTitle: 'ফিল্টার অপশন',
    filterExpand: 'বিস্তারিত',
    filterCollapse: 'সংকুচিত',
    filterSectionBanks: 'ব্যাংক',
    filterSectionAnnualFee: 'বার্ষিক ফি',
    filterSectionInterestRate: 'সুদের হার (এপিআর)',
    filterSectionAnnualFeeOptions: 'বার্ষিক ফি অপশন',
    filterSectionLoungeAccess: 'লাউঞ্জ অ্যাক্সেস',
    filterSectionFeatures: 'বৈশিষ্ট্য',
    filterSectionSearch: 'সার্চ',
    filterLabelMinAnnualFee: 'ন্যূনতম (বিডিটিঃ)',
    filterLabelMaxAnnualFee: 'সর্বোচ্চ (বিডিটিঃ)',
    filterLabelMinInterestRate: 'ন্যূনতম (%):',
    filterLabelMaxInterestRate: 'সর্বোচ্চ (%):',
    filterLabelAnnualFeeRange: 'অথবা রেঞ্জ (ন্যূনতম,সর্বোচ্চ):',
    filterLabelInterestRateRange: 'অথবা রেঞ্জ (ন্যূনতম,সর্বোচ্চ):',
    filterLabelHasAnnualFee: 'বার্ষিক ফি রয়েছে',
    filterLabelHasFeeWaiver: 'ফি মওকুফ নীতি রয়েছে',
    filterLabelHasLoungeAccess: 'যেকোনো লাউঞ্জ অ্যাক্সেস',
    filterLabelHasInternationalLounge: 'আন্তর্জাতিক লাউঞ্জ অ্যাক্সেস',
    filterLabelHasDomesticLounge: 'দেশীয় লাউঞ্জ অ্যাক্সেস',
    filterLabelMinInternationalLounge: 'ন্যূনতম আন্তর্জাতিক:',
    filterLabelMinDomesticLounge: 'ন্যূনতম দেশীয়:',
    filterLabelHasAdditionalFeatures: 'অতিরিক্ত বৈশিষ্ট্য রয়েছে',
    filterLabelFeatureSearch: 'বৈশিষ্ট্যে সার্চ করুন',
    filterLabelSearchTerm: 'কার্ডের নাম বা বৈশিষ্ট্য দিয়ে খুঁজুন',
    filterSectionCardNetwork: 'কার্ড নেটওয়ার্ক',
    filterSectionCardType: 'কার্ডের ধরন',
    filterSectionIncome: 'আয়ের শর্ত',
    filterLabelIslamic: 'শুধু ইসলামিক (শরিয়াহ) কার্ড',
    filterLabelDualCurrency: 'শুধু ডুয়াল-কারেন্সি কার্ড',
    filterLabelMonthlyIncome: 'আমার মাসিক আয় (বিডিটি)',
    filterLabelIncludeUnknownIncome: 'যেসব কার্ডের আয়ের শর্ত প্রকাশিত নয় সেগুলোও দেখান',
    filterErrorAnnualFeeFormat:
      'অবৈধ বার্ষিক ফি রেঞ্জ ফরম্যাট। অনুগ্রহ করে "ন্যূনতম,সর্বোচ্চ" ফরম্যাট ব্যবহার করুন (যেমন: "০,২০০")।',
    filterErrorInterestRateFormat:
      'অবৈধ সুদের হার রেঞ্জ ফরম্যাট। অনুগ্রহ করে "ন্যূনতম,সর্বোচ্চ" ফরম্যাট ব্যবহার করুন (যেমন: "১৮.০,২৫.০")।',
    filterApply: 'ফিল্টার প্রয়োগ করুন',
    filterReset: 'রিসেট',

    // ExperimentResults
    experimentResultsTitle: 'পরীক্ষার ফলাফল',
    experimentResultsSubtitle: 'অভ্যন্তরীণ এ/বি টেস্টিং ড্যাশবোর্ড',
    experimentBackToApp: '← অ্যাপে ফিরে যান',
    experimentEmptyStateTitle: 'কোনো পরীক্ষা চলছে না',
    experimentEmptyStateDesc: 'ট্রাফিক পাওয়ার সাথে সাথে এখানে পরীক্ষাগুলো প্রদর্শিত হবে।',
    experimentLegendTitle: 'লেজেন্ড ও পদ্ধতি',
    experimentLegendZTest: 'দুই-অনুপাত জি-টেস্ট',
    experimentLegendZTestDesc:
      'নিযন্ত্রণ ও পরিশোধের রূপান্তর হার পার্থক্য সাংখ্যিকভাবে উল্লেখ্য কিনা তা যাচাই করে।',
    experimentLegendConfidence: 'আত্মবিশ্বাসের স্তর',
    experimentLegendConfidenceDesc:
      'ডিফল্ট ৯৫% (α = ০.০৫)। পর্যবহণ করা পার্থক্য সুযোগবশত নয় তা নির্ভুল করার প্রায়িকতা।',
    experimentLegendMinSample: 'ন্যূনতম নমুনা আকার',
    experimentLegendMinSampleDesc:
      'উল্লেখনীয়তা মূল্যায়ন করার আগে উভয় সংস্করণে এই এক্সপোজার সংখ্যা পৌঁছাতে হবে (ডিফল্ট: ১০০)।',
    experimentLegendGuardrail: 'গার্ডরেইল (ক্ষতি)',
    experimentLegendGuardrailDesc:
      'পরিশোধ নিযন্ত্রণের চেয়ে য encontra significant worse হলে (one-tailed), পরীক্ষা স্বয়ংক্রিয়ভাবে বন্ধ হয়।',
    experimentLegendLift: 'লিফ্ট',
    experimentLegendLiftDesc: 'আপেক্ষিক উন্নতি: (treatment_rate - control_rate) / control_rate।',
    experimentLegendAutoStop: 'অটো-স্টপ',
    experimentLegendAutoStopDesc:
      'উল্লেখনীয়তা বা ক্ষতি সনাক্ত হলে পরীক্ষা স্বয়ংক্রিয়ভাবে বন্ধ হয়।',
    experimentCardTitle: 'পরীক্ষার কনফিগারেশন',
    experimentCardControl: 'নিয়ন্ত্রণ',
    experimentCardTreatment: 'পরিশোধ',
    experimentCardVariant: 'ভারিয়েন্ট',
    experimentCardExposures: 'এক্সপোজার',
    experimentCardConversions: 'রূপান্তর',
    experimentCardRate: 'হার',
    experimentCardStatusHarm: '⚠️ বন্ধ – ক্ষতি সনাক্ত',
    experimentCardStatusSignificant: '✅ বন্ধ – উল্লেখযোগ্য',
    experimentCardStatusRunning: '🔄 চলছে (ন্যূনতম নমুনা পাওয়া গেছে)',
    experimentCardStatusCollecting: '⏳ ডেটা সংগ্রহ করা হচ্ছে',
    experimentCardStatLift: 'লিফ্ট',
    experimentCardStatZScore: 'জি-স্কোর',
    experimentCardStatPValue: 'পি-ভ্যালু',
    experimentCardStatConfidence: 'আত্মবিশ্বাস',
    experimentCardSampleStatus: 'ন্যূনতম নমুনা আকার',
    experimentCardSampleMet: '✓',
    experimentCardSampleNotMet: '✗',
    experimentCardHarmWarning:
      '⚠️ গার্ডরেইল ট্রিগার: পরিশোধ নিযন্ত্রণের চেয়ে উল্লেখযোগ্যভাবে খারাপ',
    experimentCardConfigTitle: 'পরীক্ষার কনফিগারেশন',
    experimentCardConfigTreatmentAlloc: 'পরিশোধ বণ্টন',
    experimentCardConfigMinSample: 'ন্যূনতম নমুনা আকার',
    experimentCardConfigConfidence: 'আত্মবিশ্বাসের স্তর',
    experimentCardConfigEnabled: 'সক্রিয়',
    experimentCardConfigYes: 'হ্যাঁ',
    experimentCardConfigNo: 'না',

    // ComparisonPage
    comparisonTitle: 'ক্রেডিট কার্ড তুলনা',
    comparisonBackLink: '← সব কার্ডে ফিরে যান',
    comparisonShareButton: 'তুলনা শেয়ার করুন',
    comparisonSaveButton: 'তুলনা সংরক্ষণ করুন',
    comparisonEmptyTitle: 'কোনো কার্ড নির্বাচিত নেই',
    comparisonEmptyDesc: 'হোম পেজ থেকে ক্রেডিট কার্ড নির্বাচন করে তুলনা শুরু করুন।',
    comparisonBrowseCards: 'ক্রেডিট কার্ড ব্রাউজ করুন',
    comparisonSelectedTitle: 'তুলনামূলক কার্ড',
    comparisonSummaryCount: '',
    comparisonRemoveAriaLabel: 'তুলনা থেকে সরান',
    comparisonFooterBrowse: 'আরো কার্ড ব্রাউজ করুন',
    comparisonFooterShare: 'এই তুলনা শেয়ার করুন',
    comparisonDisclaimer:
      'ডিসক্লেমার: এই তথ্য শুধুমাত্র তুলনার উদ্দেশ্যে প্রদান করা হয়েছে। কোনো ক্রেডিট কার্ডের জন্য আবেদন করার আগে সংশ্লিষ্ট ব্যাংকের সাথে সব বিবরণ যাচাই করুন। প্রযোজ্য শর্তাবলী থাকতে পারে।',
    comparisonShareSuccess: 'তুলনার লিংক ক্লিপবোর্ডে কপি হয়েছে!',
    comparisonShareError: 'লিংক কপি করা যায়নি। অ্যাড্রেস বার থেকে কপি করুন।',
    comparisonAddCard: 'একটি কার্ড যোগ করুন',
    comparisonSelectedLabel: 'নির্বাচিত: {count} / {max}',
    comparisonFeatureLabel: 'বৈশিষ্ট্য',

    // CardDetailsPopup / CardListItem
    cardRewards: 'রিওয়ার্ড',
    cardKeyFeatures: 'প্রধান বৈশিষ্ট্য',
    cardAdditionalFeatures: 'অতিরিক্ত বৈশিষ্ট্য',
    cardMoreFeatures: '+{count} আরো',
    cardMoreInfo: 'আরও তথ্য',
    cardSource: 'উৎস:',
    cardOfficialWebsite: 'আফিসিয়াল ওয়েবসাইট',
    cardLastUpdated: 'শেষ আপডেট:',

    // RecommendationQuiz
    quizTitle: 'আপনার সঠিক ক্রেডিট কার্ড খুঁজুন',
    quizSubtitle: 'কয়েকটি সহজ প্রশ্নের জবাব দিয়ে ব্যক্তিগত সুপারিশ পান',
    quizStepSpend: 'খরচ',
    quizStepUse: 'ব্যবহার',
    quizStepTravel: 'ভ্রমণ',
    quizStepFee: 'ফি',
    quizStepTier: 'টায়ার',
    quizStepResults: 'ফলাফল',
    quizMonthlySpendLabel: 'আপনার সাধারণ মাসিক খরচ কত?',
    quizMonthlySpendValue: '৳',
    quizMonthlySpendPerMonth: 'প্রতি মাসে',
    quizPrimaryUseLabel: 'কার্ডটি মূলত কিসের জন্য ব্যবহার করবেন?',
    quizPrimaryUseOptions: ['ভ্রমণ', 'খাবার', 'শপিং', 'ক্যাশব্যাক', 'প্রিমিয়াম'],
    quizTravelFrequencyLabel: 'আপনি কতবার ভ্রমণ করেন?',
    quizTravelFrequencyOptions: ['বাড়াবারি', 'কদাচিৎ', 'কখনো নেই'],
    quizFeeToleranceLabel: 'বার্ষিক ফি সম্পর্কে আপনার মতামত?',
    quizFeeToleranceOptions: ['কোনো ফি নেই', 'কম', 'মাঝপথ', 'অধিক'],
    quizCardTierLabel: 'কোন কার্ড টায়ার আপনার আকর্ষণীয়?',
    quizCardTierOptions: ['বেসিক', 'স্ট্যান্ডার্ড', 'প্রিমিয়াম'],
    quizProgressLabel: 'ধাপ',
    quizLoadingCards: 'উপলব্ধ কার্ড লোড হচ্ছে…',
    quizErrorLoading: 'দুঃখিত, কার্ডগুলো লোড করা সম্ভব হয়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
    quizErrorDetail: '',
    quizEmptyCards: 'এই মুহূর্তে কোনো কার্ড উপলব্ধ নেই। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
    quizResultsTitle: 'আপনার জন্য শীর্ষ সুপারিশ',
    quizResultRank: '#',
    quizResultScore: '',
    quizResultReason: 'এই কার্ড কেন:',
    quizShareButton: '📤 ফলাফল শেয়ার করুন',
    quizSeeAllButton: '👀 সব কার্ড দেখুন',
    quizRetakeButton: '🔄 কুইজ আবার দিন',
    quizShareSuccess: 'ফলাফলের লিংক ক্লিপবোর্ডে কপি হয়েছে!',
    quizShareError: 'লিংক স্বয়ংক্রিয়ভাবে কপি করা সম্ভব হয়নি। অ্যাড্রেস বারের থেকে কপি করুন।',
    quizNavBack: '← পিছনে',
    quizNavNext: 'পরবর্তী →',
    quizNavSeeResults: 'ফলাফল দেখুন →',
    quizNoFee: 'কোনো ফি নেই',

    // RewardCalculatorPage
    calcTitle: 'বার্ষিক ফি বনাম রিওয়ার্ড ক্যালকুলেটর',
    calcSubtitle:
      'আপনার মাসিক খরচের প্যাটার্ন অনুযায়ী কার্ডের বার্ষিক রিওয়ার্ড তার বার্ষিক ফির চেয়ে বেশি কিনা তা অনুমান করুন।',
    calcFormTitle: 'বিভাগ অনুযায়ী আপনার মাসিক খরচ',
    calcCategoryDining: 'খাবার',
    calcCategoryTravel: 'ভ্রমণ',
    calcCategoryGroceries: 'কিরানা',
    calcCategoryFuel: 'ইঞ্জিন তেল',
    calcCategoryOther: 'অন্যান্য',
    calcTotalSpend: 'মোট মাসিক খরচ:',
    calcAssumptionsTitle: 'ধারণা',
    calcAssumption1:
      'রিওয়ার্ড আয়ের হার শুধুমাত্র প্রতিটি কার্ডের প্রকাশিত রিওয়ার্ড নীতির লেখা থেকে পার্স করা হয়। স্পষ্টভাবে উল্লিখিত বুস্ট নেই এমন বিভাগগুলো কার্ডের বেস আয়ের হারের অধীন।',
    calcAssumption2:
      'রিওয়ার্ডকে বিডিটি-তে প্রকাশ করার জন্য আমরা রক্ষণশীলভাবে ১ রিওয়ার্ড পয়েন্ট = ১ বিডিটি ধরে নিচ্ছি। এটি একটি অনুমান, ব্যাংক-ব্যাবসায় করা মান নয়; প্রতিটি ব্যাংকের রিডেমশন ক্যাটালগ যাচাই করুন।',
    calcAssumption3: 'লাউঞ্জ অ্যাক্সেস, ছাড় এবং ফি মওকুফ আয়াত করানো হয়নি।',
    calcCalculateButton: 'সেরা মূল্যের কার্ডগুলো ক্যালকুলেট করুন',
    calcEmptyTitle: 'আপনার মাসিক খরচ লিখুন',
    calcEmptyDesc:
      'উপর আপনার সাধারণ মাসিক খরচ বসান এবং আমরা বার্ষিক রিওয়ার্ড মাইনাস বার্ষিক ফি অনুযায়ী শীর্ষ কার্ডগুলো র‍্যাঙ্ক করব।',
    calcErrorTitle: 'র‍্যাঙ্ক করার কার্ড নেই',
    calcErrorDesc:
      'প্রচলিত ফি এবং পার্সযোগ্য রিওয়ার্ড নীতিবালো কোনো সক্রিয় কার্ড পাওয়া যাচ্ছে না।',
    calcResultsTitle: 'নিট অ্যানুয়াল ভ্যালু অনুযায়ী শীর্ষ',
    calcResultAnnualFee: 'বার্ষিক ফি',
    calcResultEstRewards: 'আনুমানিক বার্ষিক রিওয়ার্ড',
    calcResultNetValue: 'নিট বার্ষিক মূল্য',
    calcResultBreakEven: 'ব্রেক-ইভেন মাসিক খরচ',
    calcResultBreakEvenUnknown: 'বর্তমান বণ্টনে গণনা সম্ভব নয়',
    calcExportCompare: 'তুলনায় রপ্তানি করুন',
    calcLoading: 'ক্রেডিট কার্ড লোড হচ্ছে…',

    // HomePage
    homeHeroCtaControl: 'আপনার সঠিক ক্রেডিট কার্ড খুঁজুন',
    homeHeroCtaTreatment: 'আপনার কার্ড সার্চ শুরু করুন',
    homeHeroSubtextControl:
      'বাংলাদেশের শীর্ষ ব্যাংক থেকে ক্রেডিট কার্ড তুলনা করুন এবং সুনির্দিষ্ট আর্থিক সিদ্ধান্ত নিন',
    homeHeroSubtextTreatment: 'বাংলাদেশের আগ্রণী ব্যাংকদের শীর্ষ ক্রেডিট কার্ড সেকেন্ডে তুলনা করুন',
    homeSearchPlaceholder: 'কার্ডের নাম, ব্যাংক বা বৈশিষ্ট্য দিয়ে খুঁজুন…',
    homeSearchAriaLabel: 'নাম, ব্যাংক বা বৈশিষ্ট্য অনুযায়ী ক্রেডিট কার্ড খুঁজুন',
    homeStatsPartnerBanks: 'সহযোগী ব্যাংক',
    homeStatsCreditCards: 'ক্রেডিট কার্ড',
    homeStatsExpertSupport: 'বিশেষজ্ঞ সহায়তা',
    homeStatsFreeService: 'নিঃশুল্ক সেবা',
    homeBenefitsTitle: 'কেন CreditMate AI ব্যবহার করবেন?',
    homeBenefitComparison: 'স্পষ্ট তুলনা',
    homeBenefitComparisonDesc: 'প্রধান বৈশিষ্ট্য, ফি এবং সুবিধায় পাশাপাশি তুলনা।',
    homeBenefitValue: 'সেরা মূল্য খুঁজুন',
    homeBenefitValueDesc: 'আপনার দরকার অনুযায়ী সবচেয়ে কম ফি এবং সেরা রিওয়ার্ড পাওয়া যায়।',
    homeBenefitData: 'ব্যাপক তথ্য',
    homeBenefitDataDesc: 'বাংলাদেশের সব বড় ব্যাংক থেকে বিস্তারিত তথ্য।',
    homeBenefitMobile: 'মোবাইল-বান্ধব',
    homeBenefitMobileDesc: 'যেকোনো ডিভাইস থেকে ক্রেডিট কার্ড গবেষণা ও তুলনা করুন।',
    homeSkeletonLabel: 'ক্রেডিট কার্ড লোড হচ্ছে…',

    // CategoryPage
    categoryNotFoundTitle: 'বিভাগ পাওয়া যায়নি',
    categoryNotFoundDesc: 'আপনি যে বিভাগটি খুঁজছেন সেটি অস্তিত্বে নেই।',
    categoryBackHome: 'হোমপেজে ফিরে যান',
    categoryBadge: '',
    categoryCount: 'কার্ড পাওয়া গেছে',
    categoryLoadMore: 'আরো কার্ড লোড করুন',
    categoryLoadingMore: 'আরো কার্ড লোড হচ্ছে…',
    categoryErrorLoading: 'ক্রেডিট কার্ড লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    categoryErrorLoadingMore: 'আরো ক্রেডিট কার্ড লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    categorySkeletonLabel: 'ক্রেডিট কার্ড লোড হচ্ছে…',
    categorySelectionLimit: 'আপনি সর্বোচ্চ ৪টি কার্ড তুলনার জন্য নির্বাচন করতে পারেন।',
    categoryCardAriaLabel: '{name} ক্রেডিট কার্ড দেখুন',
    categoryRelatedGuides: 'আবেদনের আগে জানুন',
    categoryOtherCategories: 'অন্যান্য বিভাগ',

    // GuidesPage
    guidesNotFoundTitle: 'গাইড পাওয়া যায়নি',
    guidesNotFoundDesc:
      'আপনি যে গাইডটি খুঁজছেন সেটি নেই। আমাদের যে গাইডগুলো আছে সেগুলো ব্রাউজ করুন।',
    guidesNotFoundButton: 'সব গাইড দেখুন',
    guidesIndexEyebrow: 'শিখুন',
    guidesIndexTitle: 'ক্রেডিট কার্ড গাইড ও হাউ-টু',
    guidesIndexLede:
      'চারটি সংক্ষিপ্ত গাইড যা সহজ বাংলায় ক্রেডিট কার্ড ব্যাখ্যা করে। প্রতিটি গাইড বাংলাদেশ ব্যাংকের নিয়ম বা ব্যাংকের নিজস্ব পৃষ্ঠা উদ্ধৃতি করে।',
    guidesIndexReadButton: 'গাইড পড়ুন',
    guidesArticleEyebrow: '',
    guidesArticleMetaReadingTime: '',
    guidesArticleMetaUpdated: 'আপডেট করা',
    guidesSectionFaq: 'প্রশ্ন-উত্তর',
    guidesSectionSources: 'উৎস',
    guidesSourcesDesc: 'এই গাইডের প্রতিটি দাবী এই পৃষ্ঠাগুলোর একটি থেকে এসেছে।',
    guidesRelatedMore: 'আরো গাইড',
    guidesRelatedCategories: 'এই বিভাগের কার্ড ব্রাউজ করুন',
    guidesButtonAll: 'সব গাইড',
    guidesCtaTitle: 'কার্ড তুলনা করতে প্রস্তুত?',
    guidesCtaDesc:
      'হোম পেজ থেকে শুরু করুন। ফি মওকুফ এবং লাউঞ্জ ফিল্টার ব্যবহার করুন, দুটি থেকে চারটি কার্ড বেছে নিন, তারপর Compare Cards চাপুন পাশাপাশি দেখার জন্য।',
    guidesCtaButton: 'হোম পেজে কার্ড ব্রাউজ করুন',

    // AccountMenu (additional)
    accountMenuSavedItems: 'সংরক্ষিত আইটেম',

    // Generic/Shared
    loading: 'লোড হচ্ছে…',
    error: 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    unknown: 'অজানা',
    aprIslamicNoInterest: 'সুদ নেই (ইসলামিক)',
    loungeNotListed: 'তালিকাভুক্ত নয়',

    // AboutPage
    aboutTitle: 'CreditMate AI সম্পর্কে',
    aboutSubtitle: 'প্রকাশিত ব্যাংক তথ্যের ভিত্তিতে বাংলাদেশের ক্রেডিট কার্ডের তুলনা',
    missionTitle: 'আমাদের মিশন',
    missionDescription:
      'CreditMate AI বাংলাদেশের ভোক্তাদের আর্থিক সিদ্ধান্ত গ্রহণকে সহজ করার লক্ষ্যে স্পষ্ট, পক্ষপাতমূলক নয় এবং সহজে তুলনাযোগ্য ক্রেডিট কার্ড তথ্য প্রদান করে। আমাদের প্ল্যাটফর্ম জটিল আর্থিক ডেটা সংগৃহীত, মানদণ্ডায়িত ও ব্যবহারকারী-বান্ধব আকারে উপস্থাপন করে, যাতে ব্যবহারকারীরা তাদের অনন্য আর্থিক লক্ষ্য ও জীবনযাত্রার সাথে সামঞ্জস্যপূর্ণ সুনির্দিষ্ট সিদ্ধান্ত নিতে পারে।',
    problemTitle: 'আমরা যে সমস্যাগুলো সমাধান করছি',
    problemInfoFragmentationTitle: 'তথ্যের খণ্ডীকরণ',
    problemInfoFragmentationDesc:
      'অনেক ব্যাংকের ওয়েবসাইট জুড়ে বেরিয়ে থাকা ডেটা কারণে ব্যবহারকারীরা সুসঙ্গত ও স্পষ্ট ক্রেডিট কার্ড তথ্য পেতে ব্যর্থ হন।',
    problemComplexDocsTitle: 'জটিল ডকুমেন্টেশন',
    problemComplexDocsDesc:
      'ফি ও সুদের হার gibi গুরুত্বপূর্ণ তথ্য দীর্ঘ, ব্যাখ্যা করা কঠিন পিডিএফ ডকুমেন্টের ভেতরে লুকিয়ে থাকে।',
    problemTransparencyTitle: 'পারদর্শিতার অভাব',
    problemTransparencyDesc:
      'গোপন শর্তাবলী, অস্পষ্ট পুরস্কার নীতি এবং অস্পষ্ট যোগ্যতার মানদণ্ড আসল কার্ড মূল্য অনুমান করা কঠিন করে তোলে।',
    problemDecisionFatigueTitle: 'সিদ্ধান্তের ক্লান্তি',
    problemDecisionFatigueDesc:
      'তুলনামূলক টুলের অভাব বিভ্রান্তি সৃষ্টি করে, যার ফলে বাস্তব তুলনার পরিবর্তে প্রচার সামগ্রীর ওপর ভিত্তি করে অপ্টিমাল নয় সিদ্ধান্ত নেওয়া হয়।',
    solutionTitle: 'আমাদের সমাধান',
    solutionDescription:
      'CreditMate AI মানদণ্ডায়িত তুলনা, স্বজ্ঞাত সার্চ কার্যকারিতা এবং শিক্ষামূলক সংসাধন সহ একটি বিস্তৃত প্ল্যাটফর্ম প্রদান করে যাতে ব্যবহারকারীরা সুনির্দিষ্ট আর্থিক সিদ্ধান্ত নিতে পারে। আমরা তথ্যের স্পষ্ট উপস্থাপনার মাধ্যমে পারদর্শিতা রক্ষা করি এবং স্পষ্ট ইঙ্গিত ছাড়া নির্দিষ্ট কার্ড প্রচার করি না।',
    solutionDataAggregationTitle: 'ডেটা সংগ্রহ',
    solutionDataAggregationDesc:
      'বাংলাদেশের সকল বড় ব্যাংকের আপডেটেড ক্রেডিট কার্ড তথ্য সম্বলিত কেন্দ্রীভূত সংগ্রহস্থল',
    solutionStandardizedComparisonsTitle: 'মানদণ্ডায়িত তুলনা',
    solutionStandardizedComparisonsDesc:
      'ফি, পুরস্কার এবং লাউঞ্জ অ্যাক্সেসের মত গুরুত্বপূর্ণ তথ্য সহজে তুলনা করার জন্য স্পষ্ট, সামঞ্জস্যপূর্ণ ফরম্যাট',
    solutionIntuitiveSearchTitle: 'স্বজ্ঞাত সার্চ ও ফিল্টার',
    solutionIntuitiveSearchDesc:
      'উপযুক্ত ক্রেডিট কার্ড দ্রুত শনাক্ত করার জন্য ব্যবহারকারী-বান্ধব সার্চ কার্যকারিতা ও ফিল্টার',
    solutionEducationalContentTitle: 'শিক্ষামূলক বিষয়বস্তু',
    solutionEducationalContentDesc:
      'ব্যবহারকারীদের ক্রেডিট কার্ড বুঝতে সাহায্য করতে আর্থিক সাক্ষরতা বিষয়ক তথ্যবহুল নিবন্ধ ও গাইড',
    teamTitle: 'আমাদের দল',
    teamIntro:
      'CreditMate AI আর্থিক বিশেষজ্ঞ ও প্রযুক্তি উদ্ভাবনীদের একটি দল দ্বারা প্রতিষ্ঠিত, যারা বাংলাদেশের আর্থিক বাজারে পারদর্শিতা আনার জন্য প্রতিশ্রুতিবদ্ধ।',
    teamMember1Name: 'জেন ডো',
    teamMember1Role: 'সংস্থাপক ও সিইও',
    teamMember1Bio: 'আর্থিক খাতে ১৫ বছরের অভিজ্ঞতাসহ প্রাক্তন ব্যাংকিং কর্মকর্তা।',
    teamMember2Name: 'জন স্মিথ',
    teamMember2Role: 'প্রধান প্রযুক্তি কর্মকর্তা',
    teamMember2Bio: 'ফিনটেক সমাধান ও ডেটা বিশ্লেষণে দক্ষ প্রযুক্তি উদ্যোক্তা।',
    teamMember3Name: 'সারা রহমান',
    teamMember3Role: 'কন্টেন্ট বিভাগের প্রধান',
    teamMember3Bio: 'জটিল আর্থিক ধারণাগুলো সহজ করার শখসহ আর্থিক শিক্ষক।',
    contactTitle: 'যোগাযোগ করুন',
    contactDescription: 'প্রশ্ন বা পরামর্শ আছে? আমরা আপনার কথা শুনতে চাই!',
    contactEmailLabel: 'ইমেইল',
    contactEmailValue: 'info@creditmate.ai',
    contactAddressLabel: 'ঠিকানা',
    contactAddressValue: '১২৩ ফিনান্সিয়াল স্ট্রিট, ঢাকা, বাংলাদেশ',
    contactStartComparing: 'কার্ড তুলনা শুরু করুন',
    contactExploreGlossary: 'আমাদের শব্দকোষে ঘুরুন',

    // GlossaryPage
    glossaryTitle: 'আর্থিক শব্দকোষ',
    glossaryDescription: 'ক্রেডিট কার্ডের প্রস্তাব ও আর্থিক পণ্যে ব্যবহৃত মূল পরিভাষাগুলো বুঝুন।',
    glossarySearchPlaceholder: 'শব্দ খুঁজুন...',
    glossarySearchAriaLabel: 'শব্দ খুঁজুন',
    glossaryNoResults:
      'আপনার অনুসন্ধানের সাথে কোনো শব্দ মেলেনি। অনুসন্ধান বা বিভাগ পরিবর্তন করে দেখুন।',

    // CardDetailsPopup / CardListItem / CardComparisonTable
    closeCardDetailsAriaLabel: 'কার্ডের বিবরণ বন্ধ করুন',
    prevImageAriaLabel: 'পূর্বের ছবি',
    nextImageAriaLabel: 'পরবর্তী ছবি',
    feesSectionTitle: 'ফি',
    annualFeeWaiverSectionTitle: 'বার্ষিক ফি মওকুফ',
    aprSuffix: '% এপিআর',
    intlSuffix: '(আন্তর্জাতিক)',
    domesticSuffix: '(দেশীয়)',
    cashAdvanceFeeLabel: 'নগদ অগ্রিম ফি',
    latePaymentFeeLabel: 'বিলম্ব পেমেন্ট ফি',
    annualFeeWaiverLabel: 'বার্ষিক ফি মওকুফ',
    featureColumnLabel: 'বৈশিষ্ট্য',
    bankIdLabel: 'ব্যাংক আইডি: {id}',
    unknownBank: 'অজানা ব্যাংক',
    cardsByNetAnnualValue: 'নিট বার্ষিক মূল্য অনুযায়ী কার্ড',

    // Saved service error fallback
    savedErrorFallback: 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  },
};

export function getCommonCopy(lang: Language): CommonCopy {
  return COMMON_COPY[lang];
}
