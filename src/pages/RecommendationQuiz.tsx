import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Toast from '../components/Toast';
import { Badge, Money, MoneyInput, ResultCard } from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { fillCopy, toBanglaNumerals, useLanguage, getCommonCopy } from '../locales';
import { getCardDetailCopy } from '../locales/cardDetail';
import { getQuizCopy } from '../locales/quiz';
import { apiService, BankApiResponse } from '../services/api';
import { fetchAllBanks } from '../services/banks';
import { CreditCard } from '../types';
import { fetchAllPages } from '../utils/fetchAllPages';
import {
  applyQuizConstraints,
  decodeQuizResult,
  emptyQuizAnswersV2,
  encodeQuizResult,
  FEE_TOLERANCE_CAPS,
  INCOME_BAND_CAPS,
  IncomeBand,
  NetworkPreference,
  QuizAnswers,
  QuizAnswersV2,
  quizDiscoveryParams,
  rankCards,
  rankQuizCardsV2,
} from '../utils/quizScoringAlgorithm';
import { resetSeoMeta, setSeoMeta } from '../utils/seo';
import { slugify } from '../utils/slugify';
import '../styles/RecommendationQuiz.css';

/**
 * Perfect-card finder, rebuilt for redesign Phase 2 (plan Section 4.10).
 *
 * First-order CONSTRAINT questions come first (income, Islamic
 * preference, annual fee, network, bank), then preference questions
 * (spend, main use, travel). Nothing is preselected: every answer
 * starts unset and a step cannot be passed until it is answered (or,
 * for pure preference steps, explicitly skipped). Results are the
 * canonical ResultCards with working shortlist actions, and "See all
 * cards" lands on /cards with the answers carried as its filters.
 */

const STEPS = {
  income: 'income',
  islamic: 'islamic',
  fee: 'fee',
  network: 'network',
  bank: 'bank',
  spend: 'spend',
  use: 'use',
  travel: 'travel',
  results: 'results',
} as const;
type StepType = (typeof STEPS)[keyof typeof STEPS];

const QUESTION_STEPS: StepType[] = [
  STEPS.income,
  STEPS.islamic,
  STEPS.fee,
  STEPS.network,
  STEPS.bank,
  STEPS.spend,
  STEPS.use,
  STEPS.travel,
];

const INCOME_BANDS: IncomeBand[] = ['up_to_30k', '30k_50k', '50k_100k', 'above_100k'];
const FEE_TOLERANCES: Array<QuizAnswers['feeTolerance']> = ['none', 'low', 'moderate', 'high'];
const NETWORKS: NetworkPreference[] = ['visa', 'mastercard', 'amex'];
const PRIMARY_USES: Array<QuizAnswers['primaryUse']> = [
  'travel',
  'dining',
  'shopping',
  'cashback',
  'premium',
];
const TRAVEL_FREQUENCIES: Array<QuizAnswers['travelFrequency']> = [
  'frequent',
  'occasional',
  'never',
];

type LoadingState = 'idle' | 'loading' | 'error' | 'empty';

interface RankedResult {
  card: CreditCard;
  score: number;
  reason: string;
}

const RecommendationQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const quiz = getQuizCopy(lang);
  const cardCopy = getCardDetailCopy(lang);
  const shortlist = useShortlist();

  const [currentStep, setCurrentStep] = useState<StepType>(STEPS.income);
  const [answers, setAnswers] = useState<QuizAnswersV2>(emptyQuizAnswersV2());
  // "No preference" is an explicit answer on these steps, distinct from
  // leaving the underlying constraint unset.
  const [networkChoice, setNetworkChoice] = useState<NetworkPreference | 'any' | null>(null);
  const [bankChoice, setBankChoice] = useState<number | 'any' | null>(null);
  const [banks, setBanks] = useState<BankApiResponse[]>([]);
  const [recommendedCards, setRecommendedCards] = useState<RankedResult[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [allCards, setAllCards] = useState<CreditCard[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string>('');

  const setAnswer = <K extends keyof QuizAnswersV2>(key: K, value: QuizAnswersV2[K]) => {
    analytics.track(ANALYTICS_EVENTS.quizStart);
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setSeoMeta({
      title: 'Smart Credit Card Finder Quiz',
      description:
        'Answer a few questions to get personalized credit card recommendations tailored to your spending habits.',
      canonicalPath: '/perfect-card-finder',
    });
    return () => {
      resetSeoMeta();
    };
  }, []);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoadingState('loading');
        const response = await fetchAllPages(page =>
          apiService.getCreditCards({ page_size: 100, isActive: true, ...(page > 1 && { page }) })
        );
        const transformed = response.results.map(card => apiService.transformCreditCard(card));
        if (transformed.length === 0) {
          setLoadingState('empty');
        } else {
          setAllCards(transformed);
          setLoadingState('idle');
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Failed to load cards');
        setLoadingState('error');
      }
    };
    fetchCards();
    fetchAllBanks()
      .then(setBanks)
      .catch(() => setBanks([]));
  }, []);

  // Shared results (links minted by the pre-rebuild quiz and by the
  // share button below) keep working: decode the legacy payload and
  // rank exactly as the legacy quiz did.
  useEffect(() => {
    const quizResultParam = searchParams.get('quiz_result');
    if (quizResultParam && allCards.length > 0) {
      const decoded = decodeQuizResult(quizResultParam);
      if (decoded) {
        const validCardIds = decoded.cardIds.filter(id => allCards.some(card => card.id === id));
        if (validCardIds.length > 0) {
          const results = rankCards(allCards, decoded.answers, 3);
          setAnswers({
            ...emptyQuizAnswersV2(),
            monthlySpend: decoded.answers.monthlySpend,
            primaryUse: decoded.answers.primaryUse,
            travelFrequency: decoded.answers.travelFrequency,
            feeTolerance: decoded.answers.feeTolerance,
          });
          setRecommendedCards(results);
          setMatchCount(
            applyQuizConstraints(allCards, {
              ...emptyQuizAnswersV2(),
              feeTolerance: decoded.answers.feeTolerance,
            }).length
          );
          setCurrentStep(STEPS.results);
          analytics.track(ANALYTICS_EVENTS.quizComplete, { cardIds: validCardIds });
        }
      }
    }
  }, [searchParams, allCards]);

  const isStepAnswered = (step: StepType): boolean => {
    switch (step) {
      case STEPS.income:
        return answers.incomeBand !== null;
      case STEPS.islamic:
        return answers.islamicPreference !== null;
      case STEPS.fee:
        return answers.feeTolerance !== null;
      case STEPS.network:
        return networkChoice !== null;
      case STEPS.bank:
        return bankChoice !== null;
      case STEPS.spend:
        return answers.monthlySpend !== null;
      case STEPS.use:
        return answers.primaryUse !== null;
      case STEPS.travel:
        return answers.travelFrequency !== null;
      default:
        return true;
    }
  };

  const generateResults = (finalAnswers: QuizAnswersV2) => {
    const results = rankQuizCardsV2(allCards, finalAnswers, 3);
    setRecommendedCards(results);
    setMatchCount(applyQuizConstraints(allCards, finalAnswers).length);
    analytics.track(ANALYTICS_EVENTS.quizComplete, {
      cardIds: results.map(result => result.card.id),
    });
  };

  const goToStep = (index: number, finalAnswers: QuizAnswersV2 = answers) => {
    if (index >= QUESTION_STEPS.length) {
      generateResults(finalAnswers);
      setCurrentStep(STEPS.results);
    } else {
      setCurrentStep(QUESTION_STEPS[index]);
    }
  };

  const stepIndex = QUESTION_STEPS.indexOf(currentStep);
  const isLastQuestion = stepIndex === QUESTION_STEPS.length - 1;

  const handleNext = () => {
    if (!isStepAnswered(currentStep)) return;
    goToStep(stepIndex + 1);
  };

  const handleSkip = () => {
    // Preference steps only: skipping leaves the answer unset, so it
    // neither filters nor steers the ranking.
    goToStep(stepIndex + 1);
  };

  const handlePrevious = () => {
    if (currentStep === STEPS.results) {
      setCurrentStep(QUESTION_STEPS[QUESTION_STEPS.length - 1]);
    } else if (stepIndex > 0) {
      setCurrentStep(QUESTION_STEPS[stepIndex - 1]);
    }
  };

  const handleRetake = () => {
    setAnswers(emptyQuizAnswersV2());
    setNetworkChoice(null);
    setBankChoice(null);
    setRecommendedCards([]);
    setMatchCount(0);
    setCurrentStep(STEPS.income);
  };

  const handleSeeAllCards = () => {
    const params = quizDiscoveryParams(answers);
    const query = params.toString();
    navigate(query ? `/cards?${query}` : '/cards');
  };

  const handleShareResult = () => {
    const legacyAnswers: QuizAnswers = {
      monthlySpend: answers.monthlySpend ?? 50000,
      primaryUse: answers.primaryUse ?? 'shopping',
      travelFrequency: answers.travelFrequency ?? 'occasional',
      feeTolerance: answers.feeTolerance ?? 'high',
      cardTier: 'standard',
    };
    const encoded = encodeQuizResult({
      cardIds: recommendedCards.map(result => result.card.id),
      answers: legacyAnswers,
    });
    analytics.track(ANALYTICS_EVENTS.compareShare, {
      cardIds: recommendedCards.map(result => result.card.id),
    });
    const shareUrl = `${window.location.origin}/perfect-card-finder?quiz_result=${encoded}`;
    const copyPromise = navigator.clipboard?.writeText(shareUrl);
    if (copyPromise && typeof copyPromise.then === 'function') {
      copyPromise
        .then(() => setShareMessage(common.quizShareSuccess))
        .catch(() => setShareMessage(common.quizShareError));
    } else {
      setShareMessage(common.quizShareSuccess);
    }
  };

  const progressSteps = [
    quiz.stepIncome,
    quiz.stepIslamic,
    common.quizStepFee,
    quiz.stepNetwork,
    quiz.stepBank,
    quiz.stepSpend,
    common.quizStepUse,
    common.quizStepTravel,
  ];
  const progress = ((stepIndex + 1) / progressSteps.length) * 100;

  const formatBdt = (value: number): string => {
    const text = Math.round(value).toLocaleString('en-US');
    return lang === 'bn' ? toBanglaNumerals(text) : text;
  };

  const appliedChips = useMemo(() => {
    const chips: string[] = [];
    if (answers.incomeBand && Number.isFinite(INCOME_BAND_CAPS[answers.incomeBand])) {
      chips.push(
        fillCopy(quiz.chipIncome, { cap: formatBdt(INCOME_BAND_CAPS[answers.incomeBand]) })
      );
    }
    if (answers.islamicPreference === 'islamic_only') chips.push(quiz.chipIslamicOnly);
    if (answers.feeTolerance === 'none') chips.push(quiz.chipFeeNone);
    else if (answers.feeTolerance === 'low' || answers.feeTolerance === 'moderate') {
      chips.push(
        fillCopy(quiz.chipFeeUpTo, { cap: formatBdt(FEE_TOLERANCE_CAPS[answers.feeTolerance]) })
      );
    }
    if (answers.network) {
      chips.push(
        fillCopy(quiz.chipNetwork, {
          network: quiz.networkOptions[NETWORKS.indexOf(answers.network)],
        })
      );
    }
    if (answers.bankId !== null) {
      const bank = banks.find(candidate => candidate.id === answers.bankId);
      if (bank) chips.push(fillCopy(quiz.chipBank, { bank: bank.name }));
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, banks, lang]);

  if (loadingState === 'loading' && currentStep !== STEPS.results) {
    return (
      <div className="recommendation-quiz-page">
        <div className="quiz-container">
          <div className="quiz-header">
            <h1>{common.quizTitle}</h1>
          </div>
          <div className="quiz-step" role="status" aria-live="polite">
            <p>{common.quizLoadingCards}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="recommendation-quiz-page">
        <div className="quiz-container">
          <div className="quiz-header">
            <h1>{common.quizTitle}</h1>
          </div>
          <div className="quiz-step" role="alert">
            <p>{common.quizErrorLoading}</p>
            {apiError && <p>{apiError}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (loadingState === 'empty') {
    return (
      <div className="recommendation-quiz-page">
        <div className="quiz-container">
          <div className="quiz-header">
            <h1>{common.quizTitle}</h1>
          </div>
          <div className="quiz-step" role="status">
            <p>{common.quizEmptyCards}</p>
          </div>
        </div>
      </div>
    );
  }

  const optionButton = (
    label: string,
    selected: boolean,
    onSelect: () => void,
    key?: string
  ): React.ReactNode => (
    <button
      key={key ?? label}
      type="button"
      onClick={onSelect}
      className={`option-btn ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );

  return (
    <div className="recommendation-quiz-page">
      {currentStep !== STEPS.results && (
        <div className="quiz-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-label">
            {common.quizProgressLabel
              .replace('{current}', String(stepIndex + 1))
              .replace('{total}', String(progressSteps.length))}
          </div>
        </div>
      )}

      <div className="quiz-container">
        <div className="quiz-header">
          <h1>{common.quizTitle}</h1>
          {currentStep !== STEPS.results && <p>{common.quizSubtitle}</p>}
        </div>

        {currentStep === STEPS.income && (
          <div className="quiz-step" role="region" aria-live="polite" aria-label={quiz.stepIncome}>
            <h2>{quiz.incomeLabel}</h2>
            <div className="step-content options-grid">
              {INCOME_BANDS.map((band, idx) =>
                optionButton(
                  quiz.incomeOptions[idx],
                  answers.incomeBand === band,
                  () => setAnswer('incomeBand', band),
                  band
                )
              )}
            </div>
          </div>
        )}

        {currentStep === STEPS.islamic && (
          <div className="quiz-step" role="region" aria-live="polite" aria-label={quiz.stepIslamic}>
            <h2>{quiz.islamicLabel}</h2>
            <div className="step-content options-grid">
              {optionButton(quiz.islamicOptions[0], answers.islamicPreference === 'any', () =>
                setAnswer('islamicPreference', 'any')
              )}
              {optionButton(
                quiz.islamicOptions[1],
                answers.islamicPreference === 'islamic_only',
                () => setAnswer('islamicPreference', 'islamic_only')
              )}
            </div>
          </div>
        )}

        {currentStep === STEPS.fee && (
          <div
            className="quiz-step"
            role="region"
            aria-live="polite"
            aria-label={common.quizStepFee}
          >
            <h2>{common.quizFeeToleranceLabel}</h2>
            <div className="step-content options-grid">
              {FEE_TOLERANCES.map((tolerance, idx) =>
                optionButton(
                  common.quizFeeToleranceOptions[idx],
                  answers.feeTolerance === tolerance,
                  () => setAnswer('feeTolerance', tolerance),
                  tolerance
                )
              )}
            </div>
          </div>
        )}

        {currentStep === STEPS.network && (
          <div className="quiz-step" role="region" aria-live="polite" aria-label={quiz.stepNetwork}>
            <h2>{quiz.networkLabel}</h2>
            <div className="step-content options-grid">
              {NETWORKS.map((network, idx) =>
                optionButton(
                  quiz.networkOptions[idx],
                  networkChoice === network,
                  () => {
                    setNetworkChoice(network);
                    setAnswer('network', network);
                  },
                  network
                )
              )}
              {optionButton(quiz.noPreference, networkChoice === 'any', () => {
                setNetworkChoice('any');
                setAnswer('network', null);
              })}
            </div>
          </div>
        )}

        {currentStep === STEPS.bank && (
          <div className="quiz-step" role="region" aria-live="polite" aria-label={quiz.stepBank}>
            <h2>{quiz.bankLabel}</h2>
            <div className="step-content options-grid">
              {optionButton(quiz.anyBank, bankChoice === 'any', () => {
                setBankChoice('any');
                setAnswer('bankId', null);
              })}
              {banks.map(bank =>
                optionButton(
                  bank.name,
                  bankChoice === bank.id,
                  () => {
                    setBankChoice(bank.id);
                    setAnswer('bankId', bank.id);
                  },
                  `bank-${bank.id}`
                )
              )}
            </div>
          </div>
        )}

        {currentStep === STEPS.spend && (
          <div className="quiz-step" role="region" aria-live="polite" aria-label={quiz.stepSpend}>
            <h2>{quiz.spendLabel}</h2>
            <div className="step-content">
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={answers.monthlySpend ?? 10000}
                onChange={event => setAnswer('monthlySpend', Number(event.target.value))}
                aria-label={quiz.spendLabel}
                className="spend-slider"
              />
              <MoneyInput
                label={quiz.stepSpend}
                placeholder={quiz.spendPlaceholder}
                value={answers.monthlySpend}
                onValueChange={value => setAnswer('monthlySpend', value)}
              />
              <div className="spend-presets">
                {[20000, 50000, 100000, 200000].map(amount =>
                  optionButton(
                    `${common.quizMonthlySpendValue}${formatBdt(amount)}`,
                    answers.monthlySpend === amount,
                    () => setAnswer('monthlySpend', amount),
                    `preset-${amount}`
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === STEPS.use && (
          <div
            className="quiz-step"
            role="region"
            aria-live="polite"
            aria-label={common.quizStepUse}
          >
            <h2>{common.quizPrimaryUseLabel}</h2>
            <div className="step-content options-grid">
              {PRIMARY_USES.map((use, idx) =>
                optionButton(
                  common.quizPrimaryUseOptions[idx],
                  answers.primaryUse === use,
                  () => setAnswer('primaryUse', use),
                  use
                )
              )}
            </div>
          </div>
        )}

        {currentStep === STEPS.travel && (
          <div
            className="quiz-step"
            role="region"
            aria-live="polite"
            aria-label={common.quizStepTravel}
          >
            <h2>{common.quizTravelFrequencyLabel}</h2>
            <div className="step-content options-grid">
              {TRAVEL_FREQUENCIES.map((frequency, idx) =>
                optionButton(
                  common.quizTravelFrequencyOptions[idx],
                  answers.travelFrequency === frequency,
                  () => setAnswer('travelFrequency', frequency),
                  frequency
                )
              )}
            </div>
          </div>
        )}

        {currentStep === STEPS.results && (
          <div
            className="quiz-step results-step"
            role="region"
            aria-live="polite"
            aria-label={common.quizStepResults}
          >
            <h2>{common.quizResultsTitle}</h2>
            <p>{fillCopy(quiz.resultsCount, { count: String(matchCount) })}</p>
            {appliedChips.length > 0 && (
              <div className="quiz-applied-filters">
                <span>{quiz.appliedFiltersLabel}:</span>
                {appliedChips.map(chip => (
                  <Badge key={chip}>{chip}</Badge>
                ))}
              </div>
            )}
            {recommendedCards.length === 0 ? (
              <div className="quiz-no-matches">
                <p>{quiz.noMatches}</p>
                <p>{quiz.noMatchesNote}</p>
              </div>
            ) : (
              <div className="results-container">
                <div className="recommended-cards">
                  {recommendedCards.map(({ card, score, reason }, idx) => (
                    <div key={card.id} className="result-card">
                      <ResultCard
                        bankName={card.bankName ?? ''}
                        productName={card.name}
                        detailHref={`/card/${slugify(card.bankName ?? '')}/${slugify(card.name)}`}
                        heroValue={<Money value={card.annualFee} />}
                        heroLabel={cardCopy.annualFee}
                        supportingFacts={[
                          {
                            label: common.quizResultScore.replace(' {score}', ''),
                            value: lang === 'bn' ? toBanglaNumerals(score) : String(score),
                          },
                          {
                            label: cardCopy.specApr,
                            value: card.interestRateApr != null ? `${card.interestRateApr}%` : '—',
                          },
                        ]}
                        badges={
                          <Badge variant="primary">{`${common.quizResultRank}${idx + 1}`}</Badge>
                        }
                        islamic={card.isIslamic}
                        inShortlist={shortlist.isInShortlist('cards', String(card.id))}
                        onToggleShortlist={() =>
                          shortlist.toggle({
                            vertical: 'cards',
                            key: String(card.id),
                            cardId: card.id,
                            name: card.name,
                            bankName: card.bankName ?? '',
                            detailHref: `/card/${slugify(card.bankName ?? '')}/${slugify(
                              card.name
                            )}`,
                          })
                        }
                        defaultExpanded
                      >
                        <p className="result-reason">
                          <strong>{common.quizResultReason}</strong> {reason}
                        </p>
                      </ResultCard>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="results-actions">
              <button
                onClick={handleShareResult}
                className="action-btn share-btn"
                title="Copy shareable link to clipboard"
              >
                {common.quizShareButton}
              </button>
              <Toast className="share-message" message={shareMessage} />
              <button
                onClick={handleSeeAllCards}
                className="action-btn see-all-btn"
                title="Browse all credit cards"
              >
                {common.quizSeeAllButton}
              </button>
              <button
                onClick={handleRetake}
                className="action-btn retake-btn"
                title="Start the quiz over"
              >
                {common.quizRetakeButton}
              </button>
            </div>
          </div>
        )}

        {currentStep !== STEPS.results && (
          <div className="quiz-navigation">
            <button
              onClick={handlePrevious}
              disabled={stepIndex === 0}
              className="nav-btn prev-btn"
              aria-label={`${common.quizNavBack}: ${
                lang === 'bn' ? 'আগের ধাপে যান' : 'Go to previous step'
              }`}
            >
              {common.quizNavBack}
            </button>
            {(currentStep === STEPS.spend ||
              currentStep === STEPS.use ||
              currentStep === STEPS.travel) && (
              <button onClick={handleSkip} className="nav-btn skip-btn">
                {quiz.skipButton}
              </button>
            )}
            <button
              onClick={handleNext}
              className="nav-btn next-btn"
              disabled={!isStepAnswered(currentStep)}
              aria-label={`${isLastQuestion ? common.quizNavSeeResults : common.quizNavNext}: ${
                lang === 'bn' ? 'পরের ধাপ বা ফলাফল দেখুন' : 'Go to next step or see results'
              }`}
            >
              {isLastQuestion ? common.quizNavSeeResults : common.quizNavNext}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationQuiz;
