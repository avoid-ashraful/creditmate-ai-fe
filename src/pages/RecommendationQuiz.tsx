import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import CardListItem from '../components/CardListItem';
import ComparisonBar from '../components/ComparisonBar';
import Toast from '../components/Toast';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { fillCopy, toBanglaNumerals, useLanguage, getCommonCopy } from '../locales';
import { apiService } from '../services/api';
import { CreditCard } from '../types';
import { fetchAllPages } from '../utils/fetchAllPages';
import { rankCards, encodeQuizResult, decodeQuizResult } from '../utils/quizScoringAlgorithm';
import { resetSeoMeta, setSeoMeta } from '../utils/seo';
import '../styles/RecommendationQuiz.css';

const STEPS = {
  spend: 'spend',
  use: 'use',
  travel: 'travel',
  fee: 'fee',
  tier: 'tier',
  results: 'results',
} as const;
type StepType = (typeof STEPS)[keyof typeof STEPS];

interface QuizState {
  monthlySpend: number;
  primaryUse: 'travel' | 'dining' | 'shopping' | 'cashback' | 'premium';
  travelFrequency: 'frequent' | 'occasional' | 'never';
  feeTolerance: 'none' | 'low' | 'moderate' | 'high';
  cardTier: 'basic' | 'standard' | 'premium';
}

type LoadingState = 'idle' | 'loading' | 'error' | 'empty';

const RecommendationQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const [currentStep, setCurrentStep] = useState<StepType>('spend');
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    monthlySpend: 50000,
    primaryUse: 'shopping',
    travelFrequency: 'occasional',
    feeTolerance: 'moderate',
    cardTier: 'standard',
  });
  const [recommendedCards, setRecommendedCards] = useState<
    Array<{ card: CreditCard; score: number; reason: string }>
  >([]);
  const [allCards, setAllCards] = useState<CreditCard[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string>('');

  useEffect(() => {
    setSeoMeta({
      title: 'Smart Credit Card Finder Quiz',
      description:
        'Answer 5 quick questions to get personalized credit card recommendations tailored to your spending habits.',
      canonicalPath: '/perfect-card-finder',
    });
    return () => {
      resetSeoMeta();
    };
  }, []);

  // Fetch all active credit cards on mount
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
  }, []);

  // Load shared result if query param present and cards loaded
  useEffect(() => {
    const quizResultParam = searchParams.get('quiz_result');
    if (quizResultParam && allCards.length > 0) {
      const decoded = decodeQuizResult(quizResultParam);
      if (decoded) {
        // Validate that all card IDs exist in fetched cards
        const validCardIds = decoded.cardIds.filter(id => allCards.some(card => card.id === id));

        if (validCardIds.length > 0) {
          // Recompute against fresh API data
          const results = rankCards(allCards, decoded.answers, 3);
          setQuizState(decoded.answers);
          setRecommendedCards(results);
          setSelectedCardIds(results.map(r => r.card.id));
          setCurrentStep(STEPS.results);
          analytics.track(ANALYTICS_EVENTS.quizComplete, {
            cardIds: validCardIds,
          });
        }
      }
    }
  }, [searchParams, allCards]);

  const handleSpendChange = (spend: number) => {
    analytics.track(ANALYTICS_EVENTS.quizStart);
    setQuizState(prev => ({ ...prev, monthlySpend: spend }));
  };

  const handlePrimaryUseChange = (use: QuizState['primaryUse']) => {
    analytics.track(ANALYTICS_EVENTS.quizStart);
    setQuizState(prev => ({ ...prev, primaryUse: use }));
  };

  const handleTravelFrequencyChange = (freq: QuizState['travelFrequency']) => {
    analytics.track(ANALYTICS_EVENTS.quizStart);
    setQuizState(prev => ({ ...prev, travelFrequency: freq }));
  };

  const handleFeeToleranceChange = (tolerance: QuizState['feeTolerance']) => {
    analytics.track(ANALYTICS_EVENTS.quizStart);
    setQuizState(prev => ({ ...prev, feeTolerance: tolerance }));
  };

  const handleCardTierChange = (tier: QuizState['cardTier']) => {
    analytics.track(ANALYTICS_EVENTS.quizStart);
    setQuizState(prev => ({ ...prev, cardTier: tier }));
  };

  const handleNext = () => {
    const steps: StepType[] = [
      STEPS.spend,
      STEPS.use,
      STEPS.travel,
      STEPS.fee,
      STEPS.tier,
      STEPS.results,
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      if (currentStep === STEPS.spend) {
        analytics.track(ANALYTICS_EVENTS.quizStart);
      }
      setCurrentStep(nextStep);

      if (nextStep === STEPS.results) {
        generateResults();
      }
    }
  };

  const generateResults = () => {
    const results = rankCards(
      allCards,
      {
        monthlySpend: quizState.monthlySpend,
        primaryUse: quizState.primaryUse,
        travelFrequency: quizState.travelFrequency,
        feeTolerance: quizState.feeTolerance,
        cardTier: quizState.cardTier,
      },
      3
    );
    setRecommendedCards(results);
    setSelectedCardIds(results.map(r => r.card.id));
    analytics.track(ANALYTICS_EVENTS.quizComplete, {
      cardIds: results.map(result => result.card.id),
    });
  };

  const handlePrevious = () => {
    const steps: StepType[] = [
      STEPS.spend,
      STEPS.use,
      STEPS.travel,
      STEPS.fee,
      STEPS.tier,
      STEPS.results,
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleRetake = () => {
    setCurrentStep(STEPS.spend);
    setRecommendedCards([]);
    setSelectedCardIds([]);
  };

  const handleSeeAllCards = () => {
    navigate('/');
  };

  const handleShareResult = () => {
    const result = {
      cardIds: selectedCardIds,
      answers: {
        monthlySpend: quizState.monthlySpend,
        primaryUse: quizState.primaryUse,
        travelFrequency: quizState.travelFrequency,
        feeTolerance: quizState.feeTolerance,
        cardTier: quizState.cardTier,
      },
    };
    const encoded = encodeQuizResult(result);
    analytics.track(ANALYTICS_EVENTS.compareShare, {
      cardIds: selectedCardIds,
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
    common.quizStepSpend,
    common.quizStepUse,
    common.quizStepTravel,
    common.quizStepFee,
    common.quizStepTier,
  ];
  const allSteps = [STEPS.spend, STEPS.use, STEPS.travel, STEPS.fee, STEPS.tier] as const;
  const stepIndex = allSteps.indexOf(currentStep as (typeof allSteps)[number]);
  const progress = ((stepIndex + 1) / progressSteps.length) * 100;

  // Show loading state for quiz steps if cards still loading
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

  return (
    <div className="recommendation-quiz-page">
      {currentStep !== 'results' && (
        <div className="quiz-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-label">
            {common.quizProgressLabel} {stepIndex + 1} of {progressSteps.length}
          </div>
        </div>
      )}

      <div className="quiz-container">
        <div className="quiz-header">
          <h1>{common.quizTitle}</h1>
          {currentStep !== STEPS.results && <p>{common.quizSubtitle}</p>}
        </div>

        {currentStep === STEPS.spend && (
          <div
            className="quiz-step"
            role="region"
            aria-live="polite"
            aria-label={common.quizStepSpend}
          >
            <h2>{common.quizMonthlySpendLabel}</h2>
            <div className="step-content">
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={quizState.monthlySpend}
                onChange={e => handleSpendChange(Number(e.target.value))}
                aria-label="Monthly spending amount"
                className="spend-slider"
              />
              <div className="spend-display">
                <span className="spend-value">
                  {common.quizMonthlySpendValue}
                  {(quizState.monthlySpend / 1000).toFixed(0)}k
                </span>
                <span className="spend-label">{common.quizMonthlySpendPerMonth}</span>
              </div>
              <div className="spend-presets">
                {[20000, 50000, 100000, 200000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleSpendChange(amount)}
                    className={`preset-btn ${quizState.monthlySpend === amount ? 'active' : ''}`}
                    aria-pressed={quizState.monthlySpend === amount}
                  >
                    {common.quizMonthlySpendValue}
                    {(amount / 1000).toFixed(0)}k
                  </button>
                ))}
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
              {common.quizPrimaryUseOptions.map((use, idx) => (
                <button
                  key={use}
                  onClick={() =>
                    handlePrimaryUseChange(
                      ['travel', 'dining', 'shopping', 'cashback', 'premium'][
                        idx
                      ] as QuizState['primaryUse']
                    )
                  }
                  className={`option-btn ${
                    quizState.primaryUse ===
                    ['travel', 'dining', 'shopping', 'cashback', 'premium'][idx]
                      ? 'selected'
                      : ''
                  }`}
                  aria-pressed={
                    quizState.primaryUse ===
                    ['travel', 'dining', 'shopping', 'cashback', 'premium'][idx]
                  }
                >
                  {use}
                </button>
              ))}
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
              {common.quizTravelFrequencyOptions.map((freq, idx) => (
                <button
                  key={freq}
                  onClick={() =>
                    handleTravelFrequencyChange(
                      ['frequent', 'occasional', 'never'][idx] as QuizState['travelFrequency']
                    )
                  }
                  className={`option-btn ${
                    quizState.travelFrequency === ['frequent', 'occasional', 'never'][idx]
                      ? 'selected'
                      : ''
                  }`}
                  aria-pressed={
                    quizState.travelFrequency === ['frequent', 'occasional', 'never'][idx]
                  }
                >
                  {freq}
                </button>
              ))}
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
              {common.quizFeeToleranceOptions.map((tolerance, idx) => (
                <button
                  key={tolerance}
                  onClick={() =>
                    handleFeeToleranceChange(
                      ['none', 'low', 'moderate', 'high'][idx] as QuizState['feeTolerance']
                    )
                  }
                  className={`option-btn ${
                    quizState.feeTolerance === ['none', 'low', 'moderate', 'high'][idx]
                      ? 'selected'
                      : ''
                  }`}
                  aria-pressed={quizState.feeTolerance === ['none', 'low', 'moderate', 'high'][idx]}
                >
                  {tolerance}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === STEPS.tier && (
          <div
            className="quiz-step"
            role="region"
            aria-live="polite"
            aria-label={common.quizStepTier}
          >
            <h2>{common.quizCardTierLabel}</h2>
            <div className="step-content options-grid">
              {common.quizCardTierOptions.map((tier, idx) => (
                <button
                  key={tier}
                  onClick={() =>
                    handleCardTierChange(
                      ['basic', 'standard', 'premium'][idx] as QuizState['cardTier']
                    )
                  }
                  className={`option-btn ${
                    quizState.cardTier === ['basic', 'standard', 'premium'][idx] ? 'selected' : ''
                  }`}
                  aria-pressed={quizState.cardTier === ['basic', 'standard', 'premium'][idx]}
                >
                  {tier}
                </button>
              ))}
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
            <div className="results-container">
              <div className="recommended-cards">
                {recommendedCards.map(({ card, score, reason }, idx) => (
                  <div key={card.id} className="result-card">
                    <div className="result-rank">
                      {common.quizResultRank}
                      {idx + 1}
                    </div>
                    <div className="result-score">
                      {fillCopy(common.quizResultScore, {
                        score: lang === 'bn' ? toBanglaNumerals(score) : score,
                      })}
                    </div>
                    <CardListItem card={card} isSelected={false} onSelect={() => undefined} />
                    <div className="result-reason">
                      <strong>{common.quizResultReason}</strong> {reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              aria-label="Go to previous step"
            >
              {common.quizNavBack}
            </button>
            <button
              onClick={handleNext}
              className="nav-btn next-btn"
              aria-label="Go to next step or see results"
            >
              {stepIndex === 4 ? common.quizNavSeeResults : common.quizNavNext}
            </button>
          </div>
        )}

        {currentStep === STEPS.results && selectedCardIds.length > 0 && (
          <ComparisonBar
            selectedCards={allCards.filter(card => selectedCardIds.includes(card.id))}
            onRemoveCard={() => undefined}
            maxSelections={4}
          />
        )}
      </div>
    </div>
  );
};

export default RecommendationQuiz;
