import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { ReviewsSection } from '../components/ReviewsSection';
import { DetailSummary, Money, MoneyInput, TrustChip, VerdictStrip } from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import {
  fillCopy,
  formatLocalizedDate,
  getDetailCopy,
  toBanglaNumerals,
  useLanguage,
} from '../locales';
import {
  AccountsCopy,
  basisLabel,
  getAccountsCopy,
  payoutLabel,
  segmentLabel,
} from '../locales/accounts';
import {
  AccountHistoryEntry,
  AccountProductDetail,
  AccountScenarioResult,
  getAccountFieldHistory,
  getAccountProduct,
  runAccountScenario,
} from '../services/bankAccounts';

import './AccountsPage.css';
import '../styles/DecisionDetail.css';

interface Formatters {
  money: (value: number) => string;
  plainMoney: (value: number) => string;
  rate: (value: number) => string;
  count: (value: number) => string;
}

const feeText = (value: number | null, formatters: Formatters, copy: AccountsCopy): string =>
  value === null ? copy.notPublished : formatters.money(value);

const slabBandText = (
  min: number,
  max: number | null,
  formatters: Formatters,
  copy: AccountsCopy
): string => {
  const low = formatters.plainMoney(min);
  if (max === null) return `${low}${copy.andAboveSuffix}`;
  return `${low} – ${formatters.plainMoney(max)}`;
};

const historyValueText = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/**
 * Rate/fee-change history is public (redesign decision D1): everyone sees
 * the same dated record, signed in or not.
 */
