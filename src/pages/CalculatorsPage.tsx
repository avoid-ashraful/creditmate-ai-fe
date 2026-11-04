import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { fillCopy, getCommonCopy, toBanglaNumerals, useLanguage } from '../locales';
import { CalculatorsCopy, getCalculatorsCopy } from '../locales/calculators';
import type { CommonCopy } from '../locales/common';
import { getLoansCopy } from '../locales/loans';
import { apiService } from '../services/api';
import { CreditCard } from '../types';
import {
  calculateEmi,
  calculatePayoff,
  COMMON_EMI_TENURES,
  EmiResult,
  PayoffResult,
  YearSummary,
} from '../utils/emiPayoffCalculator';
import { fetchAllPages } from '../utils/fetchAllPages';

import './CalculatorsPage.css';

type ToolTab = 'emi' | 'payoff';

/** 'custom', or the id of the selected card as a string. */
type RateSelection = string;

interface ResolvedRate {
  apr: number | null;
  card: CreditCard | null;
  usesCustomRate: boolean;
}

const parseNumber = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

/**
 * Resolve the APR a calculation should use. A card with a published APR
 * always wins; the custom rate is used for the "custom" option and —
 * crucially — for cards that publish no APR, where the user must supply
 * their own rate. A missing APR is never silently treated as 0%.
 */
const resolveRate = (
  selection: RateSelection,
  cards: CreditCard[],
  customAprRaw: string
): ResolvedRate => {
  if (selection === 'custom') {
    return { apr: parseNumber(customAprRaw), card: null, usesCustomRate: true };
  }
  const card = cards.find(item => String(item.id) === selection) ?? null;
  if (!card) return { apr: null, card: null, usesCustomRate: false };
  if (card.interestRateApr !== null) {
    return { apr: card.interestRateApr, card, usesCustomRate: false };
  }
  return { apr: parseNumber(customAprRaw), card, usesCustomRate: true };
};

interface Formatters {
  money: (value: number) => string;
  apr: (value: number) => string;
  count: (value: number) => string;
}

