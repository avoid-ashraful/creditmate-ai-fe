/**
 * Deposits discovery (redesign plan Section 4.6).
 *
 * The canonical discovery pattern with the scenario as the filter rail:
 * amount/instalment, tenure, TIN, Islamic-only and bank drive the same
 * server scenario as before — maths and ranking are unchanged — and the
 * ranked outcomes render as ResultCards with the net-of-tax maturity as
 * the hero number. Sanchayapatra stays a separated benchmark band, never
 * ranked as a bank. Below the outcomes, the full catalogue is browsable
 * (the list payload carries no rates, so catalogue rows link to detail
 * pages instead of inventing numbers). All state lives in the URL and
 * the scenario re-runs automatically as inputs change.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { DiscoveryError, DiscoveryLayout, DiscoverySkeleton } from '../components/discovery';
import {
  Badge,
  Checkbox,
  Input,
  Money,
  MoneyInput,
  Pagination,
  ResultCard,
  Tabs,
  TrustChip,
  useToast,
} from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { fillCopy, getDiscoveryCopy, getShellCopy, useLanguage } from '../locales';
import { getDepositsCopy } from '../locales/deposits';
import {
  DepositProduct,
  DepositScenarioResponse,
  DepositScenarioResult,
  getDepositProducts,
  runDepositScenario,
} from '../services/deposits';
import { fetchAllPages } from '../utils/fetchAllPages';

const CATALOGUE_PAGE_SIZE = 10;

type ScenarioKind = 'fdr' | 'dps';

const parseNumber = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const formatDate = (iso: string | null): string =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

const DepositsPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getDepositsCopy(lang);
  const discoveryCopy = getDiscoveryCopy(lang);
  const shellCopy = getShellCopy(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const shortlist = useShortlist();

  useSeoMeta({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: '/deposits',
  });

  const [kind, setKind] = useState<ScenarioKind>(
    searchParams.get('kind') === 'dps' ? 'dps' : 'fdr'
  );
  const [amount, setAmount] = useState<string>(searchParams.get('amount') ?? '500000');
  const [instalment, setInstalment] = useState<string>(searchParams.get('instalment') ?? '5000');
  const [months, setMonths] = useState<string>(searchParams.get('months') ?? '12');
  const [hasTin, setHasTin] = useState<boolean>(searchParams.get('tin') !== '0');
  const [islamicOnly, setIslamicOnly] = useState<boolean>(searchParams.get('islamic') === '1');
  const [bank, setBank] = useState<string>(searchParams.get('bank') ?? '');
  const [cataloguePage, setCataloguePage] = useState<number>(
    Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  );

  const [products, setProducts] = useState<DepositProduct[]>([]);
  const [catalogueError, setCatalogueError] = useState(false);
  const [scenario, setScenario] = useState<DepositScenarioResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ amount?: string; months?: string }>({});
  const [retryNonce, setRetryNonce] = useState(0);
  const runTokenRef = useRef(0);

  // Catalogue (for the bank filter and the browsable list).
  useEffect(() => {
    let cancelled = false;
    fetchAllPages(page => getDepositProducts({ page, pageSize: 100 }))
      .then(all => {
        if (!cancelled) setProducts(all.results);
      })
      .catch(() => {
        if (!cancelled) setCatalogueError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bankOptions = useMemo(() => {
    const seen = new Map<number, string>();
    products.forEach(product => {
      if (product.bank !== null) seen.set(product.bank.id, product.bank.name);
    });
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Keep the URL in step with the state (replace — no history spam).
  useEffect(() => {
    const next = new URLSearchParams();
    if (kind !== 'fdr') next.set('kind', kind);
    if (amount !== '500000') next.set('amount', amount);
    if (instalment !== '5000') next.set('instalment', instalment);
    if (months !== '12') next.set('months', months);
    if (!hasTin) next.set('tin', '0');
    if (islamicOnly) next.set('islamic', '1');
    if (bank) next.set('bank', bank);
    if (cataloguePage > 1) next.set('page', String(cataloguePage));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, amount, instalment, months, hasTin, islamicOnly, bank, cataloguePage]);

  // Auto-run the scenario (debounced) whenever its inputs are valid.
  useEffect(() => {
    const parsedMonths = parseNumber(months);
    const nextErrors: { amount?: string; months?: string } = {};
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

    const token = ++runTokenRef.current;
    const timer = setTimeout(() => {
      setIsRunning(true);
      setRunError(null);
      runDepositScenario({
        kind,
        months: parsedMonths,
        hasTin,
        islamicOnly,
        bank: bank ? Number(bank) : undefined,
        ...(kind === 'fdr'
          ? { amount: parsedAmount as number }
          : { monthlyInstalment: parsedInstalment as number }),
      })
        .then(response => {
          if (runTokenRef.current === token) setScenario(response);
        })
        .catch(() => {
          if (runTokenRef.current === token) {
            setRunError(copy.loadError);
            setScenario(null);
          }
        })
        .finally(() => {
          if (runTokenRef.current === token) setIsRunning(false);
        });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, amount, instalment, months, hasTin, islamicOnly, bank, retryNonce]);

  const catalogueOfKind = useMemo(
    () => products.filter(product => product.kind === kind && !product.isBenchmark),
    [products, kind]
  );
  const cataloguePageCount = Math.max(1, Math.ceil(catalogueOfKind.length / CATALOGUE_PAGE_SIZE));
  const catalogueSlice = catalogueOfKind.slice(
    (cataloguePage - 1) * CATALOGUE_PAGE_SIZE,
    cataloguePage * CATALOGUE_PAGE_SIZE
  );

  const toggleShortlist = (result: DepositScenarioResult) => {
    const outcome = shortlist.toggle({
      vertical: 'deposits',
      key: result.product.slug,
      name: result.product.name,
      bankName: result.product.institutionDisplayName,
      detailHref: `/deposits/${result.product.slug}`,
    });
    if (outcome === 'full') {
      toast({ message: fillCopy(shellCopy.shortlistFull, { count: '4' }), variant: 'warning' });
    } else if (outcome === 'added') {
      toast({ message: fillCopy(shellCopy.shortlistAdded, { name: result.product.name }) });
    } else {
      toast({ message: fillCopy(shellCopy.shortlistRemoved, { name: result.product.name }) });
    }
  };

  const renderResult = (result: DepositScenarioResult, benchmark: boolean) => {
    const { product } = result;
    const rateText = result.isRange ? `${result.rateMin}–${result.rateMax}%` : `${result.rateMin}%`;
    return (
      <ResultCard
        key={product.id}
        bankName={product.institutionDisplayName}
        productName={product.name}
        detailHref={`/deposits/${product.slug}`}
        heroValue={<Money value={result.netMaturity} decimals={2} />}
        heroLabel={copy.colNet}
        supportingFacts={[
          {
            label:
              product.rateType === 'expected_profit'
                ? copy.expectedProfitLabel
                : copy.interestLabel,
            value: rateText,
          },
          { label: copy.colGross, value: <Money value={result.grossMaturity} decimals={2} /> },
          { label: copy.colTax, value: <Money value={result.sourceTax} decimals={2} /> },
        ]}
        badges={
          <>
            {product.isIslamic ? <Badge variant="info">{copy.islamicBadge}</Badge> : null}
            {result.rateIsDerived ? <Badge variant="warning">{copy.derivedRateBadge}</Badge> : null}
            {benchmark ? <Badge variant="primary">{copy.benchmarkBadge}</Badge> : null}
            {result.isRange ? <Badge>{copy.rateRangeNote}</Badge> : null}
          </>
        }
        trustChip={
          formatDate(product.rateEffectiveDate ?? product.verifiedAt) ? (
            <TrustChip
              source={product.sourceKind === 'bb_chart' ? 'BB chart' : copy.sourceLabel}
              dateLabel={formatDate(product.rateEffectiveDate ?? product.verifiedAt)}
              marker={result.rateIsDerived ? 'derived' : undefined}
            />
          ) : undefined
        }
        islamic={product.isIslamic}
        inShortlist={shortlist.isInShortlist('deposits', product.slug)}
        onToggleShortlist={() => toggleShortlist(result)}
      >
        <p className="cm-discovery-note">
          {copy.colRate}: {rateText}
          {result.effectiveYieldPercent !== null ? ` · ${result.effectiveYieldPercent}%` : ''}
        </p>
      </ResultCard>
    );
  };

  const filters = (
    <div>
      <h3 className="cm-filter-group-label">{discoveryCopy.scenarioHeading}</h3>
      {kind === 'fdr' ? (
        <MoneyInput
          label={copy.amountLabel}
          value={amount === '' ? null : Number(amount)}
          onValueChange={value => setAmount(value === null ? '' : String(value))}
          error={errors.amount}
        />
      ) : (
        <MoneyInput
          label={copy.instalmentLabel}
          value={instalment === '' ? null : Number(instalment)}
          onValueChange={value => setInstalment(value === null ? '' : String(value))}
          error={errors.amount}
        />
      )}
      <Input
        label={copy.monthsLabel}
        type="number"
        min={1}
        value={months}
        error={errors.months}
        onChange={event => setMonths(event.target.value)}
      />
      <div className="cm-filter-options">
        <Checkbox
          label={copy.hasTinLabel}
          checked={hasTin}
          onChange={event => setHasTin(event.target.checked)}
        />
        <Checkbox
          label={copy.islamicOnlyLabel}
          checked={islamicOnly}
          onChange={event => setIslamicOnly(event.target.checked)}
        />
      </div>
      <div className="cm-filter-group">
        <label className="cm-filter-group-label" htmlFor="deposits-bank-select">
          {copy.bankLabel}
        </label>
        <select
          id="deposits-bank-select"
          className="cm-select"
          value={bank}
          onChange={event => setBank(event.target.value)}
        >
          <option value="">{copy.allBanksOption}</option>
          {bankOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="deposits-page">
      <h1>{copy.heading}</h1>
      <p className="cm-discovery-note">{copy.intro}</p>

      <Tabs
        ariaLabel={copy.heading}
        activeTabId={kind}
        onChange={id => {
          setKind(id as ScenarioKind);
          setCataloguePage(1);
        }}
        tabs={[
          { id: 'fdr', label: copy.tabFdr, content: null },
          { id: 'dps', label: copy.tabDps, content: null },
        ]}
      />

      <DiscoveryLayout filters={filters} resultCount={scenario?.results.length ?? null}>
        <h2 className="cm-discovery-section-label">{copy.resultsHeading}</h2>
        {isRunning && !scenario ? <DiscoverySkeleton /> : null}
        {runError ? (
          <DiscoveryError
            message={runError}
            onRetry={() => {
              setRunError(null);
              setRetryNonce(nonce => nonce + 1);
            }}
          />
        ) : null}
        {scenario ? (
          <>
            <div className="cm-discovery-list" aria-busy={isRunning}>
              {scenario.results.map(result => renderResult(result, false))}
            </div>
            {scenario.results.length === 0 ? (
              <p className="cm-discovery-note">{copy.noResults}</p>
            ) : null}
            {scenario.excludedWithoutRate > 0 ? (
              <p className="cm-discovery-note">
                {fillCopy(copy.excludedNote, { count: String(scenario.excludedWithoutRate) })}
              </p>
            ) : null}
            {scenario.notes.map(note => (
              <p key={note} className="cm-discovery-note">
                {note}
              </p>
            ))}

            {scenario.benchmarks.length > 0 ? (
              <>
                <h2 className="cm-discovery-section-label">{copy.benchmarksHeading}</h2>
                <p className="cm-discovery-note">{copy.benchmarksNote}</p>
                <div className="cm-discovery-list">
                  {scenario.benchmarks.map(result => renderResult(result, true))}
                </div>
              </>
            ) : null}
          </>
        ) : null}

        <h2 className="cm-discovery-section-label">{copy.heading}</h2>
        {catalogueError ? (
          <p className="cm-discovery-note">{copy.loadError}</p>
        ) : (
          <>
            <ul className="cm-catalogue-list">
              {catalogueSlice.map(product => (
                <li key={product.id} className="cm-catalogue-item">
                  <Link to={`/deposits/${product.slug}`} className="cm-catalogue-link">
                    <span className="cm-catalogue-name">{product.name}</span>
                    <span className="cm-catalogue-bank">{product.institutionDisplayName}</span>
                  </Link>
                  <span className="cm-catalogue-meta">
                    {product.tenuresMonths.length > 0
                      ? `${Math.min(...product.tenuresMonths)}–${Math.max(
                          ...product.tenuresMonths
                        )} ${copy.monthsUnit}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
            {cataloguePageCount > 1 ? (
              <div className="cm-discovery-pagination">
                <Pagination
                  page={cataloguePage}
                  pageCount={cataloguePageCount}
                  onChange={setCataloguePage}
                />
              </div>
            ) : null}
          </>
        )}
      </DiscoveryLayout>
    </div>
  );
};

export default DepositsPage;
