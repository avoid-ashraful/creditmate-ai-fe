import React, { useMemo, useState } from 'react';

import {
  Badge,
  Money,
  ResultCard,
  StatusChip,
  TrustChip,
  type StatusChipTone,
} from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { readEligibilitySession, saveEligibilitySession } from '../lib/eligibilitySession';
import { fillCopy, formatLocalizedDate, toBanglaNumerals, useLanguage } from '../locales';
import { getEligibilityCopy } from '../locales/eligibility';
import {
  checkEligibility,
  CibStatus,
  EligibilityProfile,
  EligibilityResponse,
  EligibilityResultItem,
  EligibilityVerdict,
  EmploymentType,
  groupResultsByVerdict,
} from '../services/eligibility';
import { CreditCard } from '../types';
import { slugify } from '../utils/slugify';

import './EligibilityCheckerPage.css';

type LoadState = 'idle' | 'loading' | 'error' | 'done';
type TinAnswer = 'unset' | 'yes' | 'no';
type ResultSort = 'score' | 'fee';

const VERDICT_CLASS: Record<EligibilityVerdict, string> = {
  eligible: 'verdict-eligible',
  likely: 'verdict-likely',
  unknown: 'verdict-unknown',
  not_yet: 'verdict-not-yet',
};

/** Verdicts in the one StatusChip grammar (Phase 4 inventory). */
const VERDICT_TONE: Record<EligibilityVerdict, StatusChipTone> = {
  eligible: 'positive',
  likely: 'info',
  unknown: 'neutral',
  not_yet: 'negative',
};

const EligibilityCheckerPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getEligibilityCopy(lang);
  const isBn = lang === 'bn';

  // Arriving with a check already done this session (e.g. from a card
  // page) prefills the form from the session-only copy — the inputs are
  // never stored anywhere longer-lived (plan Section 4.9).
  const [sessionProfile] = useState<EligibilityProfile | null>(
    () => readEligibilitySession()?.profile ?? null
  );
  const [income, setIncome] = useState<string>(
    sessionProfile ? String(sessionProfile.monthlyIncome) : ''
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    sessionProfile?.employmentType ?? 'salaried'
  );
  const [age, setAge] = useState<string>(
    sessionProfile?.age !== undefined ? String(sessionProfile.age) : ''
  );
  const [hasTin, setHasTin] = useState<TinAnswer>(
    sessionProfile?.hasTin === undefined ? 'unset' : sessionProfile.hasTin ? 'yes' : 'no'
  );
  const [cibStatus, setCibStatus] = useState<CibStatus>(sessionProfile?.cibStatus ?? 'unknown');
  const [islamicOnly, setIslamicOnly] = useState<boolean>(sessionProfile?.islamicOnly ?? false);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const [sort, setSort] = useState<ResultSort>('score');
  const shortlist = useShortlist();

  useSeoMeta({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: '/eligibility-checker',
  });

  const formatMoney = (value: number | null | undefined): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) return copy.noMinIncome;
    const text = Math.round(value).toLocaleString('en-US');
    return isBn ? `৳${toBanglaNumerals(text)}` : `BDT ${text}`;
  };

  const formatCount = (value: number): string =>
    isBn ? toBanglaNumerals(value) : value.toLocaleString('en-US');

  const groups = useMemo(() => (result ? groupResultsByVerdict(result.results) : []), [result]);
  const cardsWithMinimum = useMemo(
    () =>
      result
        ? result.results.filter(
            item => item.card.minMonthlyIncome !== null && item.card.minMonthlyIncome !== undefined
          ).length
        : 0,
    [result]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedIncome = Number(income);
    if (income.trim() === '' || !Number.isFinite(parsedIncome) || parsedIncome < 0) {
      setIncomeError(copy.incomeRequired);
      return;
    }
    setIncomeError(null);
    setLoadState('loading');
    try {
      const parsedAge = age.trim() === '' ? undefined : Number(age);
      const profile: EligibilityProfile = {
        monthlyIncome: parsedIncome,
        employmentType,
        age: parsedAge !== undefined && Number.isFinite(parsedAge) ? parsedAge : undefined,
        hasTin: hasTin === 'unset' ? undefined : hasTin === 'yes',
        cibStatus,
        islamicOnly,
      };
      const response = await checkEligibility(profile);
      // Session-only mirror so card pages can show "your check this
      // session" and a return visit prefills the form. The endpoint
      // itself stores nothing; this never leaves sessionStorage.
      saveEligibilitySession(profile, response);
      setResult(response);
      setLoadState('done');
    } catch {
      setLoadState('error');
    }
  };

  const verdictLabel = (verdict: EligibilityVerdict): string =>
    verdict === 'eligible'
      ? copy.verdictEligible
      : verdict === 'likely'
      ? copy.verdictLikely
      : verdict === 'unknown'
      ? copy.verdictUnknown
      : copy.verdictNotYet;

  const verdictHint = (verdict: EligibilityVerdict): string =>
    verdict === 'eligible'
      ? copy.verdictEligibleHint
      : verdict === 'likely'
      ? copy.verdictLikelyHint
      : verdict === 'unknown'
      ? copy.verdictUnknownHint
      : copy.verdictNotYetHint;

  const detailPathFor = (card: CreditCard): string =>
    `/card/${slugify(card.bankName ?? '')}/${slugify(card.name)}`;

  const toggleShortlist = (card: CreditCard) => {
    shortlist.toggle({
      vertical: 'cards',
      key: String(card.id),
      cardId: card.id,
      name: card.name,
      bankName: card.bankName ?? '',
      detailHref: detailPathFor(card),
    });
  };

  // One canonical result shape everywhere on this page: the discovery
  // ResultCard, with the checker's reasons quoted as its children and a
  // working shortlist action (no more single-card compare links).
  const renderResultCard = (item: EligibilityResultItem, showVerdictBadge = false) => {
    const { card } = item;
    const score = card.creditmateScore ?? null;
    return (
      <ResultCard
        key={card.id}
        bankName={card.bankName ?? ''}
        productName={card.name}
        detailHref={detailPathFor(card)}
        heroValue={
          score !== null ? (
            <span>
              {score.toFixed(1)}
              <span className="eligibility-score-scale"> / 10</span>
            </span>
          ) : (
            <Money value={card.annualFee} />
          )
        }
        heroLabel={score !== null ? copy.scoreLabel : copy.annualFee}
        supportingFacts={[
          { label: copy.annualFee, value: <Money value={card.annualFee} /> },
          {
            label: copy.apr,
            // A null APR on a conventional card is unpublished data; on an
            // Islamic card APR structurally does not apply (§3.6 vocabulary).
            value:
              card.interestRateApr === null
                ? card.isIslamic
                  ? copy.notApplicable
                  : copy.noMinIncome
                : `${isBn ? toBanglaNumerals(card.interestRateApr) : card.interestRateApr}%`,
          },
          { label: copy.minIncome, value: formatMoney(card.minMonthlyIncome) },
        ]}
        badges={
          showVerdictBadge ? (
            <StatusChip tone={VERDICT_TONE[item.verdict]}>{verdictLabel(item.verdict)}</StatusChip>
          ) : undefined
        }
        trustChip={
          card.verifiedAt ? (
            <TrustChip
              source={copy.sourceLabel}
              dateLabel={formatLocalizedDate(card.verifiedAt, lang)}
            />
          ) : undefined
        }
        islamic={card.isIslamic}
        inShortlist={shortlist.isInShortlist('cards', String(card.id))}
        onToggleShortlist={() => toggleShortlist(card)}
        defaultExpanded
      >
        <ul className="eligibility-reasons">
          {item.reasons.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </ResultCard>
    );
  };

  const sortItems = (items: EligibilityResultItem[]): EligibilityResultItem[] => {
    const sorted = [...items];
    if (sort === 'fee') {
      sorted.sort((a, b) => (a.card.annualFee ?? Infinity) - (b.card.annualFee ?? Infinity));
    } else {
      sorted.sort((a, b) => (b.card.creditmateScore ?? -1) - (a.card.creditmateScore ?? -1));
    }
    return sorted;
  };

  // Guided shortlist: the top 3 eligible/likely cards by CreditMate
  // Score, each with the checker's own reasons (which quote the real
  // published numbers) — then the full honest four groups below.
  const topPicks = useMemo(() => {
    if (!result) return [];
    return result.results
      .filter(item => item.verdict === 'eligible' || item.verdict === 'likely')
      .sort((a, b) => (b.card.creditmateScore ?? -1) - (a.card.creditmateScore ?? -1))
      .slice(0, 3);
  }, [result]);

  return (
    <div className="eligibility-page">
      <section className="eligibility-hero">
        <h1>{copy.heading}</h1>
        <p>{copy.intro}</p>
      </section>

      <p className="eligibility-estimate-banner" role="note">
        {copy.estimateBanner}
      </p>

      <section className="eligibility-form-section">
        <h2>{copy.formHeading}</h2>
        <form className="eligibility-form" onSubmit={handleSubmit} noValidate>
          <div className="eligibility-field">
            <label htmlFor="eligibility-income">{copy.monthlyIncome}</label>
            <input
              id="eligibility-income"
              name="monthly_income"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder={copy.monthlyIncomePlaceholder}
              value={income}
              onChange={event => setIncome(event.target.value)}
              aria-invalid={incomeError ? true : undefined}
              aria-describedby={incomeError ? 'eligibility-income-error' : undefined}
            />
            {incomeError && (
              <p className="field-error" id="eligibility-income-error">
                {incomeError}
              </p>
            )}
          </div>

          <div className="eligibility-field">
            <label htmlFor="eligibility-employment">{copy.employmentType}</label>
            <select
              id="eligibility-employment"
              name="employment_type"
              value={employmentType}
              onChange={event => setEmploymentType(event.target.value as EmploymentType)}
            >
              <option value="salaried">{copy.employmentSalaried}</option>
              <option value="self_employed">{copy.employmentSelfEmployed}</option>
              <option value="other">{copy.employmentOther}</option>
            </select>
          </div>

          <div className="eligibility-field">
            <label htmlFor="eligibility-age">
              {copy.age} <span className="eligibility-optional">({copy.ageOptional})</span>
            </label>
            <input
              id="eligibility-age"
              name="age"
              type="number"
              min="0"
              max="120"
              inputMode="numeric"
              value={age}
              onChange={event => setAge(event.target.value)}
            />
          </div>

          <div className="eligibility-field">
            <label htmlFor="eligibility-tin">{copy.hasTin}</label>
            <select
              id="eligibility-tin"
              name="has_tin"
              value={hasTin}
              onChange={event => setHasTin(event.target.value as TinAnswer)}
            >
              <option value="unset">{copy.hasTinUnset}</option>
              <option value="yes">{copy.hasTinYes}</option>
              <option value="no">{copy.hasTinNo}</option>
            </select>
          </div>

          <div className="eligibility-field">
            <label htmlFor="eligibility-cib">{copy.cibStatus}</label>
            <select
              id="eligibility-cib"
              name="cib_status"
              value={cibStatus}
              onChange={event => setCibStatus(event.target.value as CibStatus)}
            >
              <option value="clean">{copy.cibClean}</option>
              <option value="has_issues">{copy.cibHasIssues}</option>
              <option value="unknown">{copy.cibUnknown}</option>
            </select>
            <p className="eligibility-field-help">{copy.cibHelp}</p>
          </div>

          <div className="eligibility-field eligibility-field-checkbox">
            <label>
              <input
                type="checkbox"
                name="islamic_only"
                checked={islamicOnly}
                onChange={event => setIslamicOnly(event.target.checked)}
              />{' '}
              {copy.islamicOnly}
            </label>
          </div>

          <button type="submit" className="eligibility-submit" disabled={loadState === 'loading'}>
            {loadState === 'loading' ? copy.checking : copy.submit}
          </button>
          <p className="eligibility-privacy">{copy.privacyNote}</p>
        </form>
      </section>

      {loadState === 'loading' && (
        <p className="eligibility-status" role="status">
          {copy.loadingLabel}
        </p>
      )}

      {loadState === 'error' && (
        <section className="eligibility-status eligibility-error" role="alert">
          <p>{copy.errorResults}</p>
          <button type="button" onClick={handleSubmit}>
            {copy.retry}
          </button>
        </section>
      )}

      {loadState === 'done' && result && (
        <section className="eligibility-results" aria-live="polite">
          <h2>{copy.resultsHeading}</h2>
          <p>{fillCopy(copy.totalConsidered, { total: formatCount(result.totalCards) })}</p>
          <p className="eligibility-coverage">
            {fillCopy(copy.coverageNote, {
              withMin: formatCount(cardsWithMinimum),
              total: formatCount(result.totalCards),
            })}
          </p>

          <ul className="eligibility-counts">
            {(['eligible', 'likely', 'unknown', 'not_yet'] as EligibilityVerdict[]).map(verdict => (
              <li key={verdict}>
                <StatusChip tone={VERDICT_TONE[verdict]}>
                  {verdictLabel(verdict)}: {formatCount(result.counts[verdict])}
                </StatusChip>
              </li>
            ))}
          </ul>

          {result.totalCards === 0 ? (
            <p className="eligibility-status">{copy.emptyResults}</p>
          ) : (
            <>
              {topPicks.length > 0 && (
                <section className="eligibility-group" aria-labelledby="eligibility-top-picks">
                  <h3 id="eligibility-top-picks">{copy.topPicksHeading}</h3>
                  <p className="eligibility-group-hint">{copy.topPicksNote}</p>
                  <div className="eligibility-tiles">
                    {topPicks.map(item => renderResultCard(item, true))}
                  </div>
                </section>
              )}

              <div className="eligibility-sort">
                <label htmlFor="eligibility-sort">{copy.sortLabel}</label>
                <select
                  id="eligibility-sort"
                  value={sort}
                  onChange={event => setSort(event.target.value as ResultSort)}
                >
                  <option value="score">{copy.sortScore}</option>
                  <option value="fee">{copy.sortFeeAsc}</option>
                </select>
              </div>

              {groups.map(group => (
                <section key={group.verdict} className="eligibility-group">
                  <h3 className={VERDICT_CLASS[group.verdict]}>
                    {verdictLabel(group.verdict)} ({formatCount(group.items.length)})
                  </h3>
                  <p className="eligibility-group-hint">{verdictHint(group.verdict)}</p>
                  <div className="eligibility-tiles">
                    {sortItems(group.items).map(item => renderResultCard(item))}
                  </div>
                </section>
              ))}
            </>
          )}

          {result.notes.length > 0 && (
            <section className="eligibility-notes">
              <h3>{copy.notesHeading}</h3>
              <ul>
                {result.notes.map(note => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="eligibility-method">
            <h3>{copy.howItWorks}</h3>
            <p>{result.method}</p>
            <p>{result.disclaimer}</p>
          </section>

          <button
            type="button"
            className="eligibility-submit"
            onClick={() => {
              setResult(null);
              setLoadState('idle');
            }}
          >
            {copy.checkAnother}
          </button>
        </section>
      )}

      <p className="eligibility-estimate-banner" role="note">
        {copy.estimateBanner}
      </p>
    </div>
  );
};

export default EligibilityCheckerPage;
