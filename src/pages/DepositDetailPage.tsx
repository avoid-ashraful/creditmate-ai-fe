import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { DetailSummary, Money, MoneyInput, TrustChip, VerdictStrip } from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { formatLocalizedDate, getDetailCopy, toBanglaNumerals, useLanguage } from '../locales';
import { DepositsCopy, getDepositsCopy } from '../locales/deposits';
import {
  DepositHistoryEntry,
  DepositProductDetail,
  DepositRate,
  DepositScenarioResult,
  getDepositFieldHistory,
  getDepositProduct,
  runDepositScenario,
} from '../services/deposits';

import './DepositsPage.css';
import '../styles/DecisionDetail.css';

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

/**
 * Rate-change history is public (redesign decision D1): everyone sees the
 * same dated record, signed in or not.
 */
const HistorySection: React.FC<{
  slug: string;
  copy: DepositsCopy;
}> = ({ slug, copy }) => {
  const [entries, setEntries] = useState<DepositHistoryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDepositFieldHistory(slug)
      .then(history => {
        if (!cancelled) setEntries(history);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <section className="deposits-history p2-section" aria-labelledby="deposit-history-heading">
      <h2 id="deposit-history-heading">{copy.historyHeading}</h2>
      <p>{copy.historyIntro}</p>
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

/**
 * Scenario carry-forward strip (redesign Phase 2): arriving from the
 * discovery scenario keeps the user's amount/instalment/term prefilled;
 * the figures come from the same scenario endpoint discovery uses — this
 * page never recomputes deposit maths itself.
 */
const ScenarioStrip: React.FC<{
  product: DepositProductDetail;
}> = ({ product }) => {
  const { lang } = useLanguage();
  const detail = getDetailCopy(lang);
  const [searchParams] = useSearchParams();
  const scenarioKind = product.kind === 'fdr' ? 'fdr' : 'dps';
  const [amount, setAmount] = useState<number | null>(() => {
    const value = Number(searchParams.get('amount'));
    return Number.isFinite(value) && value > 0 ? value : 500000;
  });
  const [instalment, setInstalment] = useState<number | null>(() => {
    const value = Number(searchParams.get('instalment'));
    return Number.isFinite(value) && value > 0 ? value : 5000;
  });
  const [months, setMonths] = useState<number>(() => {
    const value = Number(searchParams.get('months'));
    return Number.isFinite(value) && value > 0 ? value : 12;
  });
  const [hasTin] = useState<boolean>(() => searchParams.get('tin') !== '0');
  const [result, setResult] = useState<DepositScenarioResult | null>(null);
  const [responded, setResponded] = useState(false);
  const [failed, setFailed] = useState(false);
  const runTokenRef = useRef(0);

  useEffect(() => {
    const principal = scenarioKind === 'fdr' ? amount : instalment;
    if (!principal || principal <= 0 || !months || months <= 0) return;
    const token = ++runTokenRef.current;
    const timer = setTimeout(() => {
      runDepositScenario({
        kind: scenarioKind,
        amount: scenarioKind === 'fdr' ? principal : undefined,
        monthlyInstalment: scenarioKind === 'dps' ? principal : undefined,
        months,
        hasTin,
      })
        .then(response => {
          if (runTokenRef.current !== token) return;
          const mine = [...response.results, ...response.benchmarks].find(
            entry => entry.product.slug === product.slug
          );
          setResult(mine ?? null);
          setResponded(true);
          setFailed(false);
        })
        .catch(() => {
          if (runTokenRef.current !== token) return;
          setFailed(true);
          setResponded(true);
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [scenarioKind, amount, instalment, months, hasTin, product.slug]);

  return (
    <section className="p2-scenario" aria-labelledby="deposit-scenario-heading">
      <h2 id="deposit-scenario-heading">{detail.depositScenarioHeading}</h2>
      <div className="p2-scenario-inputs">
        {scenarioKind === 'fdr' ? (
          <MoneyInput label={detail.depositAmountLabel} value={amount} onValueChange={setAmount} />
        ) : (
          <MoneyInput
            label={detail.instalmentLabel}
            value={instalment}
            onValueChange={setInstalment}
          />
        )}
        <label>
          {detail.monthsLabel}
          <input
            type="number"
            min={1}
            max={360}
            value={months}
            onChange={event => setMonths(Number(event.target.value))}
          />
        </label>
      </div>
      {failed && <p role="alert">{detail.scenarioError}</p>}
      {!failed && responded && !result && <p>{detail.scenarioNotRanked}</p>}
      {!failed && result && (
        <dl className="p2-scenario-results">
          <div className="p2-scenario-result">
            <dt>{detail.grossMaturityLabel}</dt>
            <dd>
              <Money value={result.grossMaturity} decimals={2} />
            </dd>
          </div>
          <div className="p2-scenario-result">
            <dt>{detail.interestEarnedLabel}</dt>
            <dd>
              <Money value={result.interestEarned} decimals={2} />
            </dd>
          </div>
          <div className="p2-scenario-result">
            <dt>{detail.taxDeductedLabel}</dt>
            <dd>
              <Money value={result.sourceTax} decimals={2} />
            </dd>
          </div>
          <div className="p2-scenario-result">
            <dt>{detail.netMaturityLabel}</dt>
            <dd>
              <Money value={result.netMaturity} decimals={2} />
            </dd>
          </div>
          <div className="p2-scenario-result">
            <dt>{detail.effectiveYieldLabel}</dt>
            <dd>{result.effectiveYieldPercent}%</dd>
          </div>
        </dl>
      )}
    </section>
  );
};

const DepositDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const copy = getDepositsCopy(lang);
  const detail = getDetailCopy(lang);
  const isBn = lang === 'bn';
  const shortlist = useShortlist();
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

  const rateRange = useMemo(() => {
    if (!product || product.rates.length === 0) return null;
    const min = Math.min(...product.rates.map(rate => rate.rateMin));
    const max = Math.max(...product.rates.map(rate => rate.rateMax));
    return { min, max };
  }, [product]);

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

  const inShortlist = shortlist.isInShortlist('deposits', product.slug);
  const rateLabel =
    product.rateType === 'expected_profit' ? copy.expectedProfitLabel : copy.detailRateCol;
  const heroRate = rateRange
    ? rateRange.min === rateRange.max
      ? `${formatters.rate(rateRange.max)}%`
      : `${formatters.rate(rateRange.min)}–${formatters.rate(rateRange.max)}%`
    : '—';

  return (
    <div className="deposits-page deposits-detail p2-detail">
      <Link to="/deposits" className="deposits-back">
        ← {copy.backToDeposits}
      </Link>
      <header className="p2-detail-header">
        <h1>{product.name}</h1>
        <p className="deposits-detail-bank">
          {product.institutionDisplayName}
          {product.isIslamic && <span className="deposits-badge">{copy.islamicBadge}</span>}
          {product.isBenchmark && <span className="deposits-badge">{copy.benchmarkBadge}</span>}
        </p>
      </header>

      <div className="p2-detail-grid">
        <aside className="p2-detail-aside">
          <DetailSummary
            identity={{ bankName: product.institutionDisplayName, productName: product.name }}
            heroValue={heroRate}
            heroLabel={rateLabel}
            facts={[
              ...(product.minInstalment !== null
                ? [
                    {
                      label: copy.instalmentRangeLabel,
                      value: `${formatters.money(product.minInstalment)}${
                        product.maxInstalment !== null
                          ? ` – ${formatters.money(product.maxInstalment)}`
                          : ''
                      }`,
                    },
                  ]
                : []),
              ...(product.loanAgainstPercent !== null
                ? [
                    {
                      label: copy.loanAgainstLabel,
                      value: copy.loanAgainstValue.replace(
                        '{percent}',
                        formatters.rate(product.loanAgainstPercent)
                      ),
                    },
                  ]
                : []),
              ...(product.rateEffectiveDate
                ? [{ label: copy.rateEffectiveLabel, value: product.rateEffectiveDate }]
                : []),
            ]}
            trustChip={
              product.sourceUrl ? (
                <TrustChip
                  source={
                    <a href={product.sourceUrl} target="_blank" rel="noreferrer">
                      {copy.sourceLabel}
                    </a>
                  }
                  dateLabel={
                    product.verifiedAt
                      ? formatLocalizedDate(new Date(product.verifiedAt), lang)
                      : detail.trustChipUnverified
                  }
                />
              ) : undefined
            }
            actions={
              <button
                type="button"
                className="btn btn-primary"
                aria-pressed={inShortlist}
                onClick={() =>
                  shortlist.toggle({
                    vertical: 'deposits',
                    key: product.slug,
                    name: product.name,
                    bankName: product.institutionDisplayName,
                    detailHref: `/deposits/${product.slug}`,
                  })
                }
              >
                {inShortlist ? detail.inShortlist : detail.addToShortlist}
              </button>
            }
          />
        </aside>

        <div className="p2-detail-main">
          <VerdictStrip
            items={[
              { label: rateLabel, value: heroRate },
              {
                label: copy.detailTenureCol,
                value: formatters.count(product.rates.length),
              },
              ...(product.verifiedAt
                ? [
                    {
                      label: copy.verifiedLabel,
                      value: formatLocalizedDate(new Date(product.verifiedAt), lang),
                    },
                  ]
                : []),
            ]}
          />

          <ScenarioStrip product={product} />

          <section className="p2-section" aria-labelledby="deposit-rates-heading">
            <h2 id="deposit-rates-heading">{copy.detailRatesHeading}</h2>
            <div className="deposits-table-wrap">
              <table className="deposits-table">
                <thead>
                  <tr>
                    <th scope="col">{copy.detailTenureCol}</th>
                    <th scope="col">{copy.detailSlabCol}</th>
                    <th scope="col">{rateLabel}</th>
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
            <section className="p2-section">
              <h2>{copy.encashmentHeading}</h2>
              <p>{product.prematureEncashmentTerms}</p>
            </section>
          )}
          {product.eligibilityNotes && (
            <section className="p2-section">
              <h2>{copy.eligibilityHeading}</h2>
              <p>{product.eligibilityNotes}</p>
            </section>
          )}

          <section className="deposits-provenance p2-section">
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
      </div>
    </div>
  );
};

export default DepositDetailPage;
