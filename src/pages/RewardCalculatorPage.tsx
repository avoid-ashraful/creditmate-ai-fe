import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
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

const CATEGORY_LABELS: { key: keyof CategoryAllocation; label: string }[] = [
  { key: 'dining', label: 'Dining' },
  { key: 'travel', label: 'Travel' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'other', label: 'Other' },
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
        <h1>Annual Fee vs Rewards Calculator</h1>
        <p>
          Estimate whether a card&apos;s annual rewards outweigh its annual fee, based on your
          monthly spending pattern.
        </p>
      </section>

      <section className="calculator-form-section" aria-labelledby="spend-form-heading">
        <h2 id="spend-form-heading">Your monthly spend by category</h2>
        <form className="spend-form" onSubmit={handleSubmit} noValidate>
          {CATEGORY_LABELS.map(({ key, label }) => (
            <div className="input-group" key={key}>
              <label htmlFor={`spend-${key}`}>{label} (BDT / month):</label>
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
          ))}

          <p className="total-spend" aria-live="polite">
            Total monthly spend: {formatBdt(totalMonthlySpend)}
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
            Calculate best value cards
          </button>
        </form>

        <div className="assumptions-note">
          <h3>Assumptions</h3>
          <ul>
            <li>
              Reward earn rates are parsed only from each card&apos;s published reward policy text.
              Categories without an explicitly stated boost use the card&apos;s base earn rate.
            </li>
            <li>
              To express rewards in BDT we conservatively assume 1 reward point ={' '}
              {formatBdt(POINT_VALUE_BDT)}. This is an estimate, not a bank-stated value; check each
              bank&apos;s redemption catalogue.
            </li>
            <li>Lounge access, discounts and fee waivers are not monetised.</li>
          </ul>
        </div>
      </section>

      <section className="calculator-results" aria-live="polite">
        {isLoading ? (
          <div className="loading-state">Loading credit cards...</div>
        ) : apiError ? (
          <div className="error-state" role="alert">
            {apiError}
          </div>
        ) : !submitted ? (
          <div className="empty-state">
            <h2>Enter your monthly spend</h2>
            <p>
              Fill in your typical monthly spending above and we will rank the top cards by annual
              rewards minus annual fee.
            </p>
          </div>
        ) : ranked.length === 0 ? (
          <div className="empty-state">
            <h2>No cards to rank</h2>
            <p>No active cards with known fees and parseable reward policies were found.</p>
          </div>
        ) : (
          <>
            <h2>Top {ranked.length} cards by net annual value</h2>
            <ol className="ranked-card-list">
              {ranked.map(({ card, annualRewardValue, netAnnualValue, breakEvenMonthlySpend }) => (
                <li key={card.id} className="ranked-card">
                  <div className="ranked-card-main">
                    <span className="ranked-card-name">{card.name}</span>
                    <span className="ranked-card-bank">
                      {card.bankName ?? 'Data not available'}
                    </span>
                    <dl className="ranked-card-metrics">
                      <div>
                        <dt>Annual fee</dt>
                        <dd>{card.annualFee !== null ? formatBdt(card.annualFee) : 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt>Est. annual rewards</dt>
                        <dd>{formatBdt(annualRewardValue)}</dd>
                      </div>
                      <div>
                        <dt>Net annual value</dt>
                        <dd className={netAnnualValue >= 0 ? 'positive' : 'negative'}>
                          {formatBdt(netAnnualValue)}
                        </dd>
                      </div>
                      <div>
                        <dt>Break-even monthly spend</dt>
                        <dd>
                          {breakEvenMonthlySpend === null
                            ? 'Not computable with current allocation'
                            : formatBdt(breakEvenMonthlySpend)}
                        </dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      className="export-compare-button"
                      onClick={() => handleExportToComparison(card)}
                    >
                      Export to comparison
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