const BreakdownTable: React.FC<{
  rows: YearSummary[];
  copy: CalculatorsCopy;
  formatters: Formatters;
}> = ({ rows, copy, formatters }) => (
  <div className="calculators-breakdown">
    <h3>{copy.breakdownHeading}</h3>
    <table>
      <thead>
        <tr>
          <th scope="col">{copy.breakdownYear}</th>
          <th scope="col">{copy.breakdownPrincipal}</th>
          <th scope="col">{copy.breakdownInterest}</th>
          <th scope="col">{copy.breakdownBalance}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.year}>
            <th scope="row">{fillCopy(copy.yearLabel, { year: formatters.count(row.year) })}</th>
            <td>{formatters.money(row.principalPaid)}</td>
            <td>{formatters.money(row.interestPaid)}</td>
            <td>{formatters.money(row.closingBalance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface RateSourceFieldsProps {
  idPrefix: string;
  cards: CreditCard[];
  selection: RateSelection;
  onSelectionChange: (selection: RateSelection) => void;
  customApr: string;
  onCustomAprChange: (value: string) => void;
  aprError: string | null;
  copy: CalculatorsCopy;
  common: CommonCopy;
  formatters: Formatters;
}

const RateSourceFields: React.FC<RateSourceFieldsProps> = ({
  idPrefix,
  cards,
  selection,
  onSelectionChange,
  customApr,
  onCustomAprChange,
  aprError,
  copy,
  common,
  formatters,
}) => {
  const selectedCard =
    selection === 'custom' ? null : cards.find(card => String(card.id) === selection) ?? null;
  const showCustomApr = Boolean(
    selection === 'custom' || (selectedCard && selectedCard.interestRateApr === null)
  );

  return (
    <>
      <div className="calculators-field">
        <label htmlFor={`${idPrefix}-card`}>{copy.cardLabel}</label>
        <select
          id={`${idPrefix}-card`}
          value={selection}
          onChange={event => onSelectionChange(event.target.value)}
        >
          <option value="custom">{copy.customRateOption}</option>
          {cards.map(card => (
            <option key={card.id} value={String(card.id)}>
              {card.name}
              {card.bankName ? ` — ${card.bankName}` : ''}
              {card.interestRateApr === null ? copy.aprNotPublishedSuffix : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedCard && (
        <p className="calculators-card-facts">
          {common.calcResultAnnualFee}:{' '}
          {selectedCard.annualFee !== null
            ? formatters.money(selectedCard.annualFee)
            : common.calcFeeUnknown}
          {' · '}
          {copy.customAprLabel.replace(' (%)', '')}:{' '}
          {selectedCard.interestRateApr !== null
            ? `${formatters.apr(selectedCard.interestRateApr)}%`
            : common.calcFeeUnknown}
        </p>
      )}

      {selectedCard && selectedCard.interestRateApr === null && (
        <p className="calculators-no-apr-note" role="note">
          {fillCopy(copy.noAprNotice, {
            card: selectedCard.bankName
              ? `${selectedCard.name} (${selectedCard.bankName})`
              : selectedCard.name,
          })}
        </p>
      )}

      {showCustomApr && (
        <div className="calculators-field">
          <label htmlFor={`${idPrefix}-apr`}>{copy.customAprLabel}</label>
          <input
            id={`${idPrefix}-apr`}
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder={copy.customAprPlaceholder}
            value={customApr}
            onChange={event => onCustomAprChange(event.target.value)}
            aria-invalid={aprError ? true : undefined}
            aria-describedby={aprError ? `${idPrefix}-apr-error` : undefined}
          />
          {aprError && (
            <p className="field-error" id={`${idPrefix}-apr-error`} role="alert">
              {aprError}
            </p>
          )}
        </div>
      )}
    </>
  );
};

const aprSourceText = (copy: CalculatorsCopy, formatters: Formatters, rate: ResolvedRate): string =>
  rate.card && !rate.usesCustomRate
    ? fillCopy(copy.aprSourceCard, {
        apr: formatters.apr(rate.apr ?? 0),
        card: rate.card.bankName ? `${rate.card.name} (${rate.card.bankName})` : rate.card.name,
      })
    : fillCopy(copy.aprSourceCustom, { apr: formatters.apr(rate.apr ?? 0) });

interface EmiOutcome {
  result: EmiResult;
  sourceText: string;
}

const EmiTool: React.FC<{
  cards: CreditCard[];
  copy: CalculatorsCopy;
  common: CommonCopy;
  formatters: Formatters;
}> = ({ cards, copy, common, formatters }) => {
  const { lang } = useLanguage();
  const [selection, setSelection] = useState<RateSelection>('custom');
  const [customApr, setCustomApr] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tenure, setTenure] = useState<string>('12');
  const [errors, setErrors] = useState<{ amount?: string; tenure?: string; apr?: string }>({});
  const [outcome, setOutcome] = useState<EmiOutcome | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const rate = resolveRate(selection, cards, customApr);
    const principal = parseNumber(amount);
    const months = parseNumber(tenure);
    const nextErrors: typeof errors = {};
    if (principal === null || principal <= 0) nextErrors.amount = copy.errorAmount;
    if (months === null || !Number.isInteger(months) || months < 1) {
      nextErrors.tenure = copy.errorTenure;
    }
    if (rate.apr === null || rate.apr < 0) nextErrors.apr = copy.errorApr;
    setErrors(nextErrors);
    if (
      Object.keys(nextErrors).length > 0 ||
      principal === null ||
      months === null ||
      rate.apr === null
    ) {
      setOutcome(null);
      return;
    }
    const result = calculateEmi({ principal, aprPercent: rate.apr, months });
    if (!result) {
      setOutcome(null);
      return;
    }
    setOutcome({ result, sourceText: aprSourceText(copy, formatters, rate) });
    analytics.track(ANALYTICS_EVENTS.calculatorUse);
  };

  return (
    <section aria-labelledby="emi-heading">
      <h2 id="emi-heading">{copy.emiHeading}</h2>
      <p className="calculators-tool-intro">{copy.emiIntro}</p>
      <form className="calculators-form" onSubmit={handleSubmit} noValidate>
        <RateSourceFields
          idPrefix="emi"
          cards={cards}
          selection={selection}
          onSelectionChange={setSelection}
          customApr={customApr}
          onCustomAprChange={setCustomApr}
          aprError={errors.apr ?? null}
          copy={copy}
          common={common}
          formatters={formatters}
        />

        <div className="calculators-field">
          <label htmlFor="emi-amount">{copy.amountLabel}</label>
          <input
            id="emi-amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder={copy.amountPlaceholder}
            value={amount}
            onChange={event => setAmount(event.target.value)}
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={errors.amount ? 'emi-amount-error' : undefined}
          />
          {errors.amount && (
            <p className="field-error" id="emi-amount-error" role="alert">
              {errors.amount}
            </p>
          )}
        </div>

        <div className="calculators-field">
          <label htmlFor="emi-tenure">{copy.tenureLabel}</label>
          <input
            id="emi-tenure"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={tenure}
            onChange={event => setTenure(event.target.value)}
            aria-invalid={errors.tenure ? true : undefined}
            aria-describedby={errors.tenure ? 'emi-tenure-error' : undefined}
          />
          <div className="calculators-tenure-picks" role="group" aria-label={copy.tenureLabel}>
            {COMMON_EMI_TENURES.map(months => (
              <button
                key={months}
                type="button"
                className={`tenure-chip${tenure === String(months) ? ' tenure-chip-active' : ''}`}
                onClick={() => setTenure(String(months))}
                aria-pressed={tenure === String(months)}
              >
                {formatters.count(months)} {copy.tenureUnit}
              </button>
            ))}
          </div>
          {errors.tenure && (
            <p className="field-error" id="emi-tenure-error" role="alert">
              {errors.tenure}
            </p>
          )}
        </div>

        <button type="submit" className="calculate-button">
          {copy.calculateEmi}
        </button>
      </form>

      {outcome && (
        <div className="calculators-result" aria-live="polite">
          <h3>{copy.resultsHeading}</h3>
          <p className="calculators-apr-source">{outcome.sourceText}</p>
          <dl className="calculators-metrics">
            <div>
              <dt>{copy.emiMonthly}</dt>
              <dd>{formatters.money(outcome.result.monthlyEmi)}</dd>
            </div>
            <div>
              <dt>{copy.emiTotalInterest}</dt>
              <dd>{formatters.money(outcome.result.totalInterest)}</dd>
            </div>
            <div>
              <dt>{copy.emiTotalPayable}</dt>
              <dd>{formatters.money(outcome.result.totalPayable)}</dd>
            </div>
          </dl>
          {outcome.result.yearlyBreakdown.length > 1 && (
            <BreakdownTable
              rows={outcome.result.yearlyBreakdown}
              copy={copy}
              formatters={formatters}
            />
          )}
        </div>
      )}
      <p className="calculators-loans-link">
        <Link to="/loans">{getLoansCopy(lang).calculatorsLinkText}</Link>
      </p>
    </section>
  );
};

interface PayoffOutcome {
  result: PayoffResult;
  sourceText: string;
  payment: number;
}

const PayoffTool: React.FC<{
  cards: CreditCard[];
  copy: CalculatorsCopy;
  common: CommonCopy;
  formatters: Formatters;
}> = ({ cards, copy, common, formatters }) => {
  const [selection, setSelection] = useState<RateSelection>('custom');
  const [customApr, setCustomApr] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [payment, setPayment] = useState<string>('');
  const [errors, setErrors] = useState<{ balance?: string; payment?: string; apr?: string }>({});
  const [outcome, setOutcome] = useState<PayoffOutcome | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const rate = resolveRate(selection, cards, customApr);
    const parsedBalance = parseNumber(balance);
    const parsedPayment = parseNumber(payment);
    const nextErrors: typeof errors = {};
    if (parsedBalance === null || parsedBalance <= 0) nextErrors.balance = copy.errorBalance;
    if (parsedPayment === null || parsedPayment <= 0) nextErrors.payment = copy.errorPayment;
    if (rate.apr === null || rate.apr < 0) nextErrors.apr = copy.errorApr;
    setErrors(nextErrors);
    if (
      Object.keys(nextErrors).length > 0 ||
      parsedBalance === null ||
      parsedPayment === null ||
      rate.apr === null
    ) {
      setOutcome(null);
      return;
    }
    const result = calculatePayoff({
      balance: parsedBalance,
      aprPercent: rate.apr,
      monthlyPayment: parsedPayment,
    });
    if (!result) {
      setOutcome(null);
      return;
    }
    setOutcome({
      result,
      sourceText: aprSourceText(copy, formatters, rate),
      payment: parsedPayment,
    });
    analytics.track(ANALYTICS_EVENTS.calculatorUse);
  };

  return (
    <section aria-labelledby="payoff-heading">
      <h2 id="payoff-heading">{copy.payoffHeading}</h2>
      <p className="calculators-tool-intro">{copy.payoffIntro}</p>
      <form className="calculators-form" onSubmit={handleSubmit} noValidate>
        <RateSourceFields
          idPrefix="payoff"
          cards={cards}
          selection={selection}
          onSelectionChange={setSelection}
          customApr={customApr}
          onCustomAprChange={setCustomApr}
          aprError={errors.apr ?? null}
          copy={copy}
          common={common}
          formatters={formatters}
        />

        <div className="calculators-field">
          <label htmlFor="payoff-balance">{copy.balanceLabel}</label>
          <input
            id="payoff-balance"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder={copy.balancePlaceholder}
            value={balance}
            onChange={event => setBalance(event.target.value)}
            aria-invalid={errors.balance ? true : undefined}
            aria-describedby={errors.balance ? 'payoff-balance-error' : undefined}
          />
          {errors.balance && (
            <p className="field-error" id="payoff-balance-error" role="alert">
              {errors.balance}
            </p>
          )}
        </div>

        <div className="calculators-field">
          <label htmlFor="payoff-payment">{copy.monthlyPaymentLabel}</label>
          <input
            id="payoff-payment"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder={copy.monthlyPaymentPlaceholder}
            value={payment}
            onChange={event => setPayment(event.target.value)}
            aria-invalid={errors.payment ? true : undefined}
            aria-describedby={errors.payment ? 'payoff-payment-error' : undefined}
          />
          {errors.payment && (
            <p className="field-error" id="payoff-payment-error" role="alert">
              {errors.payment}
            </p>
          )}
        </div>

        <button type="submit" className="calculate-button">
          {copy.calculatePayoff}
        </button>
      </form>

      {outcome && outcome.result.clears && (
        <div className="calculators-result" aria-live="polite">
          <h3>{copy.resultsHeading}</h3>
          <p className="calculators-apr-source">{outcome.sourceText}</p>
          <dl className="calculators-metrics">
            <div>
              <dt>{copy.payoffMonthsLabel}</dt>
              <dd>
                {fillCopy(copy.payoffMonthsValue, {
                  months: formatters.count(outcome.result.months),
                })}
              </dd>
            </div>
            <div>
              <dt>{copy.payoffTotalInterest}</dt>
              <dd>{formatters.money(outcome.result.totalInterest)}</dd>
            </div>
            <div>
              <dt>{copy.payoffTotalPaid}</dt>
              <dd>{formatters.money(outcome.result.totalPaid)}</dd>
            </div>
          </dl>
          {outcome.result.finalPayment < outcome.payment && (
            <p className="calculators-final-payment">
              {fillCopy(copy.payoffFinalPayment, {
                amount: formatters.money(outcome.result.finalPayment),
              })}
            </p>
          )}
          {outcome.result.yearlyBreakdown.length > 1 && (
            <BreakdownTable
              rows={outcome.result.yearlyBreakdown}
              copy={copy}
              formatters={formatters}
            />
          )}
        </div>
      )}

      {outcome && !outcome.result.clears && (
        <div className="calculators-warning" role="alert">
          <h3>{copy.neverClearsTitle}</h3>
          <p className="calculators-apr-source">{outcome.sourceText}</p>
          <p>
            {fillCopy(copy.neverClearsBody, {
              payment: formatters.money(outcome.payment),
              interest: formatters.money(outcome.result.firstMonthInterest),
            })}
          </p>
        </div>
      )}
    </section>
  );
};

const CalculatorsPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getCalculatorsCopy(lang);
  const common = getCommonCopy(lang);
  const isBn = lang === 'bn';
  useSeoMeta({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: '/calculators',
  });

  const [tab, setTab] = useState<ToolTab>('emi');
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

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
        setApiError(copy.cardsLoadError);
        setCards([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchCards();
    return () => {
      cancelled = true;
    };
    // The load error copy is read once on mount; language switches re-render text elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatters: Formatters = {
    money: (value: number) => {
      const text = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return isBn ? `৳${toBanglaNumerals(text)}` : `BDT ${text}`;
    },
    apr: (value: number) => (isBn ? toBanglaNumerals(String(value)) : String(value)),
    count: (value: number) => (isBn ? toBanglaNumerals(String(value)) : String(value)),
  };

  return (
    <div className="calculators-page">
      <section className="calculator-hero">
        <h1>{copy.heading}</h1>
        <p>{copy.intro}</p>
      </section>

      {isLoading ? (
        <div className="loading-state" role="status">
          {copy.loadingCards}
        </div>
      ) : apiError ? (
        <div className="error-state" role="alert">
          {apiError}
        </div>
      ) : (
        <>
          <div className="calculators-tabs" role="tablist" aria-label={copy.heading}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'emi'}
              className={`calculators-tab${tab === 'emi' ? ' calculators-tab-active' : ''}`}
              onClick={() => setTab('emi')}
            >
              {copy.tabEmi}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'payoff'}
              className={`calculators-tab${tab === 'payoff' ? ' calculators-tab-active' : ''}`}
              onClick={() => setTab('payoff')}
            >
              {copy.tabPayoff}
            </button>
          </div>

          <section className="calculator-form-section">
            {tab === 'emi' ? (
              <EmiTool cards={cards} copy={copy} common={common} formatters={formatters} />
            ) : (
              <PayoffTool cards={cards} copy={copy} common={common} formatters={formatters} />
            )}
          </section>
        </>
      )}

      <div className="assumptions-note">
        <h3>{copy.noteHeading}</h3>
        <p>{copy.noteBody}</p>
      </div>
    </div>
  );
};

export default CalculatorsPage;
