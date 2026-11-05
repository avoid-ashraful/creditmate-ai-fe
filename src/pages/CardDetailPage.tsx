/**
 * Card Detail Page — a decision page (redesign plan Section 4.3).
 *
 * Grammar (Section 4.12): a sticky DetailSummary (identity, CreditMate
 * Score, the estimated value at the user's profile spend, the session
 * eligibility signal, provenance chip, actions), a verdict strip, then
 * Layer-2 tabs (fees, rewards, eligibility, features & limits, reviews),
 * ONE deduplicated trust block (score breakdown, provenance, the now
 * public fee-change history), and similar cards drawn cross-bank by
 * CreditMate Score proximity. Every fact and figure is the same data
 * the pre-redesign page showed — only the presentation changed.
 */

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';

import ReportIssueDialog from '../components/ReportIssueDialog';
import { ReviewsSection } from '../components/ReviewsSection';
import { Skeleton } from '../components/Skeleton';
import {
  DetailSummary,
  Money,
  Tabs,
  TrustChip,
  UnknownValue,
  VerdictStrip,
} from '../components/ui';
import { useAuth } from '../hooks/AuthProvider';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { sessionVerdictForCard } from '../lib/eligibilitySession';
import { useProfile } from '../lib/profile';
import {
  useLanguage,
  getAuthCopy,
  getAlertsCopy,
  getCardDetailCopy,
  getDetailCopy,
  getNetworkLabel,
  fillCopy,
  formatLocalizedDate,
  CardDetailCopy,
} from '../locales';
import { getEligibilityCopy } from '../locales/eligibility';
import { getScoreCopy } from '../locales/score';
import { alertsClient } from '../services/alerts';
import { apiService } from '../services/api';
import { CreditCard, RewardCategory } from '../types';
import { describeFeeWaiverPolicy, FeeWaiverLabels } from '../utils/feeWaiver';
import { getComparisonSummary } from '../utils/narratives';
import { computeCardEstimate } from '../utils/rewardCalculator';
import { slugify } from '../utils/slugify';
import { breadcrumbJsonLd } from '../utils/structuredData';
import { summarizeCardText } from '../utils/summarizeCardText';
import '../styles/CardDetailPage.css';
import '../styles/DecisionDetail.css';

// Trust sections (provenance + field history) are split out of the main
// bundle; they render below the fold on this page.
const CardTrustSections = React.lazy(() => import('../components/CardTrustSections'));

// The CreditMate Score section is likewise below the fold; lazy-load it
// to keep the main bundle inside its budget.
const ScoreSection = React.lazy(() => import('../components/ScoreSection'));

const CARD_DETAIL_PAGE = 'card-detail-page';
const SPEC_KEY_CLASS = 'spec-key';
const SPEC_VALUE_CLASS = 'spec-value';

/** Display label key per structured reward rule category. */
const REWARD_CATEGORY_LABELS: Record<RewardCategory, keyof CardDetailCopy> = {
  all: 'rewardCategoryAll',
  dining: 'rewardCategoryDining',
  travel: 'rewardCategoryTravel',
  groceries: 'rewardCategoryGroceries',
  fuel: 'rewardCategoryFuel',
  online: 'rewardCategoryOnline',
  international: 'rewardCategoryInternational',
  other: 'rewardCategoryOther',
};

/** Why a similar card is similar, from real attributes only. */
const similarReason = (
  card: CreditCard,
  candidate: CreditCard,
  detail: ReturnType<typeof getDetailCopy>,
  networkName: string | null
): string => {
  const reasons: string[] = [];
  if (networkName && candidate.cardNetwork && candidate.cardNetwork === card.cardNetwork) {
    reasons.push(fillCopy(detail.similarReasonSameNetwork, { network: networkName }));
  }
  if (
    candidate.annualFee !== null &&
    card.annualFee !== null &&
    candidate.annualFee < card.annualFee
  ) {
    reasons.push(detail.similarReasonLowerFee);
  }
  if (
    card.creditmateScore != null &&
    candidate.creditmateScore != null &&
    Math.abs(candidate.creditmateScore - card.creditmateScore) <= 1
  ) {
    reasons.push(detail.similarReasonCloseScore);
  }
  if (reasons.length === 0) reasons.push(detail.similarReasonTopScore);
  return `${detail.similarReasonPrefix} ${reasons.join(' · ')}`;
};

