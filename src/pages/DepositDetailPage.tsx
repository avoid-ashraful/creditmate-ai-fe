import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { toBanglaNumerals, useLanguage } from '../locales';
import { DepositsCopy, getDepositsCopy } from '../locales/deposits';
import {
  ApiError,
  DepositHistoryEntry,
  DepositProductDetail,
  DepositRate,
  getDepositFieldHistory,
  getDepositProduct,
} from '../services/deposits';

import './DepositsPage.css';

interface Formatters {
  money: (value: number) => string;
  rate: (value: number) => string;
  count: (value: number) => string;
}

const tenureText = (rate: DepositRate, copy: DepositsCopy, formatters: Formatters): string => {
  const max = rate.tenureMonthsMax;
  if (rate.tenureIsOpenEnded || max === null) {
    return `${formatters.count(rate.tenureMonthsMin)}${copy.openEndedSuffix} ${copy.monthsUnit}`;
  }
  if (max === rate.tenureMonthsMin) {
    return `${formatters.count(rate.tenureMonthsMin)} ${copy.monthsUnit}`;
  }
  return `${formatters.count(rate.tenureMonthsMin)}–${formatters.count(max)} ${copy.monthsUnit}`;
};

const slabText = (rate: DepositRate, copy: DepositsCopy, formatters: Formatters): string => {
  const min = formatters.money(rate.amountMin);
  if (rate.amountMax === null) return `${min}${copy.andAboveSuffix}`;
  if (rate.amountMax === rate.amountMin) return min;
  return `${min} – ${formatters.money(rate.amountMax)}`;
};

