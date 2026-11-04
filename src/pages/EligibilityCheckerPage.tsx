import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { fillCopy, toBanglaNumerals, useLanguage } from '../locales';
import { getEligibilityCopy } from '../locales/eligibility';
import {
  checkEligibility,
  CibStatus,
  EligibilityResponse,
  EligibilityVerdict,
  EmploymentType,
  groupResultsByVerdict,
} from '../services/eligibility';
import { CreditCard } from '../types';
import { slugify } from '../utils/slugify';

import './EligibilityCheckerPage.css';

type LoadState = 'idle' | 'loading' | 'error' | 'done';
type TinAnswer = 'unset' | 'yes' | 'no';

const VERDICT_CLASS: Record<EligibilityVerdict, string> = {
  eligible: 'verdict-eligible',
  likely: 'verdict-likely',
  unknown: 'verdict-unknown',
  not_yet: 'verdict-not-yet',
};

const EligibilityCheckerPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getEligibilityCopy(lang);
  const isBn = lang === 'bn';

  const [income, setIncome] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('salaried');
  const [age, setAge] = useState<string>('');
  const [hasTin, setHasTin] = useState<TinAnswer>('unset');
  const [cibStatus, setCibStatus] = useState<CibStatus>('unknown');
  const [islamicOnly, setIslamicOnly] = useState<boolean>(false);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [result, setResult] = useState<EligibilityResponse | null>(null);

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
      const response = await checkEligibility({
        monthlyIncome: parsedIncome,
        employmentType,
        age: parsedAge !== undefined && Number.isFinite(parsedAge) ? parsedAge : undefined,
        hasTin: hasTin === 'unset' ? undefined : hasTin === 'yes',
        cibStatus,
        islamicOnly,
      });
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

  const renderCardTile = (card: CreditCard, reasons: string[]) => {
    const detailPath = `/card/${slugify(card.bankName ?? '')}/${slugify(card.name)}`;
    return (
      <article key={card.id} className="eligibility-card-tile">
        <h4>
          <Link to={detailPath}>{card.name}</Link>
        </h4>
        <p className="eligibility-card-bank">{card.bankName}</p>
        <dl className="eligibility-card-facts">
          <div>
            <dt>{copy.annualFee}</dt>
            <dd>{card.annualFee === null ? copy.noMinIncome : formatMoney(card.annualFee)}</dd>
          </div>
          <div>
            <dt>{copy.apr}</dt>
            <dd>
              {card.interestRateApr === null
                ? copy.noMinIncome
                : `${isBn ? toBanglaNumerals(card.interestRateApr) : card.interestRateApr}%`}
            </dd>
          </div>
          <div>
            <dt>{copy.minIncome}</dt>
            <dd>{formatMoney(card.minMonthlyIncome)}</dd>
          </div>
        </dl>
        <ul className="eligibility-reasons">
          {reasons.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p className="eligibility-card-links">
          <Link to={detailPath}>{copy.viewDetails}</Link>
          {' · '}
          <Link to={`/compare?ids=${card.id}`}>{copy.compare}</Link>
        </p>
      </article>
    );
  };

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
              <li key={verdict} className={`eligibility-count-chip ${VERDICT_CLASS[verdict]}`}>
                {verdictLabel(verdict)}: {formatCount(result.counts[verdict])}
              </li>
            ))}
          </ul>

          {result.totalCards === 0 ? (
            <p className="eligibility-status">{copy.emptyResults}</p>
          ) : (
            groups.map(group => (
              <section key={group.verdict} className="eligibility-group">
                <h3 className={VERDICT_CLASS[group.verdict]}>
                  {verdictLabel(group.verdict)} ({formatCount(group.items.length)})
                </h3>
                <p className="eligibility-group-hint">{verdictHint(group.verdict)}</p>
                <div className="eligibility-tiles">
                  {group.items.map(item => renderCardTile(item.card, item.reasons))}
                </div>
              </section>
            ))
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