const CardDetailPage: React.FC = () => {
  const { bankSlug, cardSlug } = useParams<{ bankSlug: string; cardSlug: string }>();
  const { status: authStatus } = useAuth();
  const { lang } = useLanguage();
  const authCopy = getAuthCopy(lang);
  const alertsCopy = getAlertsCopy(lang);
  const copy = getCardDetailCopy(lang);
  const detail = getDetailCopy(lang);
  const eligibilityCopy = getEligibilityCopy(lang);
  const scoreCopy = getScoreCopy(lang);
  const shortlist = useShortlist();
  const { profile } = useProfile();

  const [card, setCard] = useState<CreditCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<'invalid' | 'notFound' | 'failed' | null>(null);
  const [similarCards, setSimilarCards] = useState<CreditCard[]>([]);
  const [ctaClicked, setCtaClicked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Watch this card state
  const [isWatching, setIsWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchError, setWatchError] = useState<string | null>(null);

  const cardPath =
    card?.bankName && card.name ? `/card/${slugify(card.bankName)}/${slugify(card.name)}` : null;
  useSeoMeta(
    card
      ? {
          title: fillCopy(copy.seoTitle, {
            name: card.name,
            bank: card.bankName ?? copy.seoBankFallback,
          }),
          description: fillCopy(copy.seoDescription, {
            name: card.name,
            bank: card.bankName ?? copy.seoBankFallback,
            fee: card.annualFee === null ? copy.notPublished : `${copy.bdt} ${card.annualFee}`,
            apr: card.interestRateApr === null ? copy.notPublished : `${card.interestRateApr}%`,
          }),
          canonicalPath: cardPath ?? undefined,
          jsonLd: cardPath
            ? breadcrumbJsonLd(window.location.origin, [
                { name: 'Home', path: '/' },
                { name: card.name, path: cardPath },
              ])
            : undefined,
        }
      : null
  );

  // Check if user is already watching this card
  const checkWatchStatus = useCallback(
    async (cardId: number) => {
      if (authStatus !== 'authenticated') return;
      try {
        const subsRes = await alertsClient.listSubscriptions();
        const watching = subsRes.results.some(
          sub => sub.card === cardId && sub.kind === 'any_change'
        );
        setIsWatching(watching);
      } catch (err) {
        console.error('Failed to check watch status:', err);
      }
    },
    [authStatus]
  );

  useEffect(() => {
    let cancelled = false;
    const fetchCardDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!bankSlug || !cardSlug) {
          setError('invalid');
          return;
        }

        const response = await apiService.getCreditCards({
          searchTerm: cardSlug.replace(/-/g, ' '),
          page_size: 100,
        });
        const allCards = response.results.map(c => apiService.transformCreditCard(c));

        const foundCard = allCards.find(
          c =>
            c.bankName &&
            slugify(c.bankName) === slugify(bankSlug) &&
            slugify(c.name) === slugify(cardSlug)
        );
        if (cancelled) return;

        if (!foundCard) {
          setError('notFound');
          return;
        }

        setCard(foundCard);
        analytics.track(ANALYTICS_EVENTS.cardDetailView, {
          cardId: foundCard.id,
          bank: foundCard.bankName,
        });

        // Check watch status
        checkWatchStatus(foundCard.id);

        // Similar cards: cross-bank, nearest CreditMate Score first
        // (plan Section 4.3) — never same-bank siblings. The catalogue
        // is small, so one score-ordered page covers the candidates.
        try {
          const poolResponse = await apiService.getCreditCards({
            ordering: '-creditmate_score',
            page_size: 100,
          });
          if (cancelled) return;
          const pool = poolResponse.results
            .map(c => apiService.transformCreditCard(c))
            .filter(c => c.id !== foundCard.id && c.bankId !== foundCard.bankId);
          const byProximity = [...pool].sort((a, b) => {
            const aScore = a.creditmateScore ?? null;
            const bScore = b.creditmateScore ?? null;
            if (foundCard.creditmateScore != null && aScore !== null && bScore !== null) {
              const diff =
                Math.abs(aScore - foundCard.creditmateScore) -
                Math.abs(bScore - foundCard.creditmateScore);
              if (diff !== 0) return diff;
              return bScore - aScore;
            }
            if (aScore !== null && bScore === null) return -1;
            if (aScore === null && bScore !== null) return 1;
            return 0;
          });
          setSimilarCards(byProximity.slice(0, 3));
        } catch {
          if (!cancelled) setSimilarCards([]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch card details:', err);
        setError('failed');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCardDetail();

    return () => {
      cancelled = true;
    };
  }, [bankSlug, cardSlug, checkWatchStatus]);

  // Re-check watch status when auth status changes
  useEffect(() => {
    if (card && authStatus === 'authenticated') {
      checkWatchStatus(card.id);
    }
  }, [authStatus, card, checkWatchStatus]);

  const handleApplyNow = () => {
    if (card) {
      analytics.track(ANALYTICS_EVENTS.cardSelect, {
        cardId: card.id,
      });
      setCtaClicked(true);
    }
  };

  const handleWatchToggle = async () => {
    if (!card) return;

    if (authStatus !== 'authenticated') {
      // Show login/register prompt
      return;
    }

    setWatchLoading(true);
    setWatchError(null);

    try {
      if (isWatching) {
        // Find the subscription to delete
        const subsRes = await alertsClient.listSubscriptions();
        const sub = subsRes.results.find(s => s.card === card.id && s.kind === 'any_change');
        if (sub) {
          await alertsClient.deleteSubscription(sub.id);
          setIsWatching(false);
        }
      } else {
        // Create new subscription for any_change on this card
        await alertsClient.createSubscription({ card: card.id, kind: 'any_change' });
        setIsWatching(true);
      }
      analytics.track(ANALYTICS_EVENTS.pageView, { referrer: `/card/${bankSlug}/${cardSlug}` });
    } catch (err) {
      console.error('Watch toggle failed:', err);
      setWatchError(alertsCopy.subscriptionCreateError);
    } finally {
      setWatchLoading(false);
    }
  };

  const calculateFeeWaiverThreshold = (): string | null => {
    if (!card?.annualFeeWaiverPolicy) return null;
    const policy = card.annualFeeWaiverPolicy as Record<string, unknown>;
    if (typeof policy.spendThreshold === 'number') {
      return policy.spendThreshold.toLocaleString();
    }
    if (typeof policy.spendThreshold === 'string') {
      const parsed = Number(policy.spendThreshold.replace(/[^\d.]/g, ''));
      return Number.isFinite(parsed) && parsed > 0 ? parsed.toLocaleString() : null;
    }
    return null;
  };

  const formatAnnualFee = (fee: number | null): string => {
    if (fee === null) return copy.notPublished;
    if (fee === 0) return copy.noAnnualFee;
    return `${copy.bdt} ${fee.toLocaleString()}`;
  };

  // null = the bank publishes no figure for the field, '' = explicitly no access.
  const loungeText = (value: string | null): string =>
    value === null ? copy.notPublished : value === '' ? copy.none : value;

  const waiverLabels: FeeWaiverLabels = {
    keys: {
      conditions: copy.waiverKeyConditions,
      spendThreshold: copy.waiverKeySpendThreshold,
      period: copy.waiverKeyPeriod,
    },
    values: { yearly: copy.waiverPeriodYearly, monthly: copy.waiverPeriodMonthly },
    yes: copy.yes,
    no: copy.no,
    currency: copy.bdt,
  };

  const formatFeature = (feature: unknown): string =>
    typeof feature === 'string'
      ? feature
      : describeFeeWaiverPolicy(feature as Record<string, unknown>, waiverLabels).join('; ');

  // Estimated reward value at the user's profile spend. All spend is
  // allocated to the base "other" category — the conservative base-rate
  // assumption, stated on screen. A BDT value exists only when the bank
  // states a point value (the calculator's rule; never invented).
  const estimate = useMemo(() => {
    if (!card) return null;
    return computeCardEstimate(card, {
      dining: 0,
      travel: 0,
      groceries: 0,
      fuel: 0,
      other: profile.monthlySpend,
    });
  }, [card, profile.monthlySpend]);

  if (isLoading) {
    return (
      <div className={CARD_DETAIL_PAGE}>
        <div className="loading-state" role="status" aria-live="polite">
          <Skeleton width="55%" height="32px" />
          <Skeleton width="100%" height="180px" />
          <Skeleton width="100%" height="320px" />
          <p>{copy.loading}</p>
        </div>
      </div>
    );
  }

  const errorMessage = {
    invalid: copy.errorInvalidUrl,
    notFound: copy.errorNotFound,
    failed: copy.errorLoadFailed,
  }[error ?? 'notFound'];

  if (error || !card) {
    return (
      <div className={CARD_DETAIL_PAGE}>
        <div className="error-state">
          <h2>{copy.notFoundTitle}</h2>
          <p>{errorMessage}</p>
          <div className="error-actions">
            <Link to="/" className="btn btn-primary">
              {copy.backToHome}
            </Link>
            <Link to="/compare" className="btn btn-secondary">
              {copy.compareCards}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const feeWaiverThreshold = calculateFeeWaiverThreshold();
  const waiverLines = describeFeeWaiverPolicy(card.annualFeeWaiverPolicy, waiverLabels);
  const cardInsight = getComparisonSummary([card]);
  const annualWaiverSpend = feeWaiverThreshold
    ? Number(feeWaiverThreshold.replace(/,/g, ''))
    : null;

  // Real apply links only: a bank "schedule of charges" (often a fee-schedule
  // PDF) is not an application form, so a card without applyUrl must never
  // show an "Apply" CTA (QA #10). The source URL gets a secondary, truthfully
  // labelled "View fee schedule" link instead.
  const applyHref = card.applyUrl || '';
  const feeScheduleHref = !applyHref ? card.sourceUrl || '' : '';
  const verifiedText = card.verifiedAt
    ? fillCopy(copy.verifiedOn, { date: formatLocalizedDate(card.verifiedAt, lang) })
    : '';
  // Islamic cards charge profit/fees, not interest: don't label a missing APR as unknown interest.
  const aprLabel =
    card.isIslamic && card.interestRateApr === null ? copy.specProfitFeeShariah : copy.apr;
  const networkLabel = getNetworkLabel(copy, card.cardNetwork);
  const notPublishedIfEmpty = (value?: string): string => value || copy.notPublished;

  // QA #12: Islamic cards publish their profit/fee wording in additionalFeatures
  // as an "Interest/charges details: ..." item while interestRateApr is null by
  // design. Show that wording in the Shariah profit/fee row (without the
  // prefix) instead of a generic "not published".
  const PROFIT_FEE_PREFIX = 'Interest/charges details: ';
  const shariahProfitFeeText = (): string => {
    if (card.interestRateApr !== null || !card.isIslamic) return '';
    const item = card.additionalFeatures.find(
      feature => typeof feature === 'string' && feature.startsWith(PROFIT_FEE_PREFIX)
    );
    return typeof item === 'string' ? item.slice(PROFIT_FEE_PREFIX.length) : '';
  };

  const aprText =
    card.interestRateApr === null
      ? shariahProfitFeeText() || copy.notPublished
      : `${card.interestRateApr}% ${copy.apr}`;

  const verdictText = (verdict: string): string =>
    verdict === 'eligible'
      ? eligibilityCopy.verdictEligible
      : verdict === 'likely'
      ? eligibilityCopy.verdictLikely
      : verdict === 'unknown'
      ? eligibilityCopy.verdictUnknown
      : eligibilityCopy.verdictNotYet;

  const score = card.creditmateScore ?? null;
  const netValue =
    estimate && estimate.annualValueBdt !== null && card.annualFee !== null
      ? estimate.annualValueBdt - card.annualFee
      : null;
  const sessionVerdict = sessionVerdictForCard(card.id);
  const inShortlist = shortlist.isInShortlist('cards', String(card.id));
  const handleShortlistToggle = () => {
    shortlist.toggle({
      vertical: 'cards',
      key: String(card.id),
      name: card.name,
      bankName: card.bankName ?? '',
      detailHref: cardPath ?? `/card/${bankSlug}/${cardSlug}`,
      cardId: card.id,
    });
  };

  const verdictItems = [
    ...(score !== null ? [{ label: detail.verdictScore, value: `${score.toFixed(1)} / 10` }] : []),
    ...(netValue !== null
      ? [{ label: detail.verdictNetValue, value: <Money key="nv" value={netValue} /> }]
      : []),
    { label: detail.verdictAnnualFee, value: formatAnnualFee(card.annualFee) },
  ];

  // Render watch toggle or login prompt
  const renderWatchToggle = () => {
    if (authStatus === 'authenticated') {
      return (
        <button
          className={`btn ${isWatching ? 'btn-secondary' : 'btn-outline'} watch-toggle`}
          onClick={handleWatchToggle}
          disabled={watchLoading}
          aria-pressed={isWatching}
        >
          {watchLoading
            ? copy.updating
            : isWatching
            ? alertsCopy.watchingThisCard
            : alertsCopy.watchThisCard}
        </button>
      );
    }

    return (
      <div className="watch-prompt">
        <p className="watch-prompt-text">
          {alertsCopy.watchPromptLogin}
          <Link to="/login" className="watch-prompt-link">
            {' '}
            {authCopy.registerLoginLink}
          </Link>
        </p>
        <p className="watch-prompt-text">
          {alertsCopy.watchPromptRegister}
          <Link to="/register" className="watch-prompt-link">
            {' '}
            {authCopy.loginCreateLink}
          </Link>
        </p>
      </div>
    );
  };

  const feesTab = (
    <section className="specs-section" aria-label={detail.tabFees}>
      <table className="specs-table">
        <tbody>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specAnnualFee}
            </th>
            <td className={SPEC_VALUE_CLASS}>{formatAnnualFee(card.annualFee)}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specSupplementaryFee}
            </th>
            <td className={SPEC_VALUE_CLASS}>{notPublishedIfEmpty(card.supplementaryCardFee)}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specForeignTransactionFee}
            </th>
            <td className={SPEC_VALUE_CLASS}>{notPublishedIfEmpty(card.foreignTransactionFee)}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specCashAdvanceFee}
            </th>
            <td className={SPEC_VALUE_CLASS}>{card.cashAdvanceFee || copy.notPublished}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specLatePaymentFee}
            </th>
            <td className={SPEC_VALUE_CLASS}>{card.latePaymentFee || copy.notPublished}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specFeeWaiverPolicy}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {waiverLines.length ? (
                <ul className="waiver-policy-list">
                  {waiverLines.map(line => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                copy.notPublished
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Fee Waiver Calculator */}
      {feeWaiverThreshold && card.annualFee !== null && card.annualFee > 0 && (
        <section className="fee-waiver-section">
          <h3>{copy.waiverHeading}</h3>
          <div className="waiver-info">
            <p>
              {fillCopy(copy.waiverSummary, {
                fee: `${copy.bdt} ${card.annualFee.toLocaleString()}`,
                threshold: `${copy.bdt} ${feeWaiverThreshold}`,
              })}
            </p>
            <div className="waiver-breakdown">
              <p>
                {fillCopy(copy.waiverMonthly, {
                  amount: annualWaiverSpend
                    ? `${copy.bdt} ${(annualWaiverSpend / 12).toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}`
                    : copy.notPublished,
                })}
              </p>
            </div>
          </div>
        </section>
      )}
    </section>
  );

  const rewardsTab = (
    <div>
      {/* Value-back maths at the user's profile spend */}
      <section className="rewards-estimate-section" aria-label={detail.tabRewards}>
        <dl className="rewards-list">
          <div className="rewards-row">
            <dt className={SPEC_KEY_CLASS}>
              {fillCopy(detail.estNetValueLabel, {
                spend: `${copy.bdt} ${profile.monthlySpend.toLocaleString()}`,
              })}
            </dt>
            <dd className={SPEC_VALUE_CLASS}>
              {estimate && estimate.annualValueBdt !== null ? (
                <>
                  {netValue !== null ? (
                    <Money value={netValue} />
                  ) : (
                    <Money value={estimate.annualValueBdt} />
                  )}{' '}
                  <span className="p2-section-note">
                    {netValue !== null ? detail.estNetValueNote : detail.estValueNote}
                  </span>
                </>
              ) : (
                <UnknownValue kind="not-published" />
              )}
            </dd>
          </div>
          {estimate && estimate.annualPoints !== null && (
            <div className="rewards-row">
              <dt className={SPEC_KEY_CLASS}>{copy.rewardsEarnRules}</dt>
              <dd className={SPEC_VALUE_CLASS}>
                {Math.round(estimate.annualPoints).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Reward program details (structured fields; hidden when the bank publishes none) */}
      {(() => {
        const earnRules = card.rewardEarnRules ?? [];
        const cashbackRules = card.cashbackRules ?? [];
        const hasRewardDetails = Boolean(
          card.rewardProgramName ||
            earnRules.length ||
            cashbackRules.length ||
            card.rewardPointValueBdt != null ||
            card.pointsExpiryText
        );
        if (!hasRewardDetails) return null;
        const rewardCategoryLabel = (category: RewardCategory): string =>
          copy[REWARD_CATEGORY_LABELS[category]] as string;
        return (
          <section className="rewards-section" aria-labelledby="rewards-heading">
            <h3 id="rewards-heading">{copy.rewardsHeading}</h3>
            <dl className="rewards-list">
              {card.rewardProgramName && (
                <div className="rewards-row">
                  <dt className={SPEC_KEY_CLASS}>{copy.rewardsProgram}</dt>
                  <dd className={SPEC_VALUE_CLASS}>{card.rewardProgramName}</dd>
                </div>
              )}
              {earnRules.length > 0 && (
                <div className="rewards-row">
                  <dt className={SPEC_KEY_CLASS}>{copy.rewardsEarnRules}</dt>
                  <dd className={SPEC_VALUE_CLASS}>
                    <ul className="rewards-rule-list">
                      {earnRules.map(rule => (
                        <li key={`${rule.category}-${rule.text}`}>
                          <strong>{rewardCategoryLabel(rule.category)}</strong>:{' '}
                          {fillCopy(copy.rewardsEarnRuleSummary, {
                            points: String(rule.pointsPerUnit),
                            unit: String(rule.spendUnitBdt),
                          })}
                          {rule.text && <span className="reward-rule-text"> — {rule.text}</span>}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {cashbackRules.length > 0 && (
                <div className="rewards-row">
                  <dt className={SPEC_KEY_CLASS}>{copy.rewardsCashbackRules}</dt>
                  <dd className={SPEC_VALUE_CLASS}>
                    <ul className="rewards-rule-list">
                      {cashbackRules.map(rule => (
                        <li key={`${rule.category}-${rule.text}`}>
                          <strong>{rewardCategoryLabel(rule.category)}</strong>:{' '}
                          {fillCopy(copy.rewardsCashbackSummary, {
                            percent: String(rule.percent),
                          })}
                          {rule.capText && <span> ({rule.capText})</span>}
                          {rule.text && <span className="reward-rule-text"> — {rule.text}</span>}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              <div className="rewards-row">
                <dt className={SPEC_KEY_CLASS}>{copy.rewardsPointValue}</dt>
                <dd className={SPEC_VALUE_CLASS}>
                  {card.rewardPointValueBdt != null
                    ? `${copy.bdt} ${card.rewardPointValueBdt}`
                    : copy.rewardsPointValueNone}
                </dd>
              </div>
              {card.pointsExpiryText && (
                <div className="rewards-row">
                  <dt className={SPEC_KEY_CLASS}>{copy.rewardsExpiry}</dt>
                  <dd className={SPEC_VALUE_CLASS}>{card.pointsExpiryText}</dd>
                </div>
              )}
              {card.rewardSourceUrl && (
                <div className="rewards-row">
                  <dt className={SPEC_KEY_CLASS}>{copy.rewardsSourceLabel}</dt>
                  <dd className={SPEC_VALUE_CLASS}>
                    <a
                      href={card.rewardSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      {card.rewardSourceUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        );
      })()}

      <table className="specs-table">
        <tbody>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specRewardsPolicy}
            </th>
            <td className={SPEC_VALUE_CLASS}>{card.rewardPointsPolicy || copy.notPublished}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const eligibilityTab = (
    <section className="specs-section" aria-label={detail.tabEligibility}>
      {sessionVerdict ? (
        <div className="p2-eligibility-signal" role="note">
          <strong>
            {detail.eligibilitySignalLabel}: {verdictText(sessionVerdict.verdict)}
          </strong>
          <span className="p2-section-note">{detail.eligibilityFromSession}</span>
          {sessionVerdict.reasons.length > 0 && (
            <ul>
              {sessionVerdict.reasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p>
          <Link to="/eligibility-checker" className="btn btn-secondary">
            {detail.checkEligibility}
          </Link>
        </p>
      )}
      <table className="specs-table">
        <tbody>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specMinIncome}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {card.minMonthlyIncome == null
                ? copy.notPublished
                : fillCopy(copy.minIncomePerMonth, {
                    amount: `${copy.bdt} ${card.minMonthlyIncome.toLocaleString()}`,
                  })}
            </td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specIslamic}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {card.isIslamic ? copy.islamicValue : copy.conventionalValue}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );

  const featuresTab = (
    <section className="specs-section" aria-label={detail.tabFeatures}>
      <table className="specs-table">
        <tbody>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specCardName}
            </th>
            <td className={SPEC_VALUE_CLASS}>{card.name}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specBank}
            </th>
            <td className={SPEC_VALUE_CLASS}>{card.bankName || copy.notPublished}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {card.isIslamic && card.interestRateApr === null
                ? copy.specProfitFeeShariah
                : copy.specApr}
            </th>
            <td className={SPEC_VALUE_CLASS}>{aprText}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specInternationalLounge}
            </th>
            <td id="spec-international-lounge" tabIndex={-1} className={SPEC_VALUE_CLASS}>
              {loungeText(card.loungeAccessInternational)}
            </td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specDomesticLounge}
            </th>
            <td id="spec-domestic-lounge" tabIndex={-1} className={SPEC_VALUE_CLASS}>
              {loungeText(card.loungeAccessDomestic)}
            </td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specIslamic}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {card.isIslamic ? copy.islamicValue : copy.conventionalValue}
            </td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specNetwork}
            </th>
            <td className={SPEC_VALUE_CLASS}>{networkLabel ?? copy.notPublished}</td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specDualCurrency}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {card.isDualCurrency == null
                ? copy.notPublished
                : card.isDualCurrency
                ? copy.yes
                : copy.no}
            </td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specCardStatus}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {card.isActive ? copy.statusActive : copy.statusInactive}
            </td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specLastUpdated}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {card.lastUpdated
                ? new Date(card.lastUpdated).toLocaleDateString()
                : copy.notPublished}
            </td>
          </tr>
          <tr>
            <th scope="row" className={SPEC_KEY_CLASS}>
              {copy.specOfficialSource}
            </th>
            <td className={SPEC_VALUE_CLASS}>
              {card.sourceUrl ? (
                <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                  {copy.bankWebsite}
                </a>
              ) : (
                copy.notPublished
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Additional Features */}
      {card.additionalFeatures && card.additionalFeatures.length > 0 && (
        <section className="features-section">
          <h3>{copy.additionalFeaturesHeading}</h3>
          <ul className="features-list">
            {card.additionalFeatures.map((feature, idx) => (
              <li key={idx}>{formatFeature(feature)}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );

  return (
    <div className="card-detail-page p2-detail">
      <script data-testid="card-json-ld" type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FinancialProduct',
          name: card.name,
          description:
            card.rewardPointsPolicy ||
            `${card.name} credit card from ${card.bankName || 'the issuing bank'}.`,
          provider: card.bankName ? { '@type': 'Organization', name: card.bankName } : undefined,
          url: card.sourceUrl || window.location.href,
        })}
      </script>
      <nav aria-label={copy.breadcrumbLabel} className="breadcrumb">
        <Link to="/">{copy.breadcrumbHome}</Link>
        <span aria-hidden="true"> / </span>
        {card.bankName ? (
          <Link className="breadcrumb-item" to={`/bank/${slugify(card.bankName)}`}>
            {card.bankName}
          </Link>
        ) : (
          <span className="breadcrumb-item">{card.bankName}</span>
        )}
        <span aria-hidden="true"> / </span>
        <span className="breadcrumb-item" aria-current="page">
          {card.name}
        </span>
      </nav>

      <header className="card-detail-header">
        <h1>{card.name}</h1>
        <p className="bank-name">{card.bankName}</p>
        {card.images && card.images.length > 0 && (
          <div className="card-image-section">
            <img src={card.images[0].full} alt={card.name} className="card-large-image" />
          </div>
        )}
      </header>

      <div className="p2-detail-grid">
        <aside className="p2-detail-aside">
          <DetailSummary
            identity={{ bankName: card.bankName ?? '', productName: card.name }}
            heroValue={
              score !== null ? (
                <span>
                  {score.toFixed(1)} <span className="p2-section-note">/ 10</span>
                </span>
              ) : (
                formatAnnualFee(card.annualFee)
              )
            }
            heroLabel={score !== null ? detail.scoreHeroLabel : detail.feeHeroLabel}
            facts={[
              {
                label: detail.verdictNetValue,
                value:
                  netValue !== null ? (
                    <Money value={netValue} />
                  ) : estimate && estimate.annualValueBdt !== null ? (
                    <Money value={estimate.annualValueBdt} />
                  ) : (
                    <UnknownValue kind="not-published" />
                  ),
              },
              { label: aprLabel, value: aprText },
              { label: copy.annualFee, value: formatAnnualFee(card.annualFee) },
              ...(card.loungeAccessInternational
                ? [
                    {
                      label: copy.internationalLounge,
                      value: summarizeCardText(card.loungeAccessInternational, true),
                    },
                  ]
                : []),
              ...(card.loungeAccessDomestic
                ? [
                    {
                      label: copy.domesticLounge,
                      value: summarizeCardText(card.loungeAccessDomestic, true),
                    },
                  ]
                : []),
              ...(sessionVerdict
                ? [
                    {
                      label: detail.eligibilitySignalLabel,
                      value: verdictText(sessionVerdict.verdict),
                    },
                  ]
                : []),
            ]}
            trustChip={
              card.sourceUrl ? (
                <TrustChip
                  source={
                    <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {copy.sourceScheduleOfCharges}
                    </a>
                  }
                  dateLabel={
                    card.verifiedAt
                      ? fillCopy(copy.verifiedOn, {
                          date: formatLocalizedDate(card.verifiedAt, lang),
                        })
                      : detail.trustChipUnverified
                  }
                />
              ) : undefined
            }
            actions={
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleShortlistToggle}
                  aria-pressed={inShortlist}
                >
                  {inShortlist ? detail.inShortlist : detail.addToShortlist}
                </button>
                <Link to="/eligibility-checker" className="btn btn-secondary">
                  {detail.checkEligibility}
                </Link>
                {applyHref && (
                  <a
                    className={`btn btn-outline apply-cta ${ctaClicked ? 'clicked' : ''}`}
                    href={applyHref}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={handleApplyNow}
                  >
                    {ctaClicked ? copy.openingApplication : copy.applyOnBankSite}
                  </a>
                )}
                {feeScheduleHref && (
                  <a
                    className="btn btn-outline apply-cta fee-schedule-cta"
                    href={feeScheduleHref}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    {copy.viewFeeSchedule}
                  </a>
                )}
              </>
            }
          />

          {score !== null && (
            <p className="p2-section-note">
              {detail.scoreHeroLabel}: <Link to="/methodology">{detail.scoreHowCalculated}</Link>
            </p>
          )}

          {/* Watch Toggle */}
          <div className="watch-section">
            {renderWatchToggle()}
            {watchError && (
              <p className="watch-error" role="alert">
                {watchError}
              </p>
            )}
          </div>
        </aside>

        <div className="p2-detail-main">
          <VerdictStrip items={verdictItems} />

          <section className="card-insight" aria-label={copy.cardInsight}>
            <h2>{copy.cardInsight}</h2>
            <p>{cardInsight}</p>
          </section>

          {/* Pros and Cons */}
          <section className="pros-cons-section">
            <h2>{copy.prosConsHeading}</h2>
            <p className="data-derived-note">{copy.prosConsNote}</p>
            <div className="pros-cons-grid">
              <div className="pros">
                <h3>{copy.pros}</h3>
                <ul>
                  {card.loungeAccessInternational && (
                    <li>
                      {fillCopy(copy.proInternationalLounge, {
                        value: summarizeCardText(card.loungeAccessInternational, true),
                      })}
                    </li>
                  )}
                  {card.loungeAccessDomestic && (
                    <li>
                      {fillCopy(copy.proDomesticLounge, {
                        value: summarizeCardText(card.loungeAccessDomestic, true),
                      })}
                    </li>
                  )}
                  {card.annualFeeWaiverPolicy && <li>{copy.proFeeWaiver}</li>}
                  {card.rewardPointsPolicy && <li>{copy.proRewards}</li>}
                  {card.additionalFeatures && card.additionalFeatures.length > 0 && (
                    <li>{copy.proAdditionalBenefits}</li>
                  )}
                </ul>
              </div>

              <div className="cons">
                <h3>{copy.considerations}</h3>
                <ul>
                  {card.annualFee !== null && card.annualFee > 0 && (
                    <li>
                      {fillCopy(copy.conAnnualFee, {
                        fee: `${copy.bdt} ${card.annualFee.toLocaleString()}`,
                      })}
                    </li>
                  )}
                  {card.interestRateApr !== null && card.interestRateApr > 20 && (
                    <li>{fillCopy(copy.conHighApr, { apr: card.interestRateApr })}</li>
                  )}
                  {card.cashAdvanceFee && (
                    <li>
                      {copy.conCashAdvanceFee} {summarizeCardText(card.cashAdvanceFee)}
                    </li>
                  )}
                  {!card.loungeAccessInternational && !card.loungeAccessDomestic && (
                    <li>
                      {card.loungeAccessInternational === '' && card.loungeAccessDomestic === ''
                        ? copy.conNoLounge
                        : copy.conLoungeUnknown}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          <Tabs
            ariaLabel={detail.tabsLabel}
            tabs={[
              { id: 'fees', label: detail.tabFees, content: feesTab },
              { id: 'rewards', label: detail.tabRewards, content: rewardsTab },
              { id: 'eligibility', label: detail.tabEligibility, content: eligibilityTab },
              { id: 'features', label: detail.tabFeatures, content: featuresTab },
              {
                id: 'reviews',
                label: detail.tabReviews,
                content: (
                  <ReviewsSection
                    productType="card"
                    productId={card.id}
                    productName={card.name}
                    productUrl={cardPath || window.location.pathname}
                  />
                ),
              },
            ]}
          />

          {/* Trust block — once: score breakdown, provenance, fee history */}
          <div className="p2-trust">
            <Suspense fallback={null}>
              <ScoreSection card={card} />
            </Suspense>
            <Suspense fallback={null}>
              <CardTrustSections card={card} />
            </Suspense>
            <p className="data-disclaimer">
              {copy.dataDisclaimer} <Link to="/disclaimer">{copy.disclaimerLink}</Link>
              {verifiedText ? ` · ${verifiedText}` : ''}
            </p>
            <button
              type="button"
              className="btn btn-outline report-issue-btn"
              onClick={() => setReportOpen(true)}
            >
              {copy.reportButton}
            </button>
          </div>

          {/* Similar Cards — cross-bank, by CreditMate Score proximity */}
          {similarCards.length > 0 && (
            <section className="similar-cards-section">
              <h2>{detail.similarCardsHeading}</h2>
              <div className="p2-similar-grid">
                {similarCards.map(similarCard => (
                  <div key={similarCard.id} className="similar-card-item">
                    {similarCard.images && similarCard.images.length > 0 && (
                      <img
                        src={similarCard.images[0].small}
                        alt={similarCard.name}
                        className="similar-card-image"
                      />
                    )}
                    <p className="bank-name">{similarCard.bankName}</p>
                    <h3>{similarCard.name}</h3>
                    <p className="annual-fee">{formatAnnualFee(similarCard.annualFee)}</p>
                    {similarCard.creditmateScore != null && (
                      <p className="similar-score">
                        {scoreCopy.detailHeading}: {similarCard.creditmateScore.toFixed(1)} / 10
                      </p>
                    )}
                    <p className="p2-reason">
                      {similarReason(card, similarCard, detail, networkLabel)}
                    </p>
                    <Link
                      to={`/card/${slugify(similarCard.bankName ?? '')}/${slugify(
                        similarCard.name
                      )}`}
                      className="btn btn-outline"
                      aria-label={fillCopy(copy.viewDetailsFor, { name: similarCard.name })}
                    >
                      {copy.viewDetails}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {reportOpen && (
        <ReportIssueDialog
          cardId={card.id}
          cardName={card.name}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
};

export default CardDetailPage;
