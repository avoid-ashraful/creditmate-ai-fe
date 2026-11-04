import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { toBanglaNumerals, useLanguage } from '../locales';
import { getLoansCopy, segmentLabel } from '../locales/loans';
import type { LoansCopy } from '../locales/loans';
import {
  fetchLoanProducts,
  fetchRegulatoryCaps,
  LoanProductListItem,
  LoanScenarioResponse,
  LoanType,
  RateSource,
  RegulatoryCap,
  runLoanScenario,
} from '../services/loans';

import './LoansPage.css';

type LoadState = 'idle' | 'loading' | 'error' | 'done';

const LOAN_TYPES: LoanType[] = ['personal', 'home', 'car', 'secured_against_deposit'];

const typeLabel = (copy: LoansCopy, type: LoanType): string =>
  ({
    personal: copy.typePersonal,
    home: copy.typeHome,
    car: copy.typeCar,
    secured_against_deposit: copy.typeSecured,
  }[type]);

const bandSourceLabel = (copy: LoansCopy, source: RateSource): string =>
  ({
    bb_chart: copy.bandFromChart,
    annexure_a: copy.bandFromAnnexure,
    product_page: copy.bandFromProductPage,
    schedule_of_charges: copy.bandFromSoc,
    manual: copy.bandFromManual,
    none: '',
  }[source]);

/**
 * For a Bangladesh Bank chart fallback band, the chart column it came from
 * matters: a "consumer credit" band is not a product-specific price. Returns
 * the category label for bb_chart bands, or null when it doesn't apply.
 */
const bandCategoryLabel = (
  copy: LoansCopy,
  source: RateSource,
  category: 'consumer_credit' | 'housing' | null
): string | null => {
  if (source !== 'bb_chart' || !category) return null;
  return category === 'consumer_credit' ? copy.bandChartConsumerCredit : copy.bandChartHousing;
};

const LoansPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getLoansCopy(lang);
  const isBn = lang === 'bn';

  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [segment, setSegment] = useState<string>('');
  const [products, setProducts] = useState<LoanProductListItem[]>([]);
  const [caps, setCaps] = useState<RegulatoryCap[]>([]);
  const [catalogueState, setCatalogueState] = useState<LoadState>('idle');

  const [amount, setAmount] = useState<string>('1000000');
  const [tenure, setTenure] = useState<string>('60');
  const [income, setIncome] = useState<string>('');
  const [islamicOnly, setIslamicOnly] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [scenarioState, setScenarioState] = useState<LoadState>('idle');
  const [scenario, setScenario] = useState<LoanScenarioResponse | null>(null);

  useSeoMeta({ title: copy.seoTitle, description: copy.seoDescription, canonicalPath: '/loans' });

  const formatMoney = (value: number | null | undefined): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) return copy.notPublished;
    const text = Math.round(value).toLocaleString('en-US');
    return isBn ? `৳${toBanglaNumerals(text)}` : `BDT ${text}`;
  };

  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) return copy.notPublished;
    const text = `${value}`;
    return isBn ? `${toBanglaNumerals(text)}%` : `${text}%`;
  };

  /** Half-published ranges show the single published bound, not "Not published – X". */
  const formatAmountRange = (min: number | null, max: number | null): string => {
    if (min !== null && max !== null) return `${formatMoney(min)} – ${formatMoney(max)}`;
    if (min !== null) return formatMoney(min);
    if (max !== null) return formatMoney(max);
    return copy.notPublished;
  };

  const loadCatalogue = useCallback(async () => {
    setCatalogueState('loading');
    try {
      const [items, capRows] = await Promise.all([
        fetchLoanProducts({ loanType }),
        fetchRegulatoryCaps().catch(() => [] as RegulatoryCap[]),
      ]);
      setProducts(items);
      setCaps(capRows);
      setCatalogueState('done');
    } catch {
      setCatalogueState('error');
    }
  }, [loanType]);

  useEffect(() => {
    setScenario(null);
    setScenarioState('idle');
    void loadCatalogue();
  }, [loadCatalogue]);

  const segments = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(p => p.segmentTags.forEach(t => tags.add(t)));
    return [...tags].sort();
  }, [products]);

  const visibleProducts = useMemo(
    () => (segment ? products.filter(p => p.segmentTags.includes(segment)) : products),
    [products, segment]
  );

  const visibleResults = useMemo(() => {
    if (!scenario) return [];
    return segment
      ? scenario.results.filter(r => r.product.segmentTags.includes(segment))
      : scenario.results;
  }, [scenario, segment]);

  const handleScenario = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedTenure = Number(tenure);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError(copy.amountRequired);
      return;
    }
    // The backend takes a whole-taka amount; a decimal would be rejected.
    if (!Number.isInteger(parsedAmount)) {
      setFormError(copy.amountNotInteger);
      return;
    }
    if (!Number.isFinite(parsedTenure) || parsedTenure < 1) {
      setFormError(copy.tenureRequired);
      return;
    }
    // The backend caps tenure at 600 months and takes whole months only.
    if (!Number.isInteger(parsedTenure) || parsedTenure > 600) {
      setFormError(copy.tenureInvalid);
      return;
    }
    // Income is optional, but a non-blank value must be a valid number —
    // never silently drop it and run without the income flags.
    let parsedIncome: number | undefined;
    if (income.trim() !== '') {
      const parsed = Number(income);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setFormError(copy.incomeInvalid);
        return;
      }
      parsedIncome = parsed;
    }
    setFormError(null);
    setScenarioState('loading');
    try {
      const response = await runLoanScenario({
        loanType,
        amount: parsedAmount,
        tenureMonths: parsedTenure,
        monthlyIncome: parsedIncome,
        islamicOnly,
      });
      setScenario(response);
      setScenarioState('done');
    } catch {
      setScenarioState('error');
    }
  };

  const bandCell = (item: LoanProductListItem) => {
    if (!item.effectiveRate) {
      return <span className="loans-muted">{copy.noBandNote}</span>;
    }
    const { min, max, source, label, category } = item.effectiveRate;
    const categoryText = bandCategoryLabel(copy, source, category);
    return (
      <>
        <span>
          {formatPercent(min)} – {formatPercent(max)}
        </span>
        <span className="loans-band-source">
          {label === 'expected_profit' ? copy.expectedProfit : copy.interest} ·{' '}
          {bandSourceLabel(copy, source)}
        </span>
        {categoryText ? (
          <span className="loans-band-source">{categoryText}</span>
        ) : (
          source === 'bb_chart' && <span className="loans-band-source">{copy.bandChartNote}</span>
        )}
      </>
    );
  };

  return (
    <main className="loans-page">
      <section className="loans-hero">
        <h1>{copy.heading}</h1>
        <p>{copy.intro}</p>
      </section>

      <div className="loans-estimate-banner" role="note">
        {copy.estimateBanner}
      </div>

      <div className="loans-type-tabs" role="tablist" aria-label={copy.heading}>
        {LOAN_TYPES.map(type => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={loanType === type}
            className={loanType === type ? 'loans-tab loans-tab-active' : 'loans-tab'}
            onClick={() => {
              setLoanType(type);
              setSegment('');
            }}
          >
            {typeLabel(copy, type)}
          </button>
        ))}
      </div>

      <section className="loans-form-section" aria-labelledby="loans-form-heading">
        <h2 id="loans-form-heading">{copy.formHeading}</h2>
        {/* Validation lives in handleScenario (whole-taka amounts, tenure
            1–600, income ≥ 0) so it matches the backend exactly — native
            bubbles would only duplicate it inconsistently. */}
        <form onSubmit={handleScenario} className="loans-form" noValidate>
          <label>
            {copy.amountLabel}
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={copy.amountPlaceholder}
            />
          </label>
          <label>
            {copy.tenureLabel}
            <input
              type="number"
              min="1"
              value={tenure}
              onChange={e => setTenure(e.target.value)}
              placeholder={copy.tenurePlaceholder}
            />
          </label>
          <label>
            {copy.incomeLabel}
            <span className="loans-optional">{copy.incomeOptional}</span>
            <input
              type="number"
              min="0"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder={copy.incomePlaceholder}
            />
          </label>
          <label className="loans-checkbox">
            <input
              type="checkbox"
              checked={islamicOnly}
              onChange={e => setIslamicOnly(e.target.checked)}
            />
            {copy.islamicOnly}
          </label>
          {formError && (
            <p className="loans-form-error" role="alert">
              {formError}
            </p>
          )}
          <button type="submit" className="loans-submit" disabled={scenarioState === 'loading'}>
            {scenarioState === 'loading' ? copy.running : copy.runScenario}
          </button>
        </form>
      </section>

      {segments.length > 0 && (
        <div className="loans-segment-filter">
          <span>{copy.segmentFilterLabel}:</span>
          <button
            type="button"
            className={segment === '' ? 'loans-chip loans-chip-active' : 'loans-chip'}
            onClick={() => setSegment('')}
          >
            {copy.segmentAll}
          </button>
          {segments.map(tag => (
            <button
              key={tag}
              type="button"
              className={segment === tag ? 'loans-chip loans-chip-active' : 'loans-chip'}
              onClick={() => setSegment(tag)}
            >
              {segmentLabel(tag, lang)}
            </button>
          ))}
        </div>
      )}

      {catalogueState === 'loading' && <p aria-live="polite">{copy.loadingLabel}</p>}
      {catalogueState === 'error' && (
        <div>
          <p role="alert">{copy.errorResults}</p>
          <button type="button" onClick={() => void loadCatalogue()}>
            {copy.retry}
          </button>
        </div>
      )}

      {scenarioState === 'error' && (
        <p className="loans-form-error" role="alert">
          {copy.scenarioError}
        </p>
      )}

      {scenario && scenarioState === 'done' ? (
        <section aria-labelledby="loans-results-heading">
          <h2 id="loans-results-heading">{copy.resultsHeading}</h2>
          <p className="loans-muted">{copy.emiRangeNote}</p>
          {visibleResults.length === 0 ? (
            <p>{copy.emptyResults}</p>
          ) : (
            <div className="loans-table-wrap">
              <table className="loans-table">
                <thead>
                  <tr>
                    <th>{copy.colProduct}</th>
                    <th>{copy.colLender}</th>
                    <th>{copy.colBand}</th>
                    <th>{copy.colEmi}</th>
                    <th>{copy.colTotalCost}</th>
                    <th>{copy.colFee}</th>
                    <th>{copy.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleResults.map(result => (
                    <tr
                      key={result.product.id}
                      className={result.eligible ? '' : 'loans-row-ineligible'}
                      data-testid={`scenario-row-${result.product.slug}`}
                    >
                      <td>
                        <Link to={`/loans/${result.product.slug}`}>{result.product.name}</Link>
                        {result.product.isIslamic && (
                          <span className="loans-badge">{copy.islamicBadge}</span>
                        )}
                        {result.usesSimpleInterest && (
                          <span className="loans-badge">{copy.simpleInterestBadge}</span>
                        )}
                        {result.flags.map(flag => (
                          <span key={flag.code} className="loans-flag">
                            {flag.message}
                          </span>
                        ))}
                        {result.warnings.map(warning => (
                          <span key={warning.code} className="loans-flag loans-flag-warning">
                            {warning.message}
                          </span>
                        ))}
                        {result.note && <span className="loans-flag">{result.note}</span>}
                      </td>
                      <td>{result.product.lenderName}</td>
                      <td>
                        {result.band ? (
                          <>
                            <span>
                              {formatPercent(result.band.min)} – {formatPercent(result.band.max)}
                            </span>
                            <span className="loans-band-source">
                              {result.rateLabel === 'expected_profit'
                                ? copy.expectedProfit
                                : copy.interest}{' '}
                              · {bandSourceLabel(copy, result.band.source)}
                            </span>
                            {bandCategoryLabel(copy, result.band.source, result.band.category) && (
                              <span className="loans-band-source">
                                {bandCategoryLabel(copy, result.band.source, result.band.category)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="loans-muted">{copy.noBandNote}</span>
                        )}
                      </td>
                      <td>
                        {result.atMinRate && result.atMaxRate
                          ? `${formatMoney(result.atMinRate.emi)} – ${formatMoney(
                              result.atMaxRate.emi
                            )}`
                          : copy.notPublished}
                      </td>
                      <td>
                        {result.atMinRate && result.atMaxRate
                          ? `${formatMoney(result.atMinRate.totalCost)} – ${formatMoney(
                              result.atMaxRate.totalCost
                            )}`
                          : copy.notPublished}
                      </td>
                      <td>
                        {result.processingFeeInclVat !== null
                          ? formatMoney(result.processingFeeInclVat)
                          : copy.notPublished}
                        {result.supervisionCharge !== null && (
                          <span className="loans-band-source">
                            {copy.supervisionCharge}: {formatMoney(result.supervisionCharge)} (
                            {copy.supervisionNotInTotal})
                          </span>
                        )}
                      </td>
                      <td>{result.eligible ? copy.statusFits : copy.statusCheck}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <section className="loans-notes" aria-labelledby="loans-notes-heading">
            <h3 id="loans-notes-heading">{copy.notesHeading}</h3>
            <ul>
              {scenario.notes.map(note => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </section>
      ) : (
        catalogueState === 'done' && (
          <section aria-labelledby="loans-catalogue-heading">
            <h2 id="loans-catalogue-heading">
              {copy.catalogueHeading} — {typeLabel(copy, loanType)}
            </h2>
            {visibleProducts.length === 0 ? (
              <p>{copy.emptyResults}</p>
            ) : (
              <div className="loans-table-wrap">
                <table className="loans-table">
                  <thead>
                    <tr>
                      <th>{copy.colProduct}</th>
                      <th>{copy.colLender}</th>
                      <th>{copy.colBand}</th>
                      <th>{copy.amountRange}</th>
                      <th>{copy.tenureRange}</th>
                      <th>{copy.statusFits}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <Link to={`/loans/${product.slug}`}>{product.name}</Link>
                          {product.isIslamic && (
                            <span className="loans-badge">{copy.islamicBadge}</span>
                          )}
                          {product.usesSimpleInterest && (
                            <span className="loans-badge">{copy.simpleInterestBadge}</span>
                          )}
                          <span className="loans-tags">
                            {product.segmentTags.map(tag => (
                              <span key={tag} className="loans-tag">
                                {segmentLabel(tag, lang)}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td>{product.lenderName}</td>
                        <td>{bandCell(product)}</td>
                        <td>{formatAmountRange(product.amountMinBdt, product.amountMaxBdt)}</td>
                        <td>
                          {product.tenureMaxMonths !== null
                            ? `${product.tenureMinMonths ?? '—'} – ${product.tenureMaxMonths} ${
                                copy.months
                              }`
                            : copy.notPublished}
                        </td>
                        <td>
                          <Link to={`/loans/${product.slug}`}>{copy.viewDetails}</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      )}

      {caps.length > 0 && (
        <section className="loans-caps" aria-labelledby="loans-caps-heading">
          <h2 id="loans-caps-heading">{copy.capsHeading}</h2>
          <p>{copy.capsIntro}</p>
          <ul>
            {caps.map(cap => (
              <li key={cap.key}>
                <strong>{cap.description}</strong>
                <span className="loans-band-source">
                  {cap.sourceNote} ({cap.effectiveFrom})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
};

export default LoansPage;
