import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { fillCopy, toBanglaNumerals, useLanguage } from '../locales';
import { DepositsCopy, getDepositsCopy } from '../locales/deposits';
import {
  DepositProduct,
  DepositScenarioResponse,
  DepositScenarioResult,
  getDepositProducts,
  runDepositScenario,
} from '../services/deposits';
import { fetchAllPages } from '../utils/fetchAllPages';

import './DepositsPage.css';

type ScenarioKind = 'fdr' | 'dps';

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

const rateText = (result: DepositScenarioResult, formatters: Formatters): string =>
  result.isRange
    ? `${formatters.rate(result.rateMin)}–${formatters.rate(result.rateMax)}%`
    : `${formatters.rate(result.rateMax)}%`;

const ResultTable: React.FC<{
  rows: DepositScenarioResult[];
  copy: DepositsCopy;
  formatters: Formatters;
}> = ({ rows, copy, formatters }) => (
  <div className="deposits-table-wrap">
    <table className="deposits-table">
      <thead>
        <tr>
          <th scope="col">{copy.colBank}</th>
          <th scope="col">{copy.colProduct}</th>
          <th scope="col">{copy.colRate}</th>
          <th scope="col">{copy.colGross}</th>
          <th scope="col">{copy.colTax}</th>
          <th scope="col">{copy.colNet}</th>
          <th scope="col" aria-label={copy.viewDetails} />
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.product.id}>
            <td>{row.product.institutionDisplayName}</td>
            <td>
              {row.product.name}
              {row.product.isIslamic && <span className="deposits-badge">{copy.islamicBadge}</span>}
              {row.product.isBenchmark && (
                <span className="deposits-badge">{copy.benchmarkBadge}</span>
              )}
              {row.rateIsDerived && (
                <span className="deposits-badge deposits-badge-derived">
                  {copy.derivedRateBadge}
                </span>
              )}
            </td>
            <td>
              {rateText(row, formatters)}
              <span className="deposits-rate-kind">
                {row.product.rateType === 'expected_profit'
                  ? copy.expectedProfitLabel
                  : copy.interestLabel}
              </span>
              {row.isRange && <span className="deposits-rate-kind">{copy.rateRangeNote}</span>}
            </td>
            <td>{formatters.money(row.grossMaturity)}</td>
            <td>{formatters.money(row.sourceTax)}</td>
            <td className="deposits-net">{formatters.money(row.netMaturity)}</td>
            <td>
              <Link to={`/deposits/${row.product.slug}`}>{copy.viewDetails}</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DepositsPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getDepositsCopy(lang);
  const isBn = lang === 'bn';
  useSeoMeta({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: '/deposits',
  });

  const [kind, setKind] = useState<ScenarioKind>('fdr');
  const [amount, setAmount] = useState<string>('500000');
  const [instalment, setInstalment] = useState<string>('5000');
  const [months, setMonths] = useState<string>('12');
  const [hasTin, setHasTin] = useState<boolean>(true);
  const [islamicOnly, setIslamicOnly] = useState<boolean>(false);
  const [bank, setBank] = useState<string>('');
  const [products, setProducts] = useState<DepositProduct[]>([]);
  const [errors, setErrors] = useState<{ amount?: string; months?: string }>({});
  const [scenario, setScenario] = useState<DepositScenarioResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(page => getDepositProducts({ page, pageSize: 100 }))
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
    products.forEach(product => {
      if (product.bank !== null && product.bankName) seen.set(product.bank, product.bankName);
    });
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
    const parsedMonths = parseNumber(months);
    const nextErrors: typeof errors = {};
    if (parsedMonths === null || !Number.isInteger(parsedMonths) || parsedMonths < 1) {
      nextErrors.months = copy.errorMonths;
    }
    let parsedAmount: number | null = null;
    let parsedInstalment: number | null = null;
    if (kind === 'fdr') {
      parsedAmount = parseNumber(amount);
      if (parsedAmount === null || parsedAmount <= 0) nextErrors.amount = copy.errorAmount;
    } else {
      parsedInstalment = parseNumber(instalment);
      if (parsedInstalment === null || parsedInstalment <= 0) {
        nextErrors.amount = copy.errorInstalment;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || parsedMonths === null) return;

    setIsRunning(true);
    setRunError(null);
    try {
      const response = await runDepositScenario({
        kind,
        months: parsedMonths,
        hasTin,
        islamicOnly,
        bank: bank ? Number(bank) : undefined,
        ...(kind === 'fdr'
          ? { amount: parsedAmount as number }
          : { monthlyInstalment: parsedInstalment as number }),
      });
      setScenario(response);
    } catch (error) {
      console.error('Deposit scenario failed:', error);
      setRunError(copy.loadError);
      setScenario(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="deposits-page">
      <section className="deposits-hero">
        <h1>{copy.heading}</h1>
        <p>{copy.intro}</p>
      </section>

      <div className="deposits-tabs" role="tablist" aria-label={copy.heading}>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'fdr'}
          className={`deposits-tab${kind === 'fdr' ? ' deposits-tab-active' : ''}`}
          onClick={() => setKind('fdr')}
        >
          {copy.tabFdr}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'dps'}
          className={`deposits-tab${kind === 'dps' ? ' deposits-tab-active' : ''}`}
          onClick={() => setKind('dps')}
        >
          {copy.tabDps}
        </button>
      </div>

      <form className="deposits-form" onSubmit={handleSubmit} noValidate>
        {kind === 'fdr' ? (
          <div className="deposits-field">
            <label htmlFor="deposits-amount">{copy.amountLabel}</label>
            <input
              id="deposits-amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              aria-invalid={errors.amount ? true : undefined}
            />
          </div>
        ) : (
          <div className="deposits-field">
            <label htmlFor="deposits-instalment">{copy.instalmentLabel}</label>
            <input
              id="deposits-instalment"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={instalment}
              onChange={event => setInstalment(event.target.value)}
              aria-invalid={errors.amount ? true : undefined}
            />
          </div>
        )}
        {errors.amount && (
          <p className="field-error" role="alert">
            {errors.amount}
          </p>
        )}

        <div className="deposits-field">
          <label htmlFor="deposits-months">{copy.monthsLabel}</label>
          <input
            id="deposits-months"
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

        <div className="deposits-field">
          <label htmlFor="deposits-bank">{copy.bankLabel}</label>
          <select id="deposits-bank" value={bank} onChange={event => setBank(event.target.value)}>
            <option value="">{copy.allBanksOption}</option>
            {bankOptions.map(option => (
              <option key={option.id} value={String(option.id)}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <label className="deposits-checkbox">
          <input
            type="checkbox"
            checked={hasTin}
            onChange={event => setHasTin(event.target.checked)}
          />
          {copy.hasTinLabel}
        </label>
        <label className="deposits-checkbox">
          <input
            type="checkbox"
            checked={islamicOnly}
            onChange={event => setIslamicOnly(event.target.checked)}
          />
          {copy.islamicOnlyLabel}
        </label>

        <button type="submit" className="deposits-run" disabled={isRunning}>
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
          <section className="deposits-results">
            <h2>{copy.resultsHeading}</h2>
            {scenario.results.length > 0 ? (
              <ResultTable rows={scenario.results} copy={copy} formatters={formatters} />
            ) : (
              <p>{copy.noResults}</p>
            )}
            {scenario.excludedWithoutRate > 0 && (
              <p className="deposits-excluded">
                {fillCopy(copy.excludedNote, {
                  count: formatters.count(scenario.excludedWithoutRate),
                })}
              </p>
            )}
          </section>

          {scenario.benchmarks.length > 0 && (
            <section className="deposits-benchmarks">
              <h2>{copy.benchmarksHeading}</h2>
              <p className="deposits-benchmarks-note">{copy.benchmarksNote}</p>
              <ResultTable rows={scenario.benchmarks} copy={copy} formatters={formatters} />
            </section>
          )}

          <div className="assumptions-note">
            <h3>{copy.methodologyHeading}</h3>
            {scenario.notes.map(note => (
              <p key={note}>{note}</p>
            ))}
            <p>{copy.exciseNote}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositsPage;
