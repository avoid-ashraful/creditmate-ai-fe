import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { useLanguage, getCommonCopy } from '../locales';
import { apiService } from '../services/api';
import { CreditCard } from '../types';
import {
  CategoryAllocation,
  POINT_VALUE_BDT,
  rankCards,
  RankedCard,
  validateAllocation,
} from '../utils/rewardCalculator';

import './RewardCalculatorPage.css';

const CATEGORY_LABELS: Array<{ key: keyof CategoryAllocation; labelKey: string }> = [
  { key: 'dining', labelKey: 'calcCategoryDining' },
  { key: 'travel', labelKey: 'calcCategoryTravel' },
  { key: 'groceries', labelKey: 'calcCategoryGroceries' },
  { key: 'fuel', labelKey: 'calcCategoryFuel' },
  { key: 'other', labelKey: 'calcCategoryOther' },
];

const EMPTY_ALLOCATION: CategoryAllocation = {
  dining: 0,
  travel: 0,
  groceries: 0,
  fuel: 0,
  other: 0,
};

const formatBdt = (value: number): string => `BDT ${Math.round(value).toLocaleString()}`;

const RewardCalculatorPage: React.FC = () => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  useSeoMeta({
    title: 'Annual fee vs rewards calculator | CreditMate AI',
    description:
      'Enter your monthly spend by category to see which credit cards in our data give the best net annual value after their annual fee.',
    canonicalPath: '/reward-calculator',
  });

  const navigate = useNavigate();

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [allocation, setAllocation] = useState<CategoryAllocation>(EMPTY_ALLOCATION);
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryAllocation | 'form', string>>>(
    {}
  );
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [ranked, setRanked] = useState<RankedCard[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchCards = async (): Promise<void> => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await apiService.getCreditCards({ page_size: 100 });
        if (cancelled) return;
        setCards(response.results.map(card => apiService.transformCreditCard(card)));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to fetch credit cards:', error);
        setApiError('Failed to load credit cards. Please try again later.');
        setCards([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCards();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAmountChange =
    (key: keyof CategoryAllocation) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const value = raw === '' ? 0 : Number(raw);
      setAllocation(prev => ({ ...prev, [key]: value }));
      if (submitted) {
        setSubmitted(false);
        setErrors({});
      }
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateAllocation(allocation);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitted(false);
      setRanked([]);
      return;
    }

    setSubmitted(true);
    const rankedCards = rankCards(cards, allocation, 5);
    setRanked(rankedCards);
    analytics.track(ANALYTICS_EVENTS.calculatorUse);
  };

  const handleExportToComparison = (card: CreditCard) => {
    analytics.track(ANALYTICS_EVENTS.cardSelect, {
      cardId: card.id,
    });
    // Reuse the app's existing compare mechanism: the comparison page reads
    // selected card ids from the `ids` query parameter (same as ComparisonBar).
    navigate(`/compare?ids=${card.id}`);
  };

  const totalMonthlySpend =
    allocation.dining +
    allocation.travel +
    allocation.groceries +
    allocation.fuel +
    allocation.other;

  return (
    <div className="reward-calculator-page">
      <section className="calculator-hero">
        <h1>{common.calcTitle}</h1>
        <p>{common.calcSubtitle}</p>
      </section>

      <section className="calculator-form-section" aria-labelledby="spend-form-heading">
        <h2 id="spend-form-heading">{common.calcFormTitle}</h2>
        <form className="spend-form" onSubmit={handleSubmit} noValidate>
          {CATEGORY_LABELS.map(({ key, labelKey }) => {
            return (
              <div className="input-group" key={key}>
                <label htmlFor={`spend-${key}`}>
                  {common[labelKey as keyof typeof common]} (BDT / month):
                </label>
                <input
                  type="number"
                  id={`spend-${key}`}
                  name={key}
                  min="0"
                  step="any"
                  value={allocation[key] || ''}
                  onChange={handleAmountChange(key)}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `spend-${key}-error` : undefined}
                />
                {errors[key] && (
                  <p className="field-error" id={`spend-${key}-error`} role="alert">
                    {errors[key]}
                  </p>
                )}
              </div>
            );
          })}

          <p className="total-spend" aria-live="polite">
            {common.calcTotalSpend} {formatBdt(totalMonthlySpend)}
          </p>

          {errors.form && (
            <p className="field-error" role="alert">
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            className="calculate-button"
            disabled={isLoading || Boolean(apiError)}
          >
            {common.calcCalculateButton}
          </button>
        </form>

        <div className="assumptions-note">
          <h3>{common.calcAssumptionsTitle}</h3>
          <ul>
            <li>{common.calcAssumption1}</li>
            <li>{common.calcAssumption2.replace('BDT 1', formatBdt(POINT_VALUE_BDT))}</li>
            <li>{common.calcAssumption3}</li>
          </ul>
        </div>
      </section>

      <section className="calculator-results" aria-live="polite">
        {isLoading ? (
          <div className="loading-state">{common.calcLoading}</div>
        ) : apiError ? (
          <div className="error-state" role="alert">
            {apiError}
          </div>
        ) : !submitted ? (
          <div className="empty-state">
            <h2>{common.calcEmptyTitle}</h2>
            <p>{common.calcEmptyDesc}</p>
          </div>
        ) : ranked.length === 0 ? (
          <div className="empty-state">
            <h2>{common.calcErrorTitle}</h2>
            <p>{common.calcErrorDesc}</p>
          </div>
        ) : (
          <>
            <h2>
              {common.calcResultsTitle} {ranked.length} {common.cardsByNetAnnualValue}
            </h2>
            <ol className="ranked-card-list">
              {ranked.map(({ card, annualRewardValue, netAnnualValue, breakEvenMonthlySpend }) => (
                <li key={card.id} className="ranked-card">
                  <div className="ranked-card-main">
                    <span className="ranked-card-name">{card.name}</span>
                    <span className="ranked-card-bank">{card.bankName ?? common.unknown}</span>
                    <dl className="ranked-card-metrics">
                      <div>
                        <dt>{common.calcResultAnnualFee}</dt>
                        <dd>
                          {card.annualFee !== null ? formatBdt(card.annualFee) : common.unknown}
                        </dd>
                      </div>
                      <div>
                        <dt>{common.calcResultEstRewards}</dt>
                        <dd>{formatBdt(annualRewardValue)}</dd>
                      </div>
                      <div>
                        <dt>{common.calcResultNetValue}</dt>
                        <dd className={netAnnualValue >= 0 ? 'positive' : 'negative'}>
                          {formatBdt(netAnnualValue)}
                        </dd>
                      </div>
                      <div>
                        <dt>{common.calcResultBreakEven}</dt>
                        <dd>
                          {breakEvenMonthlySpend === null
                            ? common.calcResultBreakEvenUnknown
                            : formatBdt(breakEvenMonthlySpend)}
                        </dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      className="export-compare-button"
                      onClick={() => handleExportToComparison(card)}
                    >
                      {common.calcExportCompare}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
};

export default RewardCalculatorPage;
