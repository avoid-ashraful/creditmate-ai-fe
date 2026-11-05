import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import SaveScenarioButton from '../components/SaveScenarioButton';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { useLanguage, getCommonCopy, fillCopy } from '../locales';
import { apiService } from '../services/api';
import { CreditCard, RewardCategory } from '../types';
import { fetchAllPages } from '../utils/fetchAllPages';
import {
  AppliedRule,
  CategoryAllocation,
  MAX_AVERAGE_REVOLVING_BALANCE,
  rankCards,
  RankedCard,
  validateAllocation,
  validateAverageRevolvingBalance,
} from '../utils/rewardCalculator';

import './RewardCalculatorPage.css';

const CATEGORY_LABELS: Array<{ key: keyof CategoryAllocation; labelKey: string }> = [
  { key: 'dining', labelKey: 'calcCategoryDining' },
  { key: 'travel', labelKey: 'calcCategoryTravel' },
  { key: 'groceries', labelKey: 'calcCategoryGroceries' },
  { key: 'fuel', labelKey: 'calcCategoryFuel' },
  { key: 'other', labelKey: 'calcCategoryOther' },
];

/** Which common-copy key provides the display label for a rule category. */
const RULE_CATEGORY_LABELS: Record<RewardCategory, string> = {
  all: 'calcCategoryAll',
  dining: 'calcCategoryDining',
  travel: 'calcCategoryTravel',
  groceries: 'calcCategoryGroceries',
  fuel: 'calcCategoryFuel',
  online: 'calcCategoryOnline',
  international: 'calcCategoryInternational',
  other: 'calcCategoryOther',
};

const EMPTY_ALLOCATION: CategoryAllocation = {
  dining: 0,
  travel: 0,
  groceries: 0,
  fuel: 0,
  other: 0,
};

const formatBdt = (value: number): string => `BDT ${Math.round(value).toLocaleString()}`;

/** Human label for a reward-terms source link: the host, or the raw URL when unparsable. */
const rewardSourceLabel = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/**
 * Collapse the per-input-category applied-rule list into distinct rules: a
 * single "all spending" rule applied to five categories is one rule, not five.
 */