const rateValueText = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    const record = value as { rate_min?: string; rate_max?: string };
    if (record.rate_min !== undefined && record.rate_max !== undefined) {
      return record.rate_min === record.rate_max
        ? `${record.rate_min}%`
        : `${record.rate_min}–${record.rate_max}%`;
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const historyFieldLabel = (entry: DepositHistoryEntry, copy: DepositsCopy): string => {
  const match = /^rate_(\d+)_(\d+|open)$/.exec(entry.fieldName);
  if (match) {
    const range =
      match[2] === 'open'
        ? `${match[1]}+`
        : match[1] === match[2]
        ? match[1]
        : `${match[1]}–${match[2]}`;
    return `${copy.historyRateChange} (${range} ${copy.monthsUnit})`;
  }
  return entry.fieldName;
};

const HistorySection: React.FC<{
  slug: string;
  copy: DepositsCopy;
}> = ({ slug, copy }) => {
  const { status: authStatus } = useAuth();
  const [entries, setEntries] = useState<DepositHistoryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    let cancelled = false;
    getDepositFieldHistory(slug)
      .then(history => {
        if (!cancelled) setEntries(history);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setNeedsLogin(true);
          return;
        }
        setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus, slug]);

  const showLoginPrompt = authStatus !== 'authenticated' || needsLogin;

  return (
    <section className="deposits-history" aria-labelledby="deposit-history-heading">
      <h2 id="deposit-history-heading">{copy.historyHeading}</h2>
      <p>{copy.historyIntro}</p>
      {showLoginPrompt && (
        <p className="deposits-login-prompt">
          {copy.historyLoginPrompt} <Link to="/login">{copy.historyLoginLink}</Link>
        </p>
      )}
      {failed && <p role="alert">{copy.historyError}</p>}
      {entries !== null && entries.length === 0 && <p>{copy.historyEmpty}</p>}
      {entries !== null && entries.length > 0 && (
        <ul className="deposits-history-list">
          {entries.map(entry => (
            <li key={entry.id}>
              <span className="deposits-history-field">{historyFieldLabel(entry, copy)}</span>
              <span>
                {rateValueText(entry.oldValue)} → {rateValueText(entry.newValue)}
              </span>
              <time dateTime={entry.changedAt.toISOString()}>
                {entry.changedAt.toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const DepositDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const copy = getDepositsCopy(lang);
  const isBn = lang === 'bn';
  const [product, setProduct] = useState<DepositProductDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useSeoMeta({
    title: product
      ? `${product.name} — ${product.institutionDisplayName} | CreditMate AI`
      : copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: slug ? `/deposits/${slug}` : '/deposits',
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getDepositProduct(slug)
      .then(detail => {
        if (!cancelled) setProduct(detail);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

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

  if (failed) {
    return (
      <div className="deposits-page">
        <p role="alert">{copy.detailLoadError}</p>
        <Link to="/deposits">{copy.backToDeposits}</Link>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="deposits-page">
        <p role="status">{copy.loading}</p>
      </div>
    );
  }

  return (
    <div className="deposits-page deposits-detail">
      <Link to="/deposits" className="deposits-back">
        ← {copy.backToDeposits}
      </Link>
      <h1>{product.name}</h1>
      <p className="deposits-detail-bank">
        {product.institutionDisplayName}
        {product.isIslamic && <span className="deposits-badge">{copy.islamicBadge}</span>}
        {product.isBenchmark && <span className="deposits-badge">{copy.benchmarkBadge}</span>}
      </p>

      <dl className="deposits-facts">
        {product.minInstalment !== null && (
          <div>
            <dt>{copy.instalmentRangeLabel}</dt>
            <dd>
              {formatters.money(product.minInstalment)}
              {product.maxInstalment !== null && ` – ${formatters.money(product.maxInstalment)}`}
            </dd>
          </div>
        )}
        {product.loanAgainstPercent !== null && (
          <div>
            <dt>{copy.loanAgainstLabel}</dt>
            <dd>
              {copy.loanAgainstValue.replace(
                '{percent}',
                formatters.rate(product.loanAgainstPercent)
              )}
            </dd>
          </div>
        )}
      </dl>

      <section aria-labelledby="deposit-rates-heading">
        <h2 id="deposit-rates-heading">{copy.detailRatesHeading}</h2>
        <div className="deposits-table-wrap">
          <table className="deposits-table">
            <thead>
              <tr>
                <th scope="col">{copy.detailTenureCol}</th>
                <th scope="col">{copy.detailSlabCol}</th>
                <th scope="col">
                  {product.rateType === 'expected_profit'
                    ? copy.expectedProfitLabel
                    : copy.detailRateCol}
                </th>
              </tr>
            </thead>
            <tbody>
              {product.rates.map(rate => (
                <tr key={rate.id}>
                  <td>{tenureText(rate, copy, formatters)}</td>
                  <td>{slabText(rate, copy, formatters)}</td>
                  <td>
                    {rate.isRange
                      ? `${formatters.rate(rate.rateMin)}–${formatters.rate(rate.rateMax)}%`
                      : `${formatters.rate(rate.rateMax)}%`}
                    {rate.isDerived && (
                      <span className="deposits-badge deposits-badge-derived">
                        {copy.derivedRateBadge}
                      </span>
                    )}
                    {rate.note && <span className="deposits-rate-note">{rate.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {product.prematureEncashmentTerms && (
        <section>
          <h2>{copy.encashmentHeading}</h2>
          <p>{product.prematureEncashmentTerms}</p>
        </section>
      )}
      {product.eligibilityNotes && (
        <section>
          <h2>{copy.eligibilityHeading}</h2>
          <p>{product.eligibilityNotes}</p>
        </section>
      )}

      <section className="deposits-provenance">
        <h2>{copy.provenanceHeading}</h2>
        <dl className="deposits-facts">
          <div>
            <dt>{copy.sourceLabel}</dt>
            <dd>
              {product.sourceUrl ? (
                <a href={product.sourceUrl} target="_blank" rel="noreferrer">
                  {product.sourceUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          {product.rateEffectiveDate && (
            <div>
              <dt>{copy.rateEffectiveLabel}</dt>
              <dd>{product.rateEffectiveDate}</dd>
            </div>
          )}
          {product.verifiedAt && (
            <div>
              <dt>{copy.verifiedLabel}</dt>
              <dd>{new Date(product.verifiedAt).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
      </section>

      <HistorySection slug={product.slug} copy={copy} />
    </div>
  );
};

export default DepositDetailPage;
