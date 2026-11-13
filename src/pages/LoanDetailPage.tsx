import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { ReviewsSection } from '../components/ReviewsSection';
import { DetailSummary, Money, MoneyInput, TrustChip, VerdictStrip } from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { formatLocalizedDate, getDetailCopy, toBanglaNumerals, useLanguage } from '../locales';
import { collateralLabel, disbursementLabel, getLoansCopy, segmentLabel } from '../locales/loans';
import {
  fetchLoanFieldHistory,
  fetchLoanProduct,
  LoanFieldHistoryEntry,
  LoanProductDetail,
  runLoanScenario,
  ScenarioResultItem,
} from '../services/loans';

import './LoansPage.css';
import '../styles/DecisionDetail.css';

type LoadState = 'loading' | 'error' | 'done';

/**
 * Scenario carry-forward strip (redesign Phase 2): the amount/term from
 * the discovery scenario arrive prefilled; costs come from the same
 * scenario endpoint discovery uses, at BOTH ends of the published band.
 */
const LoanScenarioStrip: React.FC<{ product: LoanProductDetail }> = ({ product }) => {
  const { lang } = useLanguage();
  const copy = getLoansCopy(lang);
  const detail = getDetailCopy(lang);
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState<number | null>(() => {
    const value = Number(searchParams.get('amount'));
    return Number.isFinite(value) && value > 0 ? value : 500000;
  });
  const [tenure, setTenure] = useState<number>(() => {
    const value = Number(searchParams.get('tenure'));
    return Number.isFinite(value) && value > 0 ? value : 60;
  });
  const [result, setResult] = useState<ScenarioResultItem | null>(null);
  const [responded, setResponded] = useState(false);
  const [failed, setFailed] = useState(false);
  const runTokenRef = useRef(0);

  useEffect(() => {
    if (!amount || amount <= 0 || !tenure || tenure <= 0) return;
    const token = ++runTokenRef.current;
    const timer = setTimeout(() => {
      runLoanScenario({ loanType: product.loanType, amount, tenureMonths: tenure })
        .then(response => {
          if (runTokenRef.current !== token) return;
          setResult(response.results.find(entry => entry.product.slug === product.slug) ?? null);
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
  }, [amount, tenure, product.loanType, product.slug]);

  return (
    <section className="p2-scenario" aria-labelledby="loan-scenario-heading">
      <h2 id="loan-scenario-heading">{detail.loanScenarioHeading}</h2>
      <div className="p2-scenario-inputs">
        <MoneyInput label={detail.loanAmountLabel} value={amount} onValueChange={setAmount} />
        <label>
          {detail.tenureMonthsLabel}
          <input
            type="number"
            min={1}
            max={360}
            value={tenure}
            onChange={event => setTenure(Number(event.target.value))}
          />
        </label>
      </div>
      {failed && <p role="alert">{detail.scenarioError}</p>}
      {!failed && responded && !result && <p>{detail.scenarioNotRanked}</p>}
      {!failed && result && (result.atMinRate || result.atMaxRate) && (
        <dl className="p2-scenario-results">
          {result.atMinRate && (
            <div className="p2-scenario-result">
              <dt>
                {detail.emiAtLowRate} ({result.atMinRate.rate}
                %)
              </dt>
              <dd>
                <Money value={result.atMinRate.emi} decimals={2} />
              </dd>
            </div>
          )}
          {result.atMaxRate && (
            <div className="p2-scenario-result">
              <dt>
                {detail.emiAtHighRate} ({result.atMaxRate.rate}
                %)
              </dt>
              <dd>
                <Money value={result.atMaxRate.emi} decimals={2} />
              </dd>
            </div>
          )}
          {result.atMinRate && (
            <div className="p2-scenario-result">
              <dt>{detail.totalAtLowRate}</dt>
              <dd>
                <Money value={result.atMinRate.totalCost} decimals={2} />
              </dd>
            </div>
          )}
          {result.atMaxRate && (
            <div className="p2-scenario-result">
              <dt>{detail.totalAtHighRate}</dt>
              <dd>
                <Money value={result.atMaxRate.totalCost} decimals={2} />
              </dd>
            </div>
          )}
        </dl>
      )}
      {!failed && result && result.note && <p className="p2-section-note">{result.note}</p>}
      <span className="p2-section-note">{copy.estimateBanner}</span>
    </section>
  );
};

const LoanDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const copy = getLoansCopy(lang);
  const detail = getDetailCopy(lang);
  const shortlist = useShortlist();
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

  /** Half-published ranges show the single published bound, not "Not published – X". */
  const formatAmountRange = (min: number | null, max: number | null): string => {
    if (min !== null && max !== null) return `${formatMoney(min)} – ${formatMoney(max)}`;
    if (min !== null) return formatMoney(min);
    if (max !== null) return formatMoney(max);
    return copy.notPublished;
  };

  const humanizeKey = (key: string): string => key.replace(/_/g, ' ');

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

  // Type-specific terms the service maps but a generic terms table can't
  // show: property/vehicle eligibility, per-vehicle LTV, takeover, the
  // unsecured ceiling on personal loans, what secures a deposit-backed loan.
  const typeSpecificRows: Array<{ key: string; label: string; value: React.ReactNode }> = [];
  if (product.loanType === 'home') {
    if (product.propertyTypes.length > 0) {
      typeSpecificRows.push({
        key: 'propertyTypes',
        label: copy.propertyTypes,
        value: product.propertyTypes.join(', '),
      });
    }
    if (Object.keys(product.maxAmountByPurpose).length > 0) {
      typeSpecificRows.push({
        key: 'maxAmountByPurpose',
        label: copy.maxAmountByPurpose,
        value: Object.entries(product.maxAmountByPurpose).map(([purpose, value]) => (
          <div key={purpose}>
            {humanizeKey(purpose)}: {typeof value === 'number' ? formatMoney(value) : String(value)}
          </div>
        )),
      });
    }
    if (product.takeoverAllowed) {
      typeSpecificRows.push({
        key: 'takeoverAllowed',
        label: copy.takeoverAllowed,
        value: copy.yesLabel,
      });
    }
    if (product.nrbEligible) {
      typeSpecificRows.push({
        key: 'nrbEligible',
        label: copy.nrbEligible,
        value: copy.yesLabel,
      });
    }
  }
  if (product.loanType === 'car') {
    if (product.vehicleConditions.length > 0) {
      typeSpecificRows.push({
        key: 'vehicleConditions',
        label: copy.vehicleConditions,
        value: product.vehicleConditions.join(', '),
      });
    }
    if (Object.keys(product.ltvByVehicleType).length > 0) {
      typeSpecificRows.push({
        key: 'ltvByVehicleType',
        label: copy.ltvByVehicleType,
        value: Object.entries(product.ltvByVehicleType).map(([vehicleType, ltv]) => (
          <div key={vehicleType}>
            {humanizeKey(vehicleType)}: {formatPercent(ltv)}
          </div>
        )),
      });
    }
    if (product.brtaRegistrationRequired) {
      typeSpecificRows.push({
        key: 'brtaRegistrationRequired',
        label: copy.brtaRegistrationRequired,
        value: copy.yesLabel,
      });
    }
    if (product.registrationCostIncluded) {
      typeSpecificRows.push({
        key: 'registrationCostIncluded',
        label: copy.registrationCostIncluded,
        value: copy.yesLabel,
      });
    }
  }
  if (product.loanType === 'personal') {
    if (product.unsecuredMaxBdt !== null) {
      typeSpecificRows.push({
        key: 'unsecuredMax',
        label: copy.unsecuredMax,
        value: formatMoney(product.unsecuredMaxBdt),
      });
    }
    if (product.incomeMultipleMax !== null) {
      typeSpecificRows.push({
        key: 'incomeMultiple',
        label: copy.incomeMultiple,
        value: `${
          isBn ? toBanglaNumerals(String(product.incomeMultipleMax)) : product.incomeMultipleMax
        }×`,
      });
    }
  }
  if (product.loanType === 'secured_against_deposit') {
    if (product.securedBy) {
      typeSpecificRows.push({
        key: 'securedBy',
        label: copy.securedBy,
        value: product.securedBy,
      });
    }
    if (product.depositType) {
      typeSpecificRows.push({
        key: 'depositType',
        label: copy.depositType,
        value: product.depositType,
      });
    }
    if (product.ltvOfDepositPercent !== null) {
      typeSpecificRows.push({
        key: 'ltvOfDeposit',
        label: copy.ltvOfDeposit,
        value: formatPercent(product.ltvOfDepositPercent),
      });
    }
  }
  if (product.disbursementMode) {
    typeSpecificRows.push({
      key: 'disbursementMode',
      label: copy.disbursementModeLabel,
      value: disbursementLabel(product.disbursementMode, lang),
    });
  }
  if (product.jointApplicationAllowed) {
    typeSpecificRows.push({
      key: 'jointApplication',
      label: copy.jointApplication,
      value: copy.yesLabel,
    });
  }
  if (product.insuranceRequired) {
    typeSpecificRows.push({
      key: 'insuranceRequired',
      label: copy.insuranceRequiredLabel,
      value: copy.yesLabel,
    });
  }
  if (product.insuranceBundled) {
    typeSpecificRows.push({
      key: 'insuranceBundled',
      label: copy.insuranceBundledLabel,
      value: copy.yesLabel,
    });
  }
  if (product.insuranceNotes) {
    typeSpecificRows.push({
      key: 'insuranceNotes',
      label: copy.insuranceNotesLabel,
      value: product.insuranceNotes,
    });
  }

  const inShortlist = shortlist.isInShortlist('loans', product.slug);
  const bandText = product.effectiveRate
    ? `${formatPercent(product.effectiveRate.min)} – ${formatPercent(product.effectiveRate.max)}`
    : copy.noBandNote;

  return (
    <main className="loans-page p2-detail">
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

      <div className="p2-detail-grid">
        <aside className="p2-detail-aside">
          <DetailSummary
            identity={{ bankName: product.lenderName, productName: product.name }}
            heroValue={bandText}
            heroLabel={`${copy.colBand} (${rateWord})`}
            facts={[
              {
                label: copy.amountRange,
                value: formatAmountRange(product.amountMinBdt, product.amountMaxBdt),
              },
              {
                label: copy.tenureRange,
                value:
                  product.tenureMaxMonths !== null
                    ? `${product.tenureMinMonths ?? '—'} – ${product.tenureMaxMonths} ${
                        copy.months
                      }`
                    : copy.notPublished,
              },
              {
                label: copy.processingFee,
                value:
                  product.processingFeePercent !== null
                    ? formatPercent(product.processingFeePercent)
                    : copy.notPublished,
              },
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
                    vertical: 'loans',
                    key: product.slug,
                    name: product.name,
                    bankName: product.lenderName,
                    detailHref: `/loans/${product.slug}`,
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
              { label: `${copy.colBand} (${rateWord})`, value: bandText },
              {
                label: copy.amountRange,
                value: formatAmountRange(product.amountMinBdt, product.amountMaxBdt),
              },
              {
                label: copy.lastVerified,
                value: product.verifiedAt
                  ? formatLocalizedDate(new Date(product.verifiedAt), lang)
                  : copy.notPublished,
              },
            ]}
          />

          <LoanScenarioStrip product={product} />

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
                  {product.effectiveRate ? (
                    <>
                      {`${formatPercent(product.effectiveRate.min)} – ${formatPercent(
                        product.effectiveRate.max
                      )}`}
                      {product.effectiveRate.source === 'bb_chart' &&
                        product.effectiveRate.category && (
                          <span className="loans-band-source">
                            {product.effectiveRate.category === 'consumer_credit'
                              ? copy.bandChartConsumerCredit
                              : copy.bandChartHousing}
                          </span>
                        )}
                    </>
                  ) : (
                    copy.noBandNote
                  )}
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
                <dd>{formatAmountRange(product.amountMinBdt, product.amountMaxBdt)}</dd>
              </div>
              <div>
                <dt>{copy.tenureRange}</dt>
                <dd>
                  {product.tenureMaxMonths !== null
                    ? `${product.tenureMinMonths ?? '—'} – ${product.tenureMaxMonths} ${
                        copy.months
                      }`
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

          {typeSpecificRows.length > 0 && (
            <section className="loan-detail-section" aria-labelledby="loan-type-specific-heading">
              <h2 id="loan-type-specific-heading">{copy.sectionTypeSpecific}</h2>
              <dl className="loan-detail-terms">
                {typeSpecificRows.map(row => (
                  <div key={row.key}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

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
                          ? ` (${copy.processingFeeCap}: ${formatMoney(
                              product.processingFeeCapBdt
                            )})`
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
                    {collateralLabel(product.collateralType, lang)}
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
              <ul className="loan-history-list">
                {history.map(entry => (
                  <li key={entry.id}>
                    {entry.created.slice(0, 10)} — {entry.fieldName}: {entry.oldValue} →{' '}
                    {entry.newValue}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{copy.historyEmpty}</p>
            )}
          </section>

          <ReviewsSection
            productType="loan"
            productId={product.id}
            productName={product.name}
            productUrl={`/loans/${product.slug}`}
          />
        </div>
      </div>
    </main>
  );
};

export default LoanDetailPage;
