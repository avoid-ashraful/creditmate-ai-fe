import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { fillCopy, toBanglaNumerals, useLanguage } from '../locales';
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
  ApiError,
  getAccountFieldHistory,
  getAccountProduct,
} from '../services/bankAccounts';

import './AccountsPage.css';

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

const HistorySection: React.FC<{
  slug: string;
  copy: AccountsCopy;
}> = ({ slug, copy }) => {
  const { status: authStatus } = useAuth();
  const [entries, setEntries] = useState<AccountHistoryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    let cancelled = false;
    getAccountFieldHistory(slug)
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
    <section className="accounts-history" aria-labelledby="account-history-heading">
      <h2 id="account-history-heading">{copy.historyHeading}</h2>
      <p>{copy.historyIntro}</p>
      {showLoginPrompt && (
        <p className="accounts-login-prompt">
          {copy.historyLoginPrompt} <Link to="/login">{copy.historyLoginLink}</Link>
        </p>
      )}
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

const AccountDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const copy = getAccountsCopy(lang);
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

  return (
    <div className="accounts-page accounts-detail">
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

      <dl className="accounts-facts">
        <div>
          <dt>{copy.basisLabel}</dt>
          <dd>{basisLabel(copy, product.interestBasis)}</dd>
        </div>
        <div>
          <dt>{copy.payoutLabel}</dt>
          <dd>{payoutLabel(copy, product.interestPayoutFrequency)}</dd>
        </div>
        {product.minBalanceToEarn !== null && (
          <div>
            <dt>{copy.minBalanceToEarnLabel}</dt>
            <dd>{formatters.money(product.minBalanceToEarn)}</dd>
          </div>
        )}
        {product.minBalanceRequired !== null && (
          <div>
            <dt>{copy.minBalanceRequiredLabel}</dt>
            <dd>{formatters.money(product.minBalanceRequired)}</dd>
          </div>
        )}
        {product.openingDeposit !== null && (
          <div>
            <dt>{copy.openingDepositLabel}</dt>
            <dd>{formatters.money(product.openingDeposit)}</dd>
          </div>
        )}
        {product.withdrawalLimitForInterest !== null && (
          <div>
            <dt>{copy.withdrawalLimitLabel}</dt>
            <dd>
              {fillCopy(copy.withdrawalLimitValue, {
                count: formatters.count(product.withdrawalLimitForInterest),
              })}
            </dd>
          </div>
        )}
      </dl>

      <section aria-labelledby="account-slabs-heading">
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
    </div>
  );
};

export default AccountDetailPage;
