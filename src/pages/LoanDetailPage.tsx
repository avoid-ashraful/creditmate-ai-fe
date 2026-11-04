import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { toBanglaNumerals, useLanguage } from '../locales';
import { getLoansCopy, segmentLabel } from '../locales/loans';
import { authClient } from '../services/auth';
import {
  fetchLoanFieldHistory,
  fetchLoanProduct,
  LoanFieldHistoryEntry,
  LoanProductDetail,
} from '../services/loans';

import './LoansPage.css';

type LoadState = 'loading' | 'error' | 'done';

const LoanDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const copy = getLoansCopy(lang);
  const isBn = lang === 'bn';

  const [product, setProduct] = useState<LoanProductDetail | null>(null);
  const [history, setHistory] = useState<LoanFieldHistoryEntry[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useSeoMeta({
    title: product ? `${product.name} — ${copy.detailSeoSuffix}` : copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: slug ? `/loans/${slug}` : '/loans',
  });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setState('loading');
    Promise.all([
      fetchLoanProduct(slug),
      fetchLoanFieldHistory(slug).catch(() => [] as LoanFieldHistoryEntry[]),
    ])
      .then(([detail, entries]) => {
        if (cancelled) return;
        setProduct(detail);
        setHistory(entries);
        setState('done');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const formatMoney = (value: number | null | undefined): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) return copy.notPublished;
    const text = Math.round(value).toLocaleString('en-US');
    return isBn ? `৳${toBanglaNumerals(text)}` : `BDT ${text}`;
  };

  const formatPercent = (value: number | null | undefined, suffix = '%'): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) return copy.notPublished;
    const text = `${value}`;
    return isBn ? `${toBanglaNumerals(text)}${suffix}` : `${text}${suffix}`;
  };

  if (state === 'loading') {
    return (
      <main className="loans-page">
        <p aria-live="polite">{copy.loadingLabel}</p>
      </main>
    );
  }

  if (state === 'error' || !product) {
    return (
      <main className="loans-page">
        <p role="alert">{copy.errorResults}</p>
        <Link to="/loans">{copy.detailBack}</Link>
      </main>
    );
  }

  const rateWord = product.rateLabel === 'expected_profit' ? copy.expectedProfit : copy.interest;
  const incomeMetricLabel =
    product.incomeMetric === 'net'
      ? copy.incomeMetricNet
      : product.incomeMetric === 'mixed'
      ? copy.incomeMetricMixed
      : copy.incomeMetricGross;
  const incomeEntries = Object.entries(product.minIncomeBySegment);

  return (
    <main className="loans-page">
      <p>
        <Link to="/loans">← {copy.detailBack}</Link>
      </p>
      <section className="loans-hero">
        <h1>
          {product.name}
          {product.isIslamic && <span className="loans-badge">{copy.islamicBadge}</span>}
          {product.usesSimpleInterest && (
            <span className="loans-badge">{copy.simpleInterestBadge}</span>
          )}
        </h1>
        <p>
          {product.lenderName} ·{' '}
          {product.segmentTags.map(tag => segmentLabel(tag, lang)).join(' · ')}
        </p>
      </section>

      <div className="loans-estimate-banner" role="note">
        {copy.estimateBanner}
      </div>

      {product.regulatoryCapFlags.length > 0 && (
        <div className="loan-detail-warning" role="note">
          <strong>{copy.capFlagsHeading}</strong>
          <ul>
            {product.regulatoryCapFlags.map(flag => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="loan-detail-section" aria-labelledby="loan-terms-heading">
        <h2 id="loan-terms-heading">{copy.sectionTerms}</h2>
        <dl className="loan-detail-terms">
          <div>
            <dt>
              {copy.colBand} ({rateWord})
            </dt>
            <dd>
              {product.effectiveRate
                ? `${formatPercent(product.effectiveRate.min)} – ${formatPercent(
                    product.effectiveRate.max
                  )}`
                : copy.noBandNote}
            </dd>
          </div>
          {product.rateBasisText && (
            <div>
              <dt>{copy.rateBasis}</dt>
              <dd>{product.rateBasisText}</dd>
            </div>
          )}
          <div>
            <dt>{copy.amountRange}</dt>
            <dd>
              {product.amountMinBdt !== null || product.amountMaxBdt !== null
                ? `${formatMoney(product.amountMinBdt)} – ${formatMoney(product.amountMaxBdt)}`
                : copy.notPublished}
            </dd>
          </div>
          <div>
            <dt>{copy.tenureRange}</dt>
            <dd>
              {product.tenureMaxMonths !== null
                ? `${product.tenureMinMonths ?? '—'} – ${product.tenureMaxMonths} ${copy.months}`
                : copy.notPublished}
            </dd>
          </div>
          {product.gracePeriodMonths !== null && (
            <div>
              <dt>{copy.gracePeriod}</dt>
              <dd>
                {product.gracePeriodMonths} {copy.months}
              </dd>
            </div>
          )}
          {(product.ltvPercent !== null || product.ltvOfDepositPercent !== null) && (
            <div>
              <dt>{copy.ltv}</dt>
              <dd>{formatPercent(product.ltvPercent ?? product.ltvOfDepositPercent)}</dd>
            </div>
          )}
          {product.amountNotes && (
            <div>
              <dt>{copy.amountRange}</dt>
              <dd>{product.amountNotes}</dd>
            </div>
          )}
        </dl>
        {product.notes && <p className="loans-muted">{product.notes}</p>}
      </section>

      <section className="loan-detail-section" aria-labelledby="loan-fees-heading">
        <h2 id="loan-fees-heading">{copy.sectionFees}</h2>
        <dl className="loan-detail-terms">
          <div>
            <dt>{copy.processingFee}</dt>
            <dd>
              {product.processingFeePercent !== null
                ? `${formatPercent(product.processingFeePercent)}${
                    product.processingFeePercentMax !== null
                      ? ` – ${formatPercent(product.processingFeePercentMax)}`
                      : ''
                  }${
                    product.processingFeeCapBdt !== null
                      ? ` (${copy.processingFee}: ${formatMoney(product.processingFeeCapBdt)})`
                      : ''
                  }`
                : copy.notPublished}
            </dd>
          </div>
          {product.processingFeeNotes && (
            <div>
              <dt>{copy.processingFee}</dt>
              <dd>{product.processingFeeNotes}</dd>
            </div>
          )}
          <div>
            <dt>{copy.earlySettlement}</dt>
            <dd>
              {product.earlySettlementPercent !== null
                ? formatPercent(product.earlySettlementPercent)
                : copy.notPublished}
              {product.earlySettlementNotes ? ` — ${product.earlySettlementNotes}` : ''}
            </dd>
          </div>
          <div>
            <dt>{copy.partialPrepayment}</dt>
            <dd>
              {product.partialPrepaymentPercent !== null
                ? formatPercent(product.partialPrepaymentPercent)
                : copy.notPublished}
              {product.partialPrepaymentRules ? ` — ${product.partialPrepaymentRules}` : ''}
            </dd>
          </div>
          {(product.penalChargePercent !== null || product.penalChargeNotes) && (
            <div>
              <dt>{copy.penalCharge}</dt>
              <dd>
                {product.penalChargePercent !== null
                  ? formatPercent(product.penalChargePercent)
                  : ''}
                {product.penalChargeNotes ? ` ${product.penalChargeNotes}` : ''}
              </dd>
            </div>
          )}
          {product.supervisionChargePercent !== null && (
            <div>
              <dt>{copy.supervisionCharge}</dt>
              <dd>{formatPercent(product.supervisionChargePercent)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="loan-detail-section" aria-labelledby="loan-eligibility-heading">
        <h2 id="loan-eligibility-heading">{copy.sectionEligibility}</h2>
        {incomeEntries.length > 0 && (
          <>
            <h3>
              {copy.minIncomeBySegment} ({incomeMetricLabel})
            </h3>
            <ul>
              {incomeEntries.map(([segment, income]) => (
                <li key={segment}>
                  {segmentLabel(segment, lang)}: {formatMoney(income)}
                </li>
              ))}
            </ul>
          </>
        )}
        <dl className="loan-detail-terms">
          {(product.minAge !== null || product.maxAgeAtMaturity !== null) && (
            <div>
              <dt>{copy.ageRange}</dt>
              <dd>
                {product.minAge ?? '—'} – {product.maxAgeAtMaturity ?? '—'}
              </dd>
            </div>
          )}
          <div>
            <dt>{copy.guarantor}</dt>
            <dd>
              {product.guarantorRequired
                ? `${copy.guarantorYes}${
                    product.guarantorCount ? ` (${product.guarantorCount})` : ''
                  }`
                : copy.guarantorNo}
              {product.guarantorRules ? ` — ${product.guarantorRules}` : ''}
            </dd>
          </div>
          {(product.collateralType !== 'none' || product.collateralRules) && (
            <div>
              <dt>{copy.collateral}</dt>
              <dd>
                {product.collateralType}
                {product.collateralRules ? ` — ${product.collateralRules}` : ''}
              </dd>
            </div>
          )}
          {product.dbrMaxPercent !== null && (
            <div>
              <dt>{copy.dbr}</dt>
              <dd>{formatPercent(product.dbrMaxPercent)}</dd>
            </div>
          )}
        </dl>
        {Object.entries(product.experienceRequirements).length > 0 && (
          <ul>
            {Object.entries(product.experienceRequirements).map(([key, value]) => (
              <li key={key}>
                {segmentLabel(key, lang)}: {value}
              </li>
            ))}
          </ul>
        )}
      </section>

      {product.documentsChecklist.length > 0 && (
        <section className="loan-detail-section" aria-labelledby="loan-documents-heading">
          <h2 id="loan-documents-heading">{copy.sectionDocuments}</h2>
          <ul>
            {product.documentsChecklist.map(doc => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="loan-detail-section" aria-labelledby="loan-provenance-heading">
        <h2 id="loan-provenance-heading">{copy.sectionProvenance}</h2>
        <dl className="loan-detail-terms">
          <div>
            <dt>{copy.sourceLabel}</dt>
            <dd>
              {product.sourceUrl ? (
                <a href={product.sourceUrl} target="_blank" rel="noreferrer">
                  {product.sourceUrl}
                </a>
              ) : (
                copy.notPublished
              )}
            </dd>
          </div>
          {product.sourceEffectiveDate && (
            <div>
              <dt>{copy.sourceEffective}</dt>
              <dd>{product.sourceEffectiveDate}</dd>
            </div>
          )}
          <div>
            <dt>{copy.lastVerified}</dt>
            <dd>{product.verifiedAt ? product.verifiedAt.slice(0, 10) : copy.notPublished}</dd>
          </div>
        </dl>
      </section>

      <section className="loan-detail-section" aria-labelledby="loan-history-heading">
        <h2 id="loan-history-heading">{copy.sectionHistory}</h2>
        {history.length > 0 ? (
          <ul>
            {history.map(entry => (
              <li key={entry.id}>
                {entry.created.slice(0, 10)} — {entry.fieldName}: {entry.oldValue} →{' '}
                {entry.newValue}
              </li>
            ))}
          </ul>
        ) : authClient.hasSession() ? (
          <p>{copy.historyEmpty}</p>
        ) : (
          <p>{copy.historySignInNote}</p>
        )}
      </section>
    </main>
  );
};

export default LoanDetailPage;
