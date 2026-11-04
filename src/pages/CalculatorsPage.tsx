import React, { useEffect, useState } from 'react';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { fillCopy, getCommonCopy, toBanglaNumerals, useLanguage } from '../locales';
import { CalculatorsCopy, getCalculatorsCopy } from '../locales/calculators';
import type { CommonCopy } from '../locales/common';
import { apiService } from '../services/api';
import {
  DepositProduct,
  DepositProductDetail,
  getDepositProduct,
  getDepositProducts,
} from '../services/deposits';
import { CreditCard } from '../types';
import {
  bankSourceTaxPercent,
  DepositRateLike,
  dpsInstalmentForTarget,
  dpsMaturity,
  fdrMaturity,
  netOfTax,
  NetMaturity,
  pickDepositRate,
} from '../utils/depositCalculator';
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

type ToolTab = 'emi' | 'payoff' | 'fd' | 'dps';

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

/** Longest horizon the deposit tools accept (matches the scenario API cap). */
const MAX_DEPOSIT_MONTHS = 600;

/**
 * Deposit-product preset state for the FD/DPS tools: the product list for
 * one kind, the current selection ('custom' or a slug), and the selected
 * product's detail (for its published rates + compounding).
 */
const useDepositPreset = (products: DepositProduct[]) => {
  const [selection, setSelection] = useState<string>('custom');
  const [detail, setDetail] = useState<DepositProductDetail | null>(null);

  useEffect(() => {
    if (selection === 'custom') {
      setDetail(null);
      return;
    }
    let cancelled = false;
    getDepositProduct(selection)
      .then(fetched => {
        if (!cancelled) setDetail(fetched);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selection]);

  const selectedProduct = products.find(product => product.slug === selection) ?? null;
  return { selection, setSelection, detail, selectedProduct };
};

interface DepositRateFieldsProps {
  idPrefix: string;
  products: DepositProduct[];
  selection: string;
  onSelectionChange: (selection: string) => void;
  customRate: string;
  onCustomRateChange: (value: string) => void;
  showCustomRate: boolean;
  noRateProductName: string | null;
  rateError: string | null;
  copy: CalculatorsCopy;
}

const DepositRateFields: React.FC<DepositRateFieldsProps> = ({
  idPrefix,
  products,
  selection,
  onSelectionChange,
  customRate,
  onCustomRateChange,
  showCustomRate,
  noRateProductName,
  rateError,
  copy,
}) => (
  <>
    <div className="calculators-field">
      <label htmlFor={`${idPrefix}-product`}>{copy.depositProductLabel}</label>
      <select
        id={`${idPrefix}-product`}
        value={selection}
        onChange={event => onSelectionChange(event.target.value)}
      >
        <option value="custom">{copy.customDepositRateOption}</option>
        {products.map(product => (
          <option key={product.slug} value={product.slug}>
            {product.name} — {product.institutionDisplayName}
          </option>
        ))}
      </select>
    </div>
    {noRateProductName && (
      <p className="calculators-no-apr-note" role="note">
        {fillCopy(copy.noRateForTenureNotice, { product: noRateProductName })}
      </p>
    )}
    {showCustomRate && (
      <div className="calculators-field">
        <label htmlFor={`${idPrefix}-rate`}>{copy.depositRateLabel}</label>
        <input
          id={`${idPrefix}-rate`}
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={customRate}
          onChange={event => onCustomRateChange(event.target.value)}
          aria-invalid={rateError ? true : undefined}
        />
        {rateError && (
          <p className="field-error" role="alert">
            {rateError}
          </p>
        )}
      </div>
    )}
  </>
);

interface DepositOutcome {
  net: NetMaturity;
  contributed: number;
  sourceText: string;
  requiredInstalment?: number;
}

const depositSourceText = (
  copy: CalculatorsCopy,
  formatters: Formatters,
  rate: number,
  product: DepositProduct | null,
  row: (DepositRateLike & { isDerived?: boolean; isRange?: boolean }) | null
): string => {
  if (product && row) {
    let text = fillCopy(copy.depositRateSourceProduct, {
      rate: formatters.apr(rate),
      product: `${product.name} (${product.institutionDisplayName})`,
    });
    // The picked row's rateMin is used for ranges — say so, since the
    // published figure is a band, not a point rate.
    if (row.isRange) text += copy.rangeRateSuffix;
    if (row.isDerived) text += copy.derivedRateSuffix;
    return text;
  }
  return fillCopy(copy.depositRateSourceCustom, { rate: formatters.apr(rate) });
};

const FdTool: React.FC<{
  products: DepositProduct[];
  copy: CalculatorsCopy;
  formatters: Formatters;
}> = ({ products, copy, formatters }) => {
  const preset = useDepositPreset(products);
  const [customRate, setCustomRate] = useState<string>('');
  const [amount, setAmount] = useState<string>('500000');
  const [months, setMonths] = useState<string>('12');
  const [hasTin, setHasTin] = useState<boolean>(true);
  const [errors, setErrors] = useState<{ amount?: string; months?: string; rate?: string }>({});
  const [outcome, setOutcome] = useState<DepositOutcome | null>(null);

  const parsedMonths = parseNumber(months);
  const parsedAmount = parseNumber(amount);
  const row =
    preset.detail && parsedMonths !== null && parsedAmount !== null
      ? pickDepositRate(preset.detail.rates, parsedMonths, parsedAmount)
      : null;
  // While a preset's detail is still loading (or failed to load) there is
  // no picked row, so the custom-rate field must show — otherwise submit
  // fails on a rate input the user cannot see.
  const needsCustomRate = preset.selection === 'custom' || preset.detail === null || row === null;
  const noRateProductName =
    preset.selection !== 'custom' && preset.detail !== null && row === null
      ? preset.detail.name
      : null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const rate = row ? row.rateMin : parseNumber(customRate);
    const nextErrors: typeof errors = {};
    if (parsedAmount === null || parsedAmount <= 0) nextErrors.amount = copy.errorAmount;
    if (
      parsedMonths === null ||
      !Number.isInteger(parsedMonths) ||
      parsedMonths < 1 ||
      parsedMonths > MAX_DEPOSIT_MONTHS
    ) {
      nextErrors.months = copy.errorTenure;
    }
    if (rate === null || rate < 0) nextErrors.rate = copy.errorDepositRate;
    setErrors(nextErrors);
    if (
      Object.keys(nextErrors).length > 0 ||
      parsedAmount === null ||
      parsedMonths === null ||
      rate === null
    ) {
      setOutcome(null);
      return;
    }
    const gross = fdrMaturity(
      parsedAmount,
      rate,
      parsedMonths,
      preset.detail?.compounding ?? 'annual'
    );
    if (gross === null) {
      setOutcome(null);
      return;
    }
    setOutcome({
      net: netOfTax(gross, parsedAmount, bankSourceTaxPercent(hasTin)),
      contributed: parsedAmount,
      sourceText: depositSourceText(copy, formatters, rate, preset.selectedProduct, row),
    });
    analytics.track(ANALYTICS_EVENTS.calculatorUse);
  };

  return (
    <section aria-labelledby="fd-heading">
      <h2 id="fd-heading">{copy.fdHeading}</h2>
      <p className="calculators-tool-intro">{copy.fdIntro}</p>
      <form className="calculators-form" onSubmit={handleSubmit} noValidate>
        <DepositRateFields
          idPrefix="fd"
          products={products}
          selection={preset.selection}
          onSelectionChange={preset.setSelection}
          customRate={customRate}
          onCustomRateChange={setCustomRate}
          showCustomRate={needsCustomRate}
          noRateProductName={noRateProductName}
          rateError={errors.rate ?? null}
          copy={copy}
        />
        <div className="calculators-field">
          <label htmlFor="fd-amount">{copy.fdAmountLabel}</label>
          <input
            id="fd-amount"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={event => setAmount(event.target.value)}
            aria-invalid={errors.amount ? true : undefined}
          />
          {errors.amount && (
            <p className="field-error" role="alert">
              {errors.amount}
            </p>
          )}
        </div>
        <div className="calculators-field">
          <label htmlFor="fd-months">{copy.fdMonthsLabel}</label>
          <input
            id="fd-months"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={months}
            onChange={event => setMonths(event.target.value)}
            aria-invalid={errors.months ? true : undefined}
          />
          {errors.months && (
            <p className="field-error" role="alert">
              {errors.months}
            </p>
          )}
        </div>
        <label className="calculators-checkbox">
          <input
            type="checkbox"
            checked={hasTin}
            onChange={event => setHasTin(event.target.checked)}
          />
          {copy.hasTinLabel}
        </label>
        <button type="submit" className="calculate-button">
          {copy.calculateFd}
        </button>
      </form>
      {outcome && (
        <div className="calculators-result" aria-live="polite">
          <h3>{copy.resultsHeading}</h3>
          <p className="calculators-apr-source">{outcome.sourceText}</p>
          <dl className="calculators-metrics">
            <div>
              <dt>{copy.fdGross}</dt>
              <dd>{formatters.money(outcome.net.grossMaturity)}</dd>
            </div>
            <div>
              <dt>{copy.fdInterest}</dt>
              <dd>{formatters.money(outcome.net.interestEarned)}</dd>
            </div>
            <div>
              <dt>{copy.fdTax}</dt>
              <dd>{formatters.money(outcome.net.sourceTax)}</dd>
            </div>
            <div>
              <dt>{copy.fdNet}</dt>
              <dd>{formatters.money(outcome.net.netMaturity)}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
};

const DpsTool: React.FC<{
  products: DepositProduct[];
  copy: CalculatorsCopy;
  formatters: Formatters;
}> = ({ products, copy, formatters }) => {
  const preset = useDepositPreset(products);
  const [mode, setMode] = useState<'maturity' | 'goal'>('maturity');
  const [customRate, setCustomRate] = useState<string>('');
  const [instalment, setInstalment] = useState<string>('5000');
  const [target, setTarget] = useState<string>('1000000');
  const [months, setMonths] = useState<string>('60');
  const [hasTin, setHasTin] = useState<boolean>(true);
  const [errors, setErrors] = useState<{
    instalment?: string;
    target?: string;
    months?: string;
    rate?: string;
  }>({});
  const [outcome, setOutcome] = useState<DepositOutcome | null>(null);

  const parsedMonths = parseNumber(months);
  const parsedInstalment = parseNumber(instalment);
  const slabAmount = mode === 'maturity' ? parsedInstalment : null;
  const row =
    preset.detail && parsedMonths !== null && slabAmount !== null
      ? pickDepositRate(preset.detail.rates, parsedMonths, slabAmount)
      : preset.detail && parsedMonths !== null
      ? pickDepositRate(preset.detail.rates, parsedMonths, preset.detail.minInstalment ?? 0)
      : null;
  // Same rule as the FD tool: a preset whose detail has not loaded (or
  // failed) has no picked row, so the custom-rate field must be visible.
  const needsCustomRate = preset.selection === 'custom' || preset.detail === null || row === null;
  const noRateProductName =
    preset.selection !== 'custom' && preset.detail !== null && row === null
      ? preset.detail.name
      : null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const rate = row ? row.rateMin : parseNumber(customRate);
    const nextErrors: typeof errors = {};
    if (
      parsedMonths === null ||
      !Number.isInteger(parsedMonths) ||
      parsedMonths < 1 ||
      parsedMonths > MAX_DEPOSIT_MONTHS
    ) {
      nextErrors.months = copy.errorTenure;
    }
    if (rate === null || rate < 0) nextErrors.rate = copy.errorDepositRate;
    const parsedTarget = parseNumber(target);
    if (mode === 'maturity' && (parsedInstalment === null || parsedInstalment <= 0)) {
      nextErrors.instalment = copy.errorAmount;
    }
    if (mode === 'goal' && (parsedTarget === null || parsedTarget <= 0)) {
      nextErrors.target = copy.errorTarget;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || parsedMonths === null || rate === null) {
      setOutcome(null);
      return;
    }
    const taxPercent = bankSourceTaxPercent(hasTin);
    if (mode === 'maturity' && parsedInstalment !== null) {
      const gross = dpsMaturity(parsedInstalment, rate, parsedMonths);
      if (gross === null) return setOutcome(null);
      const contributed = parsedInstalment * parsedMonths;
      setOutcome({
        net: netOfTax(gross, contributed, taxPercent),
        contributed,
        sourceText: depositSourceText(copy, formatters, rate, preset.selectedProduct, row),
      });
    } else if (mode === 'goal' && parsedTarget !== null) {
      const required = dpsInstalmentForTarget(parsedTarget, rate, parsedMonths);
      if (required === null) return setOutcome(null);
      const contributed = required * parsedMonths;
      setOutcome({
        net: netOfTax(parsedTarget, contributed, taxPercent),
        contributed,
        requiredInstalment: required,
        sourceText: depositSourceText(copy, formatters, rate, preset.selectedProduct, row),
      });
    }
    analytics.track(ANALYTICS_EVENTS.calculatorUse);
  };

  return (
    <section aria-labelledby="dps-heading">
      <h2 id="dps-heading">{copy.dpsHeading}</h2>
      <p className="calculators-tool-intro">{copy.dpsIntro}</p>
      <div className="calculators-tabs" role="tablist" aria-label={copy.dpsHeading}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'maturity'}
          className={`calculators-tab${mode === 'maturity' ? ' calculators-tab-active' : ''}`}
          onClick={() => setMode('maturity')}
        >
          {copy.dpsModeMaturity}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'goal'}
          className={`calculators-tab${mode === 'goal' ? ' calculators-tab-active' : ''}`}
          onClick={() => setMode('goal')}
        >
          {copy.dpsModeGoal}
        </button>
      </div>
      <form className="calculators-form" onSubmit={handleSubmit} noValidate>
        <DepositRateFields
          idPrefix="dps"
          products={products}
          selection={preset.selection}
          onSelectionChange={preset.setSelection}
          customRate={customRate}
          onCustomRateChange={setCustomRate}
          showCustomRate={needsCustomRate}
          noRateProductName={noRateProductName}
          rateError={errors.rate ?? null}
          copy={copy}
        />
        {mode === 'maturity' ? (
          <div className="calculators-field">
            <label htmlFor="dps-instalment">{copy.dpsInstalmentLabel}</label>
            <input
              id="dps-instalment"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={instalment}
              onChange={event => setInstalment(event.target.value)}
              aria-invalid={errors.instalment ? true : undefined}
            />
            {errors.instalment && (
              <p className="field-error" role="alert">
                {errors.instalment}
              </p>
            )}
          </div>
        ) : (
          <div className="calculators-field">
            <label htmlFor="dps-target">{copy.dpsTargetLabel}</label>
            <input
              id="dps-target"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={target}
              onChange={event => setTarget(event.target.value)}
              aria-invalid={errors.target ? true : undefined}
            />
            {errors.target && (
              <p className="field-error" role="alert">
                {errors.target}
              </p>
            )}
          </div>
        )}
        <div className="calculators-field">
          <label htmlFor="dps-months">{copy.dpsMonthsLabel}</label>
          <input
            id="dps-months"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={months}
            onChange={event => setMonths(event.target.value)}
            aria-invalid={errors.months ? true : undefined}
          />
          {errors.months && (
            <p className="field-error" role="alert">
              {errors.months}
            </p>
          )}
        </div>
        <label className="calculators-checkbox">
          <input
            type="checkbox"
            checked={hasTin}
            onChange={event => setHasTin(event.target.checked)}
          />
          {copy.hasTinLabel}
        </label>
        <button type="submit" className="calculate-button">
          {copy.calculateDps}
        </button>
      </form>
      {outcome && (
        <div className="calculators-result" aria-live="polite">
          <h3>{copy.resultsHeading}</h3>
          <p className="calculators-apr-source">{outcome.sourceText}</p>
          <dl className="calculators-metrics">
            {outcome.requiredInstalment !== undefined && (
              <div>
                <dt>{copy.dpsRequiredInstalment}</dt>
                <dd>{formatters.money(outcome.requiredInstalment)}</dd>
              </div>
            )}
            <div>
              <dt>{copy.dpsContributed}</dt>
              <dd>{formatters.money(outcome.contributed)}</dd>
            </div>
            <div>
              <dt>{copy.dpsGross}</dt>
              <dd>{formatters.money(outcome.net.grossMaturity)}</dd>
            </div>
            <div>
              <dt>{copy.fdTax}</dt>
              <dd>{formatters.money(outcome.net.sourceTax)}</dd>
            </div>
            <div>
              <dt>{copy.fdNet}</dt>
              <dd>{formatters.money(outcome.net.netMaturity)}</dd>
            </div>
          </dl>
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
  const [depositProducts, setDepositProducts] = useState<DepositProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Deposit presets are optional chrome for the FD/DPS tools: a failure
    // here must not block the card calculators, so errors just leave the
    // preset lists empty (the tools still work with a custom rate).
    fetchAllPages(page => getDepositProducts({ page, pageSize: 100 }))
      .then(all => {
        if (!cancelled) setDepositProducts(all.results.filter(p => !p.isBenchmark));
      })
      .catch(() => {
        if (!cancelled) setDepositProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'fd'}
              className={`calculators-tab${tab === 'fd' ? ' calculators-tab-active' : ''}`}
              onClick={() => setTab('fd')}
            >
              {copy.tabFd}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'dps'}
              className={`calculators-tab${tab === 'dps' ? ' calculators-tab-active' : ''}`}
              onClick={() => setTab('dps')}
            >
              {copy.tabDps}
            </button>
          </div>

          <section className="calculator-form-section">
            {tab === 'emi' && (
              <EmiTool cards={cards} copy={copy} common={common} formatters={formatters} />
            )}
            {tab === 'payoff' && (
              <PayoffTool cards={cards} copy={copy} common={common} formatters={formatters} />
            )}
            {tab === 'fd' && (
              <FdTool
                products={depositProducts.filter(p => p.kind !== 'dps')}
                copy={copy}
                formatters={formatters}
              />
            )}
            {tab === 'dps' && (
              <DpsTool
                products={depositProducts.filter(p => p.kind === 'dps')}
                copy={copy}
                formatters={formatters}
              />
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
