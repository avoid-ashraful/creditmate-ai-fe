/**
 * Bank accounts discovery (redesign plan Section 4.7).
 *
 * ONE ranked list replaces the old succession of tables: accounts ranked
 * by net annual value at the user's balance (interest at the slab that
 * applies, minus the annualised maintenance, card, SMS and online fees —
 * the backend's maths, unchanged). Products that cannot honestly be
 * ranked stay visible in clearly labelled groups: segment-specific
 * accounts and accounts whose fees are not published. Rate slabs are
 * never collapsed; ranges rank at the lower bound with the at-max figure
 * shown. All state lives in the URL; the scenario re-runs automatically.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DiscoveryError, DiscoveryLayout, DiscoverySkeleton } from '../components/discovery';
import {
  Badge,
  Button,
  Checkbox,
  Money,
  MoneyInput,
  ResultCard,
  TrustChip,
  UnknownValue,
  useToast,
} from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { formatTaka } from '../lib/format';
import { useProfile } from '../lib/profile';
import { fillCopy, getDiscoveryCopy, getShellCopy, useLanguage } from '../locales';
import { getAccountsCopy, segmentLabel } from '../locales/accounts';
import {
  AccountProduct,
  AccountScenarioResponse,
  AccountScenarioResult,
  AccountSegment,
  AccountType,
  getAccountProducts,
  runAccountScenario,
} from '../services/bankAccounts';
import { fetchAllPages } from '../utils/fetchAllPages';

import './AccountsPage.css';

const BALANCE_PRESETS = [10000, 50000, 100000, 300000, 1000000];
const SEGMENTS: AccountSegment[] = [
  'general',
  'women',
  'student',
  'senior',
  'salary',
  'nrb',
  'digital',
  'minor',
  'inclusion',
  'premium',
];

const formatDate = (iso: string | null): string =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

const feeValue = (value: number | null): React.ReactNode =>
  value === null ? <UnknownValue kind="not-published" /> : <Money value={value} decimals={2} />;

const AccountsPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAccountsCopy(lang);
  const discoveryCopy = getDiscoveryCopy(lang);
  const shellCopy = getShellCopy(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const shortlist = useShortlist();
  const { profile } = useProfile();

  useSeoMeta({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: '/accounts',
  });

  const [accountType, setAccountType] = useState<AccountType>(
    searchParams.get('type') === 'current' ? 'current' : 'savings'
  );
  const [balance, setBalance] = useState<string>(
    searchParams.get('balance') ?? String(profile.balance)
  );
  const [bank, setBank] = useState<string>(searchParams.get('bank') ?? '');
  const [segment, setSegment] = useState<string>(searchParams.get('segment') ?? '');
  const [islamicOnly, setIslamicOnly] = useState<boolean>(searchParams.get('islamic') === '1');

  const [products, setProducts] = useState<AccountProduct[]>([]);
  const [scenario, setScenario] = useState<AccountScenarioResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const runTokenRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(page => getAccountProducts({ page, pageSize: 100, includeVariants: true }))
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
    products.forEach(product => seen.set(product.bank.id, product.bank.name));
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // URL sync (replace).
  useEffect(() => {
    const next = new URLSearchParams();
    if (accountType !== 'savings') next.set('type', accountType);
    if (balance !== String(profile.balance)) next.set('balance', balance);
    if (bank) next.set('bank', bank);
    if (segment) next.set('segment', segment);
    if (islamicOnly) next.set('islamic', '1');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType, balance, bank, segment, islamicOnly]);

  // Auto-run the scenario (debounced) at the current balance.
  useEffect(() => {
    const parsed = balance.trim() === '' ? null : Number(balance);
    if (parsed === null || !Number.isFinite(parsed) || parsed < 0) {
      setBalanceError(copy.errorBalance);
      return;
    }
    setBalanceError(null);
    const token = ++runTokenRef.current;
    const timer = setTimeout(() => {
      setIsRunning(true);
      setRunError(null);
      runAccountScenario({
        averageBalance: Math.round(parsed * 100) / 100,
        accountType,
        segments:
          segment && (SEGMENTS as string[]).includes(segment)
            ? [segment as AccountSegment]
            : undefined,
        bank: bank ? Number(bank) : undefined,
        islamicOnly,
      })
        .then(response => {
          if (runTokenRef.current === token) setScenario(response);
        })
        .catch(() => {
          if (runTokenRef.current === token) {
            setRunError(copy.scenarioError);
            setScenario(null);
          }
        })
        .finally(() => {
          if (runTokenRef.current === token) setIsRunning(false);
        });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, accountType, bank, segment, islamicOnly, retryNonce]);

  // Scenario carry-forward (redesign Phase 2): detail links keep the
  // balance the user is evaluating, so the detail page's calculator
  // strip opens prefilled with the same balance.
  const detailHrefFor = (slug: string): string =>
    balance ? `/accounts/${slug}?balance=${encodeURIComponent(balance)}` : `/accounts/${slug}`;

  const toggleShortlist = (result: AccountScenarioResult) => {
    const outcome = shortlist.toggle({
      vertical: 'accounts',
      key: result.product.slug,
      name: result.product.name,
      bankName: result.product.bank.name,
      detailHref: detailHrefFor(result.product.slug),
    });
    if (outcome === 'full') {
      toast({ message: fillCopy(shellCopy.shortlistFull, { count: '4' }), variant: 'warning' });
    } else if (outcome === 'added') {
      toast({ message: fillCopy(shellCopy.shortlistAdded, { name: result.product.name }) });
    } else {
      toast({ message: fillCopy(shellCopy.shortlistRemoved, { name: result.product.name }) });
    }
  };

  const renderResult = (result: AccountScenarioResult) => {
    const { product } = result;
    const rateText = result.isRange
      ? `${result.rate}–${result.rateMax ?? result.rate}%`
      : `${result.rate}%`;
    return (
      <ResultCard
        key={product.id}
        bankName={product.bank.name}
        productName={product.name}
        detailHref={detailHrefFor(product.slug)}
        heroValue={<Money value={result.netAnnualValue} decimals={2} />}
        heroLabel={copy.colNet}
        supportingFacts={[
          {
            label: copy.colRate,
            value: `${rateText} · ${
              product.rateType === 'expected_profit' ? copy.expectedProfitLabel : copy.interestLabel
            }`,
          },
          { label: copy.colInterest, value: <Money value={result.interestEarned} decimals={2} /> },
          {
            label: copy.colMaintenance,
            value: feeValue(result.maintenanceFeeAnnual),
          },
        ]}
        badges={
          <>
            {product.isIslamic ? <Badge variant="info">{copy.islamicBadge}</Badge> : null}
            {product.segment !== 'general' ? (
              <Badge>{segmentLabel(copy, product.segment)}</Badge>
            ) : null}
            {!result.feesComplete ? <Badge variant="warning">{copy.partialFeesBadge}</Badge> : null}
            {result.waiversApplied.length > 0 ? (
              <Badge variant="success">{copy.waivedNote}</Badge>
            ) : null}
            {result.isRange ? <Badge>{copy.rateRangeNote}</Badge> : null}
          </>
        }
        trustChip={
          formatDate(product.rateEffectiveDate ?? product.verifiedAt) ? (
            <TrustChip
              source={copy.sourceSocLabel}
              dateLabel={formatDate(product.rateEffectiveDate ?? product.verifiedAt)}
            />
          ) : undefined
        }
        islamic={product.isIslamic}
        inShortlist={shortlist.isInShortlist('accounts', product.slug)}
        onToggleShortlist={() => toggleShortlist(result)}
      >
        <dl className="cm-card-facts">
          <div>
            <dt>{copy.colCard}</dt>
            <dd>{feeValue(result.debitCardFeeAnnual)}</dd>
          </div>
          <div>
            <dt>{copy.colSms}</dt>
            <dd>{feeValue(result.smsFeeAnnual)}</dd>
          </div>
          <div>
            <dt>{copy.colOnline}</dt>
            <dd>{feeValue(result.onlineBankingFeeAnnual)}</dd>
          </div>
        </dl>
        {result.isRange && result.interestEarnedAtMaxRate !== null ? (
          <p className="cm-discovery-note">
            {copy.colInterest}:{' '}
            {fillCopy(copy.atMaxRateNote, {
              rate: String(result.rateMax ?? result.rate),
              amount: formatTaka(result.interestEarnedAtMaxRate, { decimals: 2 }),
            })}
          </p>
        ) : null}
        {result.isRange && result.netAnnualValueAtMaxRate !== null ? (
          <p className="cm-discovery-note">
            {copy.colNet}:{' '}
            {fillCopy(copy.atMaxRateNote, {
              rate: String(result.rateMax ?? result.rate),
              amount: formatTaka(result.netAnnualValueAtMaxRate, { decimals: 2 }),
            })}
          </p>
        ) : null}
        {result.interestBlockedByMinBalance && product.minBalanceToEarn !== null ? (
          <p className="cm-discovery-note">
            {fillCopy(copy.minBalanceInterestNote, {
              amount: formatTaka(product.minBalanceToEarn),
            })}
          </p>
        ) : null}
        {result.basisNote ? <p className="cm-discovery-note">{result.basisNote}</p> : null}
        {product.variantOf ? (
          <p className="cm-discovery-note">
            {fillCopy(copy.variantOfNote, { name: product.variantOf.name })}
          </p>
        ) : null}
      </ResultCard>
    );
  };

  const filters = (
    <div>
      <h3 className="cm-filter-group-label">{discoveryCopy.scenarioHeading}</h3>
      <div className="cm-filter-group" role="group" aria-label={copy.heading}>
        <div className="cm-filter-options">
          <Button
            variant={accountType === 'savings' ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={accountType === 'savings'}
            onClick={() => setAccountType('savings')}
          >
            {copy.tabSavings}
          </Button>
          <Button
            variant={accountType === 'current' ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={accountType === 'current'}
            onClick={() => setAccountType('current')}
          >
            {copy.tabCurrent}
          </Button>
        </div>
      </div>
      <MoneyInput
        label={copy.balanceLabel}
        value={balance === '' ? null : Number(balance)}
        onValueChange={value => setBalance(value === null ? '' : String(value))}
        error={balanceError ?? undefined}
      />
      <div className="cm-filter-options" role="group" aria-label={copy.balancePresetsLabel}>
        {BALANCE_PRESETS.map(preset => (
          <Button
            key={preset}
            variant={Number(balance) === preset ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={Number(balance) === preset}
            onClick={() => setBalance(String(preset))}
          >
            <Money value={preset} />
          </Button>
        ))}
      </div>
      <div className="cm-filter-group">
        <label className="cm-filter-group-label" htmlFor="accounts-bank-select">
          {copy.bankLabel}
        </label>
        <select
          id="accounts-bank-select"
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
      <div className="cm-filter-group">
        <label className="cm-filter-group-label" htmlFor="accounts-segment-select">
          {copy.segmentLabel}
        </label>
        <select
          id="accounts-segment-select"
          className="cm-select"
          value={segment}
          onChange={event => setSegment(event.target.value)}
        >
          <option value="">{copy.allSegmentsOption}</option>
          {SEGMENTS.map(value => (
            <option key={value} value={value}>
              {segmentLabel(copy, value)}
            </option>
          ))}
        </select>
      </div>
      <div className="cm-filter-options">
        <Checkbox
          label={copy.islamicOnlyLabel}
          checked={islamicOnly}
          onChange={event => setIslamicOnly(event.target.checked)}
        />
      </div>
    </div>
  );

  return (
    <div className="accounts-page">
      <h1>{copy.heading}</h1>
      <p className="cm-discovery-note">{copy.intro}</p>

      <DiscoveryLayout filters={filters} resultCount={scenario?.count ?? null}>
        <h2 className="cm-discovery-section-label">{copy.resultsHeading}</h2>
        <p className="cm-discovery-sortedby" role="status">
          {fillCopy(discoveryCopy.sortedBy, { criterion: copy.rankedByNetValue })}
        </p>
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
              {scenario.results.map(result => renderResult(result))}
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

            {scenario.segmentExcluded.length > 0 ? (
              <>
                <h2 className="cm-discovery-section-label">{copy.segmentExcludedHeading}</h2>
                <p className="cm-discovery-note">{copy.segmentExcludedNote}</p>
                <div className="cm-discovery-list">
                  {scenario.segmentExcluded.map(result => renderResult(result))}
                </div>
              </>
            ) : null}

            {scenario.unrankedWithoutFees.length > 0 ? (
              <>
                <h2 className="cm-discovery-section-label">{copy.unrankedHeading}</h2>
                <p className="cm-discovery-note">{copy.unrankedNote}</p>
                <div className="cm-discovery-list">
                  {scenario.unrankedWithoutFees.map(result => renderResult(result))}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </DiscoveryLayout>

      <section aria-labelledby="accounts-explainer-heading">
        <h2 id="accounts-explainer-heading" className="cm-discovery-section-label">
          {copy.explainerHeading}
        </h2>
        <p className="cm-discovery-note">{copy.explainerBody}</p>
      </section>
    </div>
  );
};

export default AccountsPage;