const dedupeAppliedRules = (rules: AppliedRule[]): AppliedRule[] => {
  const seen = new Set<string>();
  const unique: AppliedRule[] = [];
  rules.forEach(rule => {
    const key =
      rule.kind === 'earn' && rule.earn
        ? `earn:${rule.ruleCategory}:${rule.earn.pointsPerUnit}:${rule.earn.spendUnitBdt}`
        : rule.kind === 'cashback' && rule.cashback
        ? `cash:${rule.ruleCategory}:${rule.cashback.percent}:${rule.cashback.capText ?? ''}`
        : `${rule.kind}:${rule.ruleCategory}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(rule);
  });
  return unique;
};

const RewardCalculatorPage: React.FC<{ planEmbedded?: boolean }> = ({ planEmbedded = false }) => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  useSeoMeta({
    title: 'Annual fee vs rewards calculator | CreditMate AI',
    description:
      'Enter your monthly spend by category to see which credit cards in our data give the best net annual value after their annual fee.',
    canonicalPath: planEmbedded ? '/plan/rewards' : '/reward-calculator',
  });

  const navigate = useNavigate();

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Plan mode: the spend allocation lives in the URL (plan Section 4.8),
  // so a saved scenario reopens with the same numbers.
  const [allocation, setAllocation] = useState<CategoryAllocation>(() => {
    if (!planEmbedded) return EMPTY_ALLOCATION;
    const fromUrl = { ...EMPTY_ALLOCATION };
    (Object.keys(EMPTY_ALLOCATION) as Array<keyof CategoryAllocation>).forEach(key => {
      const raw = searchParams.get(key);
      const parsed = raw === null ? NaN : Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) fromUrl[key] = parsed;
    });
    return fromUrl;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryAllocation | 'form', string>>>(
    {}
  );
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [ranked, setRanked] = useState<RankedCard[]>([]);
  const [averageRevolvingBalance, setAverageRevolvingBalance] = useState<number>(() => {
    if (!planEmbedded) return 0;
    const parsed = Number(searchParams.get('revolving_balance'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  });
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Mirror the allocation into the URL in Plan mode (debounced so typing
  // does not thrash the history stack; replace, never push).
  useEffect(() => {
    if (!planEmbedded) return;
    const timer = setTimeout(() => {
      setSearchParams(
        previous => {
          const params = new URLSearchParams(previous);
          (Object.keys(EMPTY_ALLOCATION) as Array<keyof CategoryAllocation>).forEach(key => {
            if (allocation[key] > 0) params.set(key, String(allocation[key]));
            else params.delete(key);
          });
          if (averageRevolvingBalance > 0) {
            params.set('revolving_balance', String(averageRevolvingBalance));
          } else {
            params.delete('revolving_balance');
          }
          return params;
        },
        { replace: true }
      );
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planEmbedded, allocation, averageRevolvingBalance]);

  useEffect(() => {
    let cancelled = false;

    const fetchCards = async (): Promise<void> => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await fetchAllPages(page =>
          apiService.getCreditCards({ page_size: 100, ...(page > 1 && { page }) })
        );
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
      } else if (value < 0) {
        // Show field error immediately for negative values
        setErrors(prev => ({ ...prev, [key]: 'Enter a non-negative amount' }));
      } else if (errors[key]) {
        // Clear field error when value becomes valid
        setErrors(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

  const handleBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const value = raw === '' ? 0 : Number(raw);
    setAverageRevolvingBalance(value);
    if (submitted) {
      setSubmitted(false);
      setRanked([]);
    }
    setBalanceError(validateAverageRevolvingBalance(value));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateAllocation(allocation);
    setErrors(validationErrors);
    const borrowingError = validateAverageRevolvingBalance(averageRevolvingBalance);
    setBalanceError(borrowingError);

    if (Object.keys(validationErrors).length > 0 || borrowingError) {
      setSubmitted(false);
      setRanked([]);
      return;
    }

    setSubmitted(true);
    const rankedCards = rankCards(cards, allocation, 5, averageRevolvingBalance);
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

  /** Short localized summary of one applied rule. */
  const summarizeRule = (rule: AppliedRule): string => {
    const label = common[RULE_CATEGORY_LABELS[rule.ruleCategory] as keyof typeof common] as string;
    if (rule.kind === 'earn' && rule.earn) {
      return `${label}: ${fillCopy(common.calcRuleEarnShort, {
        points: String(rule.earn.pointsPerUnit),
        unit: String(rule.earn.spendUnitBdt),
      })}`;
    }
    if (rule.kind === 'cashback' && rule.cashback) {
      const summary = `${label}: ${fillCopy(common.calcRuleCashbackShort, {
        percent: String(rule.cashback.percent),
      })}`;
      return rule.cashback.capText ? `${summary} (${rule.cashback.capText})` : summary;
    }
    return label;
  };

  // Highest effective value-back among the results, if any card has one.
  // Ranking order is untouched — this only identifies the best-% card.
  const bestValueBackCard = ranked.reduce<RankedCard | null>((best, rankedCard) => {
    if (rankedCard.valueBackPercent === null) return best;
    if (best === null || best.valueBackPercent === null) return rankedCard;
    return rankedCard.valueBackPercent > best.valueBackPercent ? rankedCard : best;
  }, null);

  const rankedCardItem = (rankedCard: RankedCard, index: number) => {
    const {
      card,
      estimate,
      annualPoints,
      annualRewardValue,
      netAnnualValue,
      breakEvenMonthlySpend,
      annualInterest,
      netAnnualValueAfterInterest,
      rankable,
      valueBackPercent,
    } = rankedCard;
    const isBestValueBack = bestValueBackCard !== null && bestValueBackCard.card.id === card.id;
    // A card is only shown with a BDT figure when the bank itself states a
    // point value and/or publishes cashback; otherwise points stay unconverted.
    const hasValue = estimate.annualValueBdt !== null;
    return (
      <li key={card.id} className="ranked-card">
        <div className="ranked-card-main">
          {!rankable && <p role="status">{common.calcUnrankableApr}</p>}
          <span className="ranked-card-name">
            {rankable ? `${index + 1}. ` : ''}
            {card.name}
          </span>
          <span className="ranked-card-bank">{card.bankName ?? common.unknown}</span>
          <dl className="ranked-card-metrics">
            <div>
              <dt>{common.calcResultAnnualFee}</dt>
              <dd>{card.annualFee !== null ? formatBdt(card.annualFee) : common.calcFeeUnknown}</dd>
            </div>
            {annualPoints !== null && (
              <div>
                <dt>{common.calcPointsPerYear}</dt>
                <dd>{Math.round(annualPoints).toLocaleString()}</dd>
              </div>
            )}
            <div>
              <dt>{common.calcResultEstRewards}</dt>
              <dd>
                {hasValue && annualRewardValue !== null
                  ? formatBdt(annualRewardValue)
                  : common.calcValueNotPublished}
              </dd>
            </div>
            {hasValue && (
              <div>
                <dt>{common.calcResultNetValue}</dt>
                <dd
                  className={
                    netAnnualValue === null
                      ? undefined
                      : netAnnualValue >= 0
                      ? 'positive'
                      : 'negative'
                  }
                >
                  {netAnnualValue === null ? common.calcFeeUnknown : formatBdt(netAnnualValue)}
                </dd>
              </div>
            )}
            {averageRevolvingBalance > 0 && (
              <div>
                <dt>{common.calcResultAnnualInterest}</dt>
                <dd>
                  {annualInterest === null ? common.calcInterestUnknown : formatBdt(annualInterest)}
                </dd>
              </div>
            )}
            {hasValue && averageRevolvingBalance > 0 && (
              <div>
                <dt>{common.calcResultNetValueAfterInterest}</dt>
                <dd
                  className={
                    netAnnualValueAfterInterest === null
                      ? undefined
                      : netAnnualValueAfterInterest >= 0
                      ? 'positive'
                      : 'negative'
                  }
                >
                  {netAnnualValueAfterInterest === null
                    ? annualInterest === null
                      ? common.calcInterestUnknown
                      : common.calcFeeUnknown
                    : formatBdt(netAnnualValueAfterInterest)}
                </dd>
              </div>
            )}
            {hasValue && (
              <div>
                <dt>{common.calcResultBreakEven}</dt>
                <dd>
                  {breakEvenMonthlySpend === null
                    ? common.calcResultBreakEvenUnknown
                    : formatBdt(breakEvenMonthlySpend)}
                </dd>
              </div>
            )}
          </dl>
          {hasValue && (
            <p className="ranked-card-value-back">
              <span className="value-back-label">{common.calcResultValueBack}</span>
              <span
                className={`value-back-figure${
                  valueBackPercent !== null && valueBackPercent < 0 ? ' negative' : ''
                }`}
              >
                {valueBackPercent === null ? '—' : `${valueBackPercent.toFixed(1)}%`}
              </span>
              {isBestValueBack && (
                <span className="value-back-badge">{common.calcBestValueBack}</span>
              )}
              {valueBackPercent === null && (
                <span className="value-back-hint">{common.calcValueBackNoSpend}</span>
              )}
            </p>
          )}
          {estimate.appliedRules.length > 0 && (
            <p className="ranked-card-rules-applied">
              <strong>{common.calcRulesApplied}</strong>{' '}
              <span>
                {dedupeAppliedRules(estimate.appliedRules).map(summarizeRule).join(' · ')}
              </span>
            </p>
          )}
          <details className="ranked-card-rule-details">
            <summary>{common.calcBankRuleDetails}</summary>
            <ul className="ranked-card-rule-texts">
              {estimate.ruleTexts.map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
            {card.rewardPointValueBdt != null && (
              <p className="ranked-card-point-value-note">
                {fillCopy(common.calcPointValueStated, {
                  value: String(card.rewardPointValueBdt),
                })}
              </p>
            )}
            {card.rewardSourceUrl && (
              <p className="ranked-card-reward-source">
                {common.calcSourceLink}:{' '}
                <a href={card.rewardSourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                  {rewardSourceLabel(card.rewardSourceUrl)}
                </a>
              </p>
            )}
          </details>
          <button
            type="button"
            className="export-compare-button"
            onClick={() => handleExportToComparison(card)}
          >
            {common.calcExportCompare}
          </button>
        </div>
      </li>
    );
  };

  const valuedCards = ranked.filter(
    rankedCard =>
      rankedCard.rankable &&
      rankedCard.estimate.annualValueBdt !== null &&
      rankedCard.estimate.annualValueBdt > 0
  );
  const pointsOnlyCards = ranked.filter(
    rankedCard =>
      rankedCard.rankable &&
      !(rankedCard.estimate.annualValueBdt !== null && rankedCard.estimate.annualValueBdt > 0)
  );

  const unrankableCards = ranked.filter(rankedCard => !rankedCard.rankable);

  return (
    <div className="reward-calculator-page">
      {planEmbedded ? null : (
        <section className="calculator-hero">
          <h1>{common.calcTitle}</h1>
          <p>{common.calcSubtitle}</p>
        </section>
      )}

      <section className="calculator-form-section" aria-labelledby="spend-form-heading">
        <h2 id="spend-form-heading">{common.calcFormTitle}</h2>
        <form className="spend-form" onSubmit={handleSubmit} noValidate>
          {CATEGORY_LABELS.map(({ key, labelKey }) => {
            return (
              <div className="input-group" key={key}>
                <label htmlFor={`spend-${key}`}>
                  {common[labelKey as keyof typeof common]} ({common.calcCurrencyPerMonth}):
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

          <div className="input-group">
            <label htmlFor="avg-revolving-balance">
              {common.calcAverageRevolvingBalance} ({common.calcCurrencyBdt}):
            </label>
            <input
              type="number"
              id="avg-revolving-balance"
              name="averageRevolvingBalance"
              min="0"
              max={MAX_AVERAGE_REVOLVING_BALANCE}
              step="any"
              value={averageRevolvingBalance || ''}
              onChange={handleBalanceChange}
              aria-invalid={Boolean(balanceError)}
              aria-describedby={`avg-revolving-balance-hint${
                balanceError ? ' avg-revolving-balance-error' : ''
              }`}
            />
            <p className="field-hint" id="avg-revolving-balance-hint">
              {common.calcAverageRevolvingBalanceHint}
            </p>
            {balanceError && (
              <p className="field-error" id="avg-revolving-balance-error" role="alert">
                {balanceError === 'tooLarge'
                  ? common.calcBalanceTooLarge
                  : common.calcBalanceNonNegative}
              </p>
            )}
          </div>

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
            <li>{common.calcAssumption2}</li>
            <li>{common.calcAssumption3}</li>
            <li>{common.calcAssumption4}</li>
            <li>{common.calcAssumption5}</li>
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
              {averageRevolvingBalance > 0
                ? common.calcBorrowingResultsTitle
                : `${common.calcResultsTitle} ${ranked.length} ${common.calcRankedCardsSuffix}`}
            </h2>
            {bestValueBackCard !== null && bestValueBackCard.valueBackPercent !== null && (
              <p className="value-back-explainer">
                {fillCopy(common.calcValueBackExplainer, {
                  value: bestValueBackCard.valueBackPercent.toFixed(1),
                })}
              </p>
            )}
            {valuedCards.length > 0 && (
              <>
                <h3 className="ranking-group-heading">{common.calcValuedCardsHeading}</h3>
                <ol className="ranked-card-list">
                  {valuedCards.map((rankedCard, index) => rankedCardItem(rankedCard, index))}
                </ol>
              </>
            )}
            {pointsOnlyCards.length > 0 && (
              <>
                <h3 className="ranking-group-heading">{common.calcPointsOnlyHeading}</h3>
                <ol className="ranked-card-list">
                  {pointsOnlyCards.map((rankedCard, index) => rankedCardItem(rankedCard, index))}
                </ol>
              </>
            )}
            {unrankableCards.length > 0 && (
              <>
                <h3 className="ranking-group-heading">{common.calcUnknownAprHeading}</h3>
                <ul className="ranked-card-list">
                  {unrankableCards.map((rankedCard, index) => rankedCardItem(rankedCard, index))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
      {planEmbedded ? (
        <p className="plan-save-row">
          <SaveScenarioButton
            tool="rewards"
            params={Object.fromEntries(
              Object.entries(allocation)
                .filter(([, value]) => value > 0)
                .map(([key, value]) => [key, String(value)])
            )}
          />
        </p>
      ) : null}
    </div>
  );
};

export default RewardCalculatorPage;
