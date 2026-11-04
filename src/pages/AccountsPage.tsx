import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { fillCopy, toBanglaNumerals, useLanguage } from '../locales';
import { AccountsCopy, getAccountsCopy, segmentLabel } from '../locales/accounts';
import {
  AccountProduct,
  AccountScenarioResponse,
  AccountScenarioResult,
  AccountSegment,
  AccountType,
  getAccountProducts,
  runAccountScenario,
} from '../services/bankAccounts';
import { fetchAllPages } from '../utils/fetchAllPages';

import './AccountsPage.css';

const BALANCE_PRESETS = [10000, 50000, 100000, 300000, 1000000];

const SEGMENT_OPTIONS: AccountSegment[] = [
  'general',
  'women',
  'student',
  'senior',
  'salary',
  'nrb',
  'digital',
  'minor',
  'inclusion',
  'premium',
];

const parseNumber = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

interface Formatters {
  money: (value: number) => string;
  rate: (value: number) => string;
  count: (value: number) => string;
}

const feeCell = (value: number | null, formatters: Formatters, copy: AccountsCopy): string =>
  value === null ? copy.notPublished : formatters.money(value);

const rateText = (result: AccountScenarioResult, formatters: Formatters): string =>
  result.isRange && result.rateMax !== null
    ? `${formatters.rate(result.rate)}–${formatters.rate(result.rateMax)}%`
    : `${formatters.rate(result.rate)}%`;