const HistorySection: React.FC<{
  slug: string;
  copy: AccountsCopy;
}> = ({ slug, copy }) => {
  const [entries, setEntries] = useState<AccountHistoryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAccountFieldHistory(slug)
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
    <section className="accounts-history p2-section" aria-labelledby="account-history-heading">
      <h2 id="account-history-heading">{copy.historyHeading}</h2>
      <p>{copy.historyIntro}</p>
      {failed && <p role="alert">{copy.historyError}</p>}
      {entries !== null && entries.length === 0 && <p>{copy.historyEmpty}</p>}
      {entries !== null && entries.length > 0 && (
        <ul className="accounts-history-list">
          {entries.map(entry => (
            <li key={entry.id}>
              <span className="accounts-history-field">{entry.fieldName}</span>
              <span>
                {historyValueText(entry.oldValue)} → {historyValueText(entry.newValue)}
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
 * Scenario carry-forward strip (redesign Phase 2): the balance from the
 * discovery scenario arrives prefilled; the net-value figures come from
 * the same scenario endpoint discovery uses. A product the endpoint
 * cannot rank (fees not fully published) shows no invented figure.
 */
const AccountScenarioStrip: React.FC<{
  product: AccountProductDetail;
}> = ({ product }) => {
  const { lang } = useLanguage();
  const detail = getDetailCopy(lang);
  const [searchParams] = useSearchParams();
  const [balance, setBalance] = useState<number | null>(() => {
    const value = Number(searchParams.get('balance'));
    return Number.isFinite(value) && value > 0 ? value : 50000;
  });
  const [result, setResult] = useState<AccountScenarioResult | null>(null);
  const [responded, setResponded] = useState(false);
  const [failed, setFailed] = useState(false);
  const runTokenRef = useRef(0);

  useEffect(() => {
    if (!balance || balance <= 0) return;
    const token = ++runTokenRef.current;
    const timer = setTimeout(() => {
      runAccountScenario({ averageBalance: balance, accountType: product.accountType })
        .then(response => {
          if (runTokenRef.current !== token) return;
          const mine = [
            ...response.results,
            ...response.segmentExcluded,
            ...response.unrankedWithoutFees,
          ].find(entry => entry.product.slug === product.slug);
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
  }, [balance, product.accountType, product.slug]);

  return (
    <section className="p2-scenario" aria-labelledby="account-scenario-heading">
      <h2 id="account-scenario-heading">{detail.accountScenarioHeading}</h2>
      <div className="p2-scenario-inputs">
        <MoneyInput label={detail.balanceLabel} value={balance} onValueChange={setBalance} />
      </div>
      {failed && <p role="alert">{detail.scenarioError}</p>}
      {!failed && responded && (!result || result.netAnnualValue === null) && (
        <p>{detail.scenarioNotRanked}</p>
      )}
      {!failed && result && result.netAnnualValue !== null && (
        <dl className="p2-scenario-results">
          <div className="p2-scenario-result">
            <dt>{detail.netAnnualValueLabel}</dt>
            <dd>
              <Money value={result.netAnnualValue} decimals={2} />
            </dd>
          </div>
          <div className="p2-scenario-result">
            <dt>{detail.interestAtBalanceLabel}</dt>
            <dd>
              <Money value={result.interestEarned} decimals={2} />
            </dd>
          </div>
          {result.totalFees !== null && (
            <div className="p2-scenario-result">
              <dt>{detail.feesPerYearLabel}</dt>
              <dd>
                <Money value={result.totalFees} decimals={2} />
              </dd>
            </div>
          )}
        </dl>
      )}
      {result?.basisNote && <p className="p2-section-note">{result.basisNote}</p>}
    </section>
  );
};

const AccountDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const copy = getAccountsCopy(lang);
  const detail = getDetailCopy(lang);
  const shortlist = useShortlist();
  const isBn = lang === 'bn';
  const [product, setProduct] = useState<AccountProductDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useSeoMeta({
    title: product ? `${product.name} — ${product.bank.name} | CreditMate AI` : copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: slug ? `/accounts/${slug}` : '/accounts',
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getAccountProduct(slug)
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
    plainMoney: (value: number) => {
      const text = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
      return isBn ? toBanglaNumerals(text) : text;
    },
    rate: (value: number) => (isBn ? toBanglaNumerals(String(value)) : String(value)),
    count: (value: number) => (isBn ? toBanglaNumerals(String(value)) : String(value)),
  };

  if (failed) {
    return (
      <div className="accounts-page">
        <p role="alert">{copy.detailLoadError}</p>
        <Link to="/accounts">{copy.backToAccounts}</Link>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="accounts-page">
        <p role="status">{copy.loading}</p>
      </div>
    );
  }

  const feeRows: { label: string; value: string }[] = [
    {
      label: copy.feeCardLabel,
      value: product.debitCardIncluded
        ? feeText(product.debitCardFeeAnnual, formatters, copy)
        : copy.noDebitCardLabel,
    },
    ...(product.debitCardFirstYearFee !== null
      ? [
          {
            label: copy.feeCardFirstYearLabel,
            value: formatters.money(product.debitCardFirstYearFee),
          },
        ]
      : []),
    ...(product.debitCardReplacementFee !== null
      ? [
          {
            label: copy.feeCardReplacementLabel,
            value: formatters.money(product.debitCardReplacementFee),
          },
        ]
      : []),
    { label: copy.feeSmsLabel, value: feeText(product.smsFeeAnnual, formatters, copy) },
    {
      label: copy.feeOnlineLabel,
      value: feeText(product.onlineBankingFeeAnnual, formatters, copy),
    },
    {
      label: copy.feeChequeLabel,
      value: product.chequeBookAvailable
        ? product.chequePerLeaf === null
          ? copy.notPublished
          : `${formatters.money(product.chequePerLeaf)}${copy.perLeafSuffix}${
              product.chequeFirstBookFree ? ` · ${copy.feeChequeFirstBookFree}` : ''
            }`
        : '—',
    },
    { label: copy.feeClosureLabel, value: feeText(product.closureFee, formatters, copy) },
    ...(product.statementDuplicateFee !== null
      ? [
          {
            label: copy.feeStatementDuplicateLabel,
            value: formatters.money(product.statementDuplicateFee),
          },
        ]
      : []),
    ...(product.balanceConfirmationExtraFee !== null
      ? [
          {
            label: copy.feeBalanceConfirmationLabel,
            value: formatters.money(product.balanceConfirmationExtraFee),
          },
        ]
      : []),
  ];

  const inShortlist = shortlist.isInShortlist('accounts', product.slug);
  // Slabs are never collapsed to a single headline rate: the summary
  // shows the full published range across balance bands.
  const rateRangeText =
    product.rateSlabs.length > 0
      ? (() => {
          const low = Math.min(...product.rateSlabs.map(slab => slab.rate));
          const high = Math.max(...product.rateSlabs.map(slab => slab.rateMax ?? slab.rate));
          return low === high
            ? `${formatters.rate(low)}%`
            : `${formatters.rate(low)}–${formatters.rate(high)}%`;
        })()
      : null;
  const rateLabel =
    product.rateType === 'expected_profit' ? copy.expectedProfitLabel : copy.detailRateCol;
  const summaryFacts = [
    { label: copy.basisLabel, value: basisLabel(copy, product.interestBasis) },
    { label: copy.payoutLabel, value: payoutLabel(copy, product.interestPayoutFrequency) },
    ...(product.minBalanceToEarn !== null
      ? [{ label: copy.minBalanceToEarnLabel, value: formatters.money(product.minBalanceToEarn) }]
      : []),
    ...(product.minBalanceRequired !== null
      ? [
          {
            label: copy.minBalanceRequiredLabel,
            value: formatters.money(product.minBalanceRequired),
          },
        ]
      : []),
    ...(product.openingDeposit !== null
      ? [{ label: copy.openingDepositLabel, value: formatters.money(product.openingDeposit) }]
      : []),
    ...(product.withdrawalLimitForInterest !== null
      ? [
          {
            label: copy.withdrawalLimitLabel,
            value: fillCopy(copy.withdrawalLimitValue, {
              count: formatters.count(product.withdrawalLimitForInterest),
            }),
          },
        ]
      : []),
  ];

  return (
    <div className="accounts-page accounts-detail p2-detail">
      <Link to="/accounts" className="accounts-back">
        ← {copy.backToAccounts}
      </Link>
      <h1>{product.name}</h1>
      <p className="accounts-detail-bank">
        {product.bank.name}
        {product.isIslamic && <span className="accounts-badge">{copy.islamicBadge}</span>}
        {product.segment !== 'general' && (
          <span className="accounts-badge">{segmentLabel(copy, product.segment)}</span>
        )}
      </p>
      {product.variantOf && (
        <p>
          {copy.variantOfLabel}:{' '}
          <Link to={`/accounts/${product.variantOf.slug}`}>{product.variantOf.name}</Link>
        </p>
      )}

      <div className="p2-detail-grid">
        <aside className="p2-detail-aside">
          <DetailSummary
            identity={{ bankName: product.bank.name, productName: product.name }}
            heroValue={rateRangeText ?? copy.notPublished}
            heroLabel={rateLabel}
            facts={summaryFacts}
            trustChip={
              product.sourceSocUrl ? (
                <TrustChip
                  source={
                    <a href={product.sourceSocUrl} target="_blank" rel="noreferrer">
                      {copy.sourceSocLabel}
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
                    vertical: 'accounts',
                    key: product.slug,
                    name: product.name,
                    bankName: product.bank.name,
                    detailHref: `/accounts/${product.slug}`,
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
              {
                label: rateLabel,
                value: rateRangeText ?? copy.notPublished,
              },
              { label: copy.basisLabel, value: basisLabel(copy, product.interestBasis) },
              {
                label: copy.verifiedLabel,
                value: product.verifiedAt
                  ? formatLocalizedDate(new Date(product.verifiedAt), lang)
                  : copy.notPublished,
              },
            ]}
          />

          <AccountScenarioStrip product={product} />

          <section className="p2-section" aria-labelledby="account-slabs-heading">
            <h2 id="account-slabs-heading">{copy.detailSlabsHeading}</h2>
            {product.rateSlabs.length > 0 ? (
              <div className="accounts-table-wrap">
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th scope="col">{copy.detailSlabCol}</th>
                      <th scope="col">
                        {product.rateType === 'expected_profit'
                          ? copy.expectedProfitLabel
                          : copy.detailRateCol}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.rateSlabs.map(slab => (
                      <tr key={`${slab.balanceMin}-${slab.balanceMax ?? 'open'}`}>
                        <td>{slabBandText(slab.balanceMin, slab.balanceMax, formatters, copy)}</td>
                        <td>
                          {slab.isRange && slab.rateMax !== null
                            ? `${formatters.rate(slab.rate)}–${formatters.rate(slab.rateMax)}%`
                            : `${formatters.rate(slab.rate)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{copy.notPublished}</p>
            )}
            {product.rateConditionsText && <p>{product.rateConditionsText}</p>}
          </section>

          <section aria-labelledby="account-maintenance-heading">
            <h2 id="account-maintenance-heading">{copy.detailMaintenanceHeading}</h2>
            {product.maintenanceFeeSlabs === null ? (
              <p>{copy.notPublished}</p>
            ) : product.maintenanceFeeSlabs.every(slab => slab.fee === 0) ? (
              <p>{copy.maintenanceFreeNote}</p>
            ) : (
              <div className="accounts-table-wrap">
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th scope="col">{copy.detailSlabCol}</th>
                      <th scope="col">{copy.detailMaintenanceCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.maintenanceFeeSlabs.map(slab => (
                      <tr key={`${slab.balanceMin}-${slab.balanceMax ?? 'open'}`}>
                        <td>{slabBandText(slab.balanceMin, slab.balanceMax, formatters, copy)}</td>
                        <td>{formatters.money(slab.fee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {product.maintenanceWaiverText && <p>{product.maintenanceWaiverText}</p>}
          </section>

          <section aria-labelledby="account-fees-heading">
            <h2 id="account-fees-heading">{copy.feesHeading}</h2>
            <table className="accounts-fee-table">
              <tbody>
                {feeRows.map(row => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(product.debitCardWaiverText || product.maintenanceWaiverText) && (
              <>
                <h3>{copy.conditionsHeading}</h3>
                {product.debitCardWaiverText && <p>{product.debitCardWaiverText}</p>}
              </>
            )}
          </section>

          {product.dormancyTerms && (
            <section>
              <h2>{copy.dormancyHeading}</h2>
              <p>{product.dormancyTerms}</p>
            </section>
          )}
          {product.eligibilityNotes && (
            <section>
              <h2>{copy.eligibilityHeading}</h2>
              <p>{product.eligibilityNotes}</p>
            </section>
          )}

          {product.variants.length > 0 && (
            <section aria-labelledby="account-variants-heading">
              <h2 id="account-variants-heading">{copy.variantsHeading}</h2>
              <ul className="accounts-variants">
                {product.variants.map(variant => (
                  <li key={variant.slug}>
                    <Link to={`/accounts/${variant.slug}`}>{variant.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="accounts-provenance">
            <h2>{copy.provenanceHeading}</h2>
            <dl className="accounts-facts">
              {product.sourceSocUrl && (
                <div>
                  <dt>{copy.sourceSocLabel}</dt>
                  <dd>
                    <a href={product.sourceSocUrl} target="_blank" rel="noreferrer">
                      {product.sourceSocUrl}
                    </a>
                  </dd>
                </div>
              )}
              {product.sourceRateUrl && (
                <div>
                  <dt>{copy.sourceRateLabel}</dt>
                  <dd>
                    <a href={product.sourceRateUrl} target="_blank" rel="noreferrer">
                      {product.sourceRateUrl}
                    </a>
                  </dd>
                </div>
              )}
              {product.socEffectiveDate && (
                <div>
                  <dt>{copy.socEffectiveLabel}</dt>
                  <dd>{product.socEffectiveDate}</dd>
                </div>
              )}
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

          <ReviewsSection
            productType="account"
            productId={product.id}
            productName={product.name}
            productUrl={`/accounts/${product.slug}`}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountDetailPage;
