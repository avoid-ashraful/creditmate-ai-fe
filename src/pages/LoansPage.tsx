/**
 * Loans discovery (redesign plan Section 4.5).
 *
 * Catalogue and scenario now coexist: the catalogue never disappears.
 * The scenario (amount, tenure, optional income, Islamic-only) reprices
 * the same products in place, ranked by total cost at the band's UPPER
 * end — and the ranking label says exactly that. Bands stay bands: the
 * hero is the EMI range across the band, never a single invented rate.
 * All state lives in the URL; the scenario re-runs as inputs change.
 * Costing maths is the backend's, unchanged.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  DiscoveryError,
  DiscoveryLayout,
  DiscoverySkeleton,
  FilterChips,
} from '../components/discovery';
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Money,
  MoneyInput,
  ResultCard,
  TrustChip,
  UnknownValue,
  useToast,
} from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useProfile } from '../lib/profile';
import { fillCopy, getDiscoveryCopy, getShellCopy, useLanguage } from '../locales';
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
  ScenarioResultItem,
} from '../services/loans';

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
  const discoveryCopy = getDiscoveryCopy(lang);
  const shellCopy = getShellCopy(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const shortlist = useShortlist();
  const { profile } = useProfile();

  useSeoMeta({ title: copy.seoTitle, description: copy.seoDescription, canonicalPath: '/loans' });

  const initialType = (LOAN_TYPES as string[]).includes(searchParams.get('type') ?? '')
    ? (searchParams.get('type') as LoanType)
    : 'personal';
  const [loanType, setLoanType] = useState<LoanType>(initialType);
  const [segment, setSegment] = useState<string>(searchParams.get('segment') ?? '');
  const [amount, setAmount] = useState<string>(
    searchParams.get('amount') ?? String(profile.loanAmount)
  );
  const [tenure, setTenure] = useState<string>(searchParams.get('tenure') ?? '60');
  const [income, setIncome] = useState<string>(searchParams.get('income') ?? '');
  const [islamicOnly, setIslamicOnly] = useState<boolean>(searchParams.get('islamic') === '1');

  const [products, setProducts] = useState<LoanProductListItem[]>([]);
  const [caps, setCaps] = useState<RegulatoryCap[]>([]);
  const [catalogueState, setCatalogueState] = useState<'loading' | 'done' | 'error'>('loading');
  const [scenario, setScenario] = useState<LoanScenarioResponse | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    tenure?: string;
    income?: string;
  }>({});
  const [retryNonce, setRetryNonce] = useState(0);
  const runTokenRef = useRef(0);

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
    void loadCatalogue();
  }, [loadCatalogue]);

  // URL sync (replace).
  useEffect(() => {
    const next = new URLSearchParams();
    if (loanType !== 'personal') next.set('type', loanType);
    if (segment) next.set('segment', segment);
    if (amount !== String(profile.loanAmount)) next.set('amount', amount);
    if (tenure !== '60') next.set('tenure', tenure);
    if (income) next.set('income', income);
    if (islamicOnly) next.set('islamic', '1');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanType, segment, amount, tenure, income, islamicOnly]);

  // Auto-run the scenario when inputs are valid (same rules as the old form).
  useEffect(() => {
    const errors: typeof fieldErrors = {};
    const amountValue = amount.trim() === '' ? null : Number(amount);
    const tenureValue = tenure.trim() === '' ? null : Number(tenure);
    const incomeValue = income.trim() === '' ? null : Number(income);
    if (amount.trim() === '') errors.amount = copy.amountRequired;
    else if (amountValue === null || !Number.isInteger(amountValue)) {
      errors.amount = copy.amountNotInteger;
    }
    if (tenure.trim() === '') errors.tenure = copy.tenureRequired;
    else if (
      tenureValue === null ||
      !Number.isInteger(tenureValue) ||
      tenureValue < 1 ||
      tenureValue > 600
    ) {
      errors.tenure = copy.tenureInvalid;
    }
    if (income.trim() !== '' && (incomeValue === null || incomeValue < 0)) {
      errors.income = copy.incomeInvalid;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || amountValue === null || tenureValue === null) return;

    const token = ++runTokenRef.current;
    const timer = setTimeout(() => {
      setScenarioError(null);
      runLoanScenario({
        loanType,
        amount: amountValue,
        tenureMonths: tenureValue,
        monthlyIncome: incomeValue ?? undefined,
        islamicOnly,
      })
        .then(response => {
          if (runTokenRef.current === token) setScenario(response);
        })
        .catch(() => {
          if (runTokenRef.current === token) {
            setScenarioError(copy.scenarioError);
            setScenario(null);
          }
        });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanType, amount, tenure, income, islamicOnly, retryNonce]);

  const segments = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(product => product.segmentTags.forEach(tag => tags.add(tag)));
    return [...tags].sort();
  }, [products]);

  const visibleResults = useMemo(() => {
    if (!scenario) return null;
    if (!segment) return scenario.results;
    return scenario.results.filter(result => result.product.segmentTags.includes(segment));
  }, [scenario, segment]);

  const visibleProducts = useMemo(() => {
    if (!segment) return products;
    return products.filter(product => product.segmentTags.includes(segment));
  }, [products, segment]);

  const resultBySlug = useMemo(() => {
    const map = new Map<string, ScenarioResultItem>();
    scenario?.results.forEach(result => map.set(result.product.slug, result));
    return map;
  }, [scenario]);

  const toggleShortlist = (product: LoanProductListItem) => {
    const outcome = shortlist.toggle({
      vertical: 'loans',
      key: product.slug,
      name: product.name,
      bankName: product.lenderName,
      detailHref: `/loans/${product.slug}`,
    });
    if (outcome === 'full') {
      toast({ message: fillCopy(shellCopy.shortlistFull, { count: '4' }), variant: 'warning' });
    } else if (outcome === 'added') {
      toast({ message: fillCopy(shellCopy.shortlistAdded, { name: product.name }) });
    } else {
      toast({ message: fillCopy(shellCopy.shortlistRemoved, { name: product.name }) });
    }
  };

  const renderScenarioCard = (result: ScenarioResultItem) => {
    const { product } = result;
    const bandText = result.band ? `${result.band.min}–${result.band.max}%` : null;
    const categoryNote = result.band
      ? bandCategoryLabel(copy, result.band.source, result.band.category)
      : null;
    return (
      <ResultCard
        key={product.id}
        bankName={product.lenderName}
        productName={product.name}
        detailHref={`/loans/${product.slug}`}
        heroValue={
          result.atMinRate && result.atMaxRate ? (
            <>
              <Money value={result.atMinRate.emi} /> – <Money value={result.atMaxRate.emi} />
            </>
          ) : (
            <UnknownValue kind="not-published" />
          )
        }
        heroLabel={copy.colEmi}
        supportingFacts={[
          {
            label: copy.colBand,
            value: bandText ?? <UnknownValue kind="not-published" />,
          },
          {
            label: copy.colTotalCost,
            value:
              result.atMinRate && result.atMaxRate ? (
                <>
                  <Money value={result.atMinRate.totalCost} /> –{' '}
                  <Money value={result.atMaxRate.totalCost} />
                </>
              ) : (
                <UnknownValue kind="not-published" />
              ),
          },
          {
            label: copy.colFee,
            value:
              result.processingFeeInclVat !== null ? (
                <Money value={result.processingFeeInclVat} />
              ) : (
                <UnknownValue kind="not-published" />
              ),
          },
          { label: copy.colStatus, value: result.eligible ? copy.statusFits : copy.statusCheck },
        ]}
        badges={
          <>
            {product.isIslamic ? <Badge variant="info">{copy.islamicBadge}</Badge> : null}
            {result.usesSimpleInterest ? <Badge>{copy.simpleInterestBadge}</Badge> : null}
            {product.segmentTags.map(tag => (
              <Badge key={tag}>{segmentLabel(tag, lang)}</Badge>
            ))}
          </>
        }
        trustChip={
          result.band && result.band.source !== 'none' ? (
            <TrustChip
              source={bandSourceLabel(copy, result.band.source)}
              dateLabel={categoryNote ?? bandText ?? ''}
            />
          ) : undefined
        }
        islamic={product.isIslamic}
        inShortlist={shortlist.isInShortlist('loans', product.slug)}
        onToggleShortlist={() => toggleShortlist(product)}
      >
        {result.band ? (
          <p className="cm-discovery-note">
            {result.rateLabel === 'expected_profit' ? copy.expectedProfit : copy.interest} ·{' '}
            {bandSourceLabel(copy, result.band.source)}
            {categoryNote ? ` · ${categoryNote}` : ''}
          </p>
        ) : (
          <p className="cm-discovery-note">{copy.noBandNote}</p>
        )}
        {result.supervisionCharge !== null ? (
          <p className="cm-discovery-note">
            {copy.supervisionCharge}: <Money value={result.supervisionCharge} /> (
            {copy.supervisionNotInTotal})
          </p>
        ) : null}
        {result.warnings.map(warning => (
          <p key={warning.code} className="cm-discovery-note">
            {warning.message}
          </p>
        ))}
        {result.flags.map(flag => (
          <p key={flag.code} className="cm-discovery-note">
            {flag.message}
          </p>
        ))}
        {result.note ? <p className="cm-discovery-note">{result.note}</p> : null}
      </ResultCard>
    );
  };

  const renderCatalogueCard = (product: LoanProductListItem) => {
    const band = product.effectiveRate;
    return (
      <ResultCard
        key={product.id}
        bankName={product.lenderName}
        productName={product.name}
        detailHref={`/loans/${product.slug}`}
        heroValue={band ? `${band.min}–${band.max}%` : <UnknownValue kind="not-published" />}
        heroLabel={copy.colBand}
        supportingFacts={[
          {
            label: copy.amountRange,
            value:
              product.amountMinBdt !== null || product.amountMaxBdt !== null ? (
                <>
                  {product.amountMinBdt !== null ? <Money value={product.amountMinBdt} /> : '…'} –{' '}
                  {product.amountMaxBdt !== null ? <Money value={product.amountMaxBdt} /> : '…'}
                </>
              ) : (
                <UnknownValue kind="not-published" />
              ),
          },
          {
            label: copy.tenureRange,
            value:
              product.tenureMinMonths !== null || product.tenureMaxMonths !== null ? (
                `${product.tenureMinMonths ?? '…'}–${product.tenureMaxMonths ?? '…'}`
              ) : (
                <UnknownValue kind="not-published" />
              ),
          },
        ]}
        badges={
          <>
            {product.isIslamic ? <Badge variant="info">{copy.islamicBadge}</Badge> : null}
            {product.usesSimpleInterest ? <Badge>{copy.simpleInterestBadge}</Badge> : null}
            {product.segmentTags.map(tag => (
              <Badge key={tag}>{segmentLabel(tag, lang)}</Badge>
            ))}
          </>
        }
        islamic={product.isIslamic}
        inShortlist={shortlist.isInShortlist('loans', product.slug)}
        onToggleShortlist={() => toggleShortlist(product)}
      />
    );
  };

  const filters = (
    <div>
      <h3 className="cm-filter-group-label">{copy.formHeading}</h3>
      <div className="cm-filter-group" role="group" aria-label={copy.formHeading}>
        <div className="cm-filter-options">
          {LOAN_TYPES.map(type => (
            <Button
              key={type}
              variant={loanType === type ? 'primary' : 'ghost'}
              size="sm"
              aria-pressed={loanType === type}
              onClick={() => {
                setLoanType(type);
                setSegment('');
              }}
            >
              {typeLabel(copy, type)}
            </Button>
          ))}
        </div>
      </div>
      <MoneyInput
        label={copy.amountLabel}
        value={amount === '' ? null : Number(amount)}
        onValueChange={value => setAmount(value === null ? '' : String(value))}
        error={fieldErrors.amount}
      />
      <Input
        label={copy.tenureLabel}
        type="number"
        min={1}
        max={600}
        value={tenure}
        error={fieldErrors.tenure}
        onChange={event => setTenure(event.target.value)}
      />
      <MoneyInput
        label={`${copy.incomeLabel} (${copy.incomeOptional})`}
        value={income === '' ? null : Number(income)}
        onValueChange={value => setIncome(value === null ? '' : String(value))}
        error={fieldErrors.income}
      />
      <div className="cm-filter-options">
        <Checkbox
          label={copy.islamicOnly}
          checked={islamicOnly}
          onChange={event => setIslamicOnly(event.target.checked)}
        />
      </div>
      {segments.length > 0 ? (
        <fieldset className="cm-filter-group">
          <legend>{copy.segmentFilterLabel}</legend>
          <div className="cm-filter-options">
            <Button
              variant={segment === '' ? 'primary' : 'ghost'}
              size="sm"
              aria-pressed={segment === ''}
              onClick={() => setSegment('')}
            >
              {copy.segmentAll}
            </Button>
            {segments.map(tag => (
              <Button
                key={tag}
                variant={segment === tag ? 'primary' : 'ghost'}
                size="sm"
                aria-pressed={segment === tag}
                onClick={() => setSegment(tag)}
              >
                {segmentLabel(tag, lang)}
              </Button>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );

  const showScenario = visibleResults !== null && !scenarioError;

  return (
    <div className="loans-page">
      <h1>{copy.heading}</h1>
      <p className="cm-discovery-note">{copy.intro}</p>
      <p className="cm-discovery-note">{copy.estimateBanner}</p>

      <DiscoveryLayout
        filters={filters}
        resultCount={showScenario ? visibleResults.length : visibleProducts.length}
      >
        <h2 className="cm-discovery-section-label">
          {copy.resultsHeading} — {typeLabel(copy, loanType)}
        </h2>
        <p className="cm-discovery-sortedby" role="status">
          {fillCopy(discoveryCopy.sortedBy, { criterion: copy.rankedByUpperBand })}
        </p>
        <p className="cm-discovery-note">{copy.emiRangeNote}</p>
        {segment ? (
          <FilterChips
            chips={[{ key: 'segment', label: segmentLabel(segment, lang) }]}
            onRemove={() => setSegment('')}
            onClearAll={() => setSegment('')}
          />
        ) : null}

        {catalogueState === 'loading' ? <DiscoverySkeleton /> : null}
        {catalogueState === 'error' ? (
          <DiscoveryError message={copy.errorResults} onRetry={() => void loadCatalogue()} />
        ) : null}
        {scenarioError ? (
          <DiscoveryError
            message={scenarioError}
            onRetry={() => setRetryNonce(nonce => nonce + 1)}
          />
        ) : null}

        {catalogueState === 'done' && showScenario ? (
          <>
            <div className="cm-discovery-list">
              {visibleResults.map(result => renderScenarioCard(result))}
            </div>
            {visibleResults.length === 0 ? (
              <p className="cm-discovery-note">{copy.emptyResults}</p>
            ) : null}
            {scenario && scenario.notes.length > 0 ? (
              <>
                <h3 className="cm-discovery-section-label">{copy.notesHeading}</h3>
                <ul className="cm-notes-list">
                  {scenario.notes.map(note => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : null}

        {catalogueState === 'done' && !showScenario && !scenarioError ? (
          <>
            <h3 className="cm-discovery-section-label">{copy.catalogueHeading}</h3>
            <div className="cm-discovery-list">
              {visibleProducts.map(product => {
                const result = resultBySlug.get(product.slug);
                return result ? renderScenarioCard(result) : renderCatalogueCard(product);
              })}
            </div>
            {visibleProducts.length === 0 ? (
              <p className="cm-discovery-note">{copy.emptyResults}</p>
            ) : null}
          </>
        ) : null}
      </DiscoveryLayout>

      {caps.length > 0 ? (
        <section aria-labelledby="loans-caps-heading">
          <h2 id="loans-caps-heading" className="cm-discovery-section-label">
            {copy.capsHeading}
          </h2>
          <p className="cm-discovery-note">{copy.capsIntro}</p>
          <ul className="cm-notes-list">
            {caps.map(cap => (
              <li key={cap.key}>
                <strong>{cap.description}</strong>{' '}
                <span className="cm-discovery-note">
                  {cap.sourceNote} ({cap.effectiveFrom})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

export default LoansPage;