const ResultTable: React.FC<{
  rows: AccountScenarioResult[];
  copy: AccountsCopy;
  formatters: Formatters;
}> = ({ rows, copy, formatters }) => (
  <div className="accounts-table-wrap">
    <table className="accounts-table">
      <thead>
        <tr>
          <th scope="col">{copy.colBank}</th>
          <th scope="col">{copy.colProduct}</th>
          <th scope="col">{copy.colRate}</th>
          <th scope="col">{copy.colInterest}</th>
          <th scope="col">{copy.colMaintenance}</th>
          <th scope="col">{copy.colCard}</th>
          <th scope="col">{copy.colSms}</th>
          <th scope="col">{copy.colOnline}</th>
          <th scope="col">{copy.colNet}</th>
          <th scope="col" aria-label={copy.viewDetails} />
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.product.id}>
            <td>{row.product.bank.name}</td>
            <td>
              {row.product.name}
              {row.product.isIslamic && <span className="accounts-badge">{copy.islamicBadge}</span>}
              {row.product.segment !== 'general' && (
                <span className="accounts-badge">{segmentLabel(copy, row.product.segment)}</span>
              )}
              {!row.feesComplete && (
                <span className="accounts-badge accounts-badge-partial">
                  {copy.partialFeesBadge}
                </span>
              )}
              {row.waiversApplied.length > 0 && (
                <span className="accounts-badge accounts-badge-waived">{copy.waivedNote}</span>
              )}
            </td>
            <td>
              {rateText(row, formatters)}
              <span className="accounts-rate-kind">
                {row.product.rateType === 'expected_profit'
                  ? copy.expectedProfitLabel
                  : copy.interestLabel}
              </span>
              {row.isRange && <span className="accounts-rate-kind">{copy.rateRangeNote}</span>}
            </td>
            <td>{formatters.money(row.interestEarned)}</td>
            <td>{feeCell(row.maintenanceFeeAnnual, formatters, copy)}</td>
            <td>{feeCell(row.debitCardFeeAnnual, formatters, copy)}</td>
            <td>{feeCell(row.smsFeeAnnual, formatters, copy)}</td>
            <td>{feeCell(row.onlineBankingFeeAnnual, formatters, copy)}</td>
            <td className="accounts-net">
              {row.netAnnualValue === null ? '—' : formatters.money(row.netAnnualValue)}
            </td>
            <td>
              <Link to={`/accounts/${row.product.slug}`}>{copy.viewDetails}</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AccountsPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAccountsCopy(lang);
  const isBn = lang === 'bn';
  useSeoMeta({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: '/accounts',
  });

  const [accountType, setAccountType] = useState<AccountType>('savings');
  const [balance, setBalance] = useState<string>('50000');
  const [islamicOnly, setIslamicOnly] = useState<boolean>(false);
  const [bank, setBank] = useState<string>('');
  const [segment, setSegment] = useState<string>('');
  const [products, setProducts] = useState<AccountProduct[]>([]);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<AccountScenarioResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(page => getAccountProducts({ page, pageSize: 100, includeVariants: true }))
      .then(all => {
        if (!cancelled) setProducts(all.results);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bankOptions = useMemo(() => {
    const seen = new Map<number, string>();
    products.forEach(product => seen.set(product.bank.id, product.bank.name));
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const formatters: Formatters = {
    money: (value: number) => {
      const text = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return isBn ? `৳${toBanglaNumerals(text)}` : `BDT ${text}`;
    },
    rate: (value: number) => (isBn ? toBanglaNumerals(String(value)) : String(value)),
    count: (value: number) => (isBn ? toBanglaNumerals(String(value)) : String(value)),
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedBalance = parseNumber(balance);
    if (parsedBalance === null || parsedBalance < 0) {
      setBalanceError(copy.errorBalance);
      return;
    }
    setBalanceError(null);
    setIsRunning(true);
    setRunError(null);
    try {
      const response = await runAccountScenario({
        averageBalance: parsedBalance,
        accountType,
        islamicOnly,
        bank: bank ? Number(bank) : undefined,
        segments: segment ? [segment as AccountSegment] : undefined,
      });
      setScenario(response);
    } catch (error) {
      console.error('Account scenario failed:', error);
      setRunError(copy.loadError);
      setScenario(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="accounts-page">
      <section className="accounts-hero">
        <h1>{copy.heading}</h1>
        <p>{copy.intro}</p>
      </section>

      <aside className="accounts-explainer">
        <h2>{copy.explainerHeading}</h2>
        <p>{copy.explainerBody}</p>
      </aside>

      <div className="accounts-tabs" role="tablist" aria-label={copy.heading}>
        <button
          type="button"
          role="tab"
          aria-selected={accountType === 'savings'}
          className={`accounts-tab${accountType === 'savings' ? ' accounts-tab-active' : ''}`}
          onClick={() => setAccountType('savings')}
        >
          {copy.tabSavings}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={accountType === 'current'}
          className={`accounts-tab${accountType === 'current' ? ' accounts-tab-active' : ''}`}
          onClick={() => setAccountType('current')}
        >
          {copy.tabCurrent}
        </button>
      </div>

      <form className="accounts-form" onSubmit={handleSubmit} noValidate>
        <div className="accounts-field">
          <label htmlFor="accounts-balance">{copy.balanceLabel}</label>
          <input
            id="accounts-balance"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={balance}
            onChange={event => setBalance(event.target.value)}
            aria-invalid={balanceError ? true : undefined}
          />
          <div className="accounts-presets">
            <span>{copy.balancePresetsLabel}</span>
            {BALANCE_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                className="accounts-preset"
                onClick={() => setBalance(String(preset))}
              >
                {formatters.money(preset)}
              </button>
            ))}
          </div>
          {balanceError && (
            <p className="field-error" role="alert">
              {balanceError}
            </p>
          )}
        </div>

        <div className="accounts-field">
          <label htmlFor="accounts-bank">{copy.bankLabel}</label>
          <select id="accounts-bank" value={bank} onChange={event => setBank(event.target.value)}>
            <option value="">{copy.allBanksOption}</option>
            {bankOptions.map(option => (
              <option key={option.id} value={String(option.id)}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="accounts-field">
          <label htmlFor="accounts-segment">{copy.segmentLabel}</label>
          <select
            id="accounts-segment"
            value={segment}
            onChange={event => setSegment(event.target.value)}
          >
            <option value="">{copy.allSegmentsOption}</option>
            {SEGMENT_OPTIONS.map(option => (
              <option key={option} value={option}>
                {segmentLabel(copy, option)}
              </option>
            ))}
          </select>
        </div>

        <label className="accounts-checkbox">
          <input
            type="checkbox"
            checked={islamicOnly}
            onChange={event => setIslamicOnly(event.target.checked)}
          />
          {copy.islamicOnlyLabel}
        </label>

        <button type="submit" className="accounts-run" disabled={isRunning}>
          {isRunning ? copy.loading : copy.runScenario}
        </button>
      </form>

      {runError && (
        <div className="error-state" role="alert">
          {runError}
        </div>
      )}

      {scenario && (
        <div aria-live="polite">
          <section className="accounts-results">
            <h2>{copy.resultsHeading}</h2>
            {scenario.results.length > 0 ? (
              <ResultTable rows={scenario.results} copy={copy} formatters={formatters} />
            ) : (
              <p>{copy.noResults}</p>
            )}
            {scenario.excludedWithoutRate > 0 && (
              <p className="accounts-excluded">
                {fillCopy(copy.excludedNote, {
                  count: formatters.count(scenario.excludedWithoutRate),
                })}
              </p>
            )}
          </section>

          {scenario.segmentExcluded.length > 0 && (
            <section className="accounts-segment-excluded">
              <h2>{copy.segmentExcludedHeading}</h2>
              <p className="accounts-section-note">{copy.segmentExcludedNote}</p>
              <ResultTable rows={scenario.segmentExcluded} copy={copy} formatters={formatters} />
            </section>
          )}

          {scenario.unrankedWithoutFees.length > 0 && (
            <section className="accounts-unranked">
              <h2>{copy.unrankedHeading}</h2>
              <p className="accounts-section-note">{copy.unrankedNote}</p>
              <ResultTable
                rows={scenario.unrankedWithoutFees}
                copy={copy}
                formatters={formatters}
              />
            </section>
          )}

          <div className="assumptions-note">
            <h3>{copy.methodologyHeading}</h3>
            {scenario.notes.map(note => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
