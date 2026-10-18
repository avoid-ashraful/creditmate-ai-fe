/**
 * Card Detail Page with "Watch this card" toggle for alert subscriptions.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

import ReportIssueDialog from '../components/ReportIssueDialog';
import { ReviewsSection } from '../components/ReviewsSection';
import { useAuth } from '../hooks/AuthProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import {
  useLanguage,
  getAuthCopy,
  getAlertsCopy,
  getCardDetailCopy,
  getNetworkLabel,
  fillCopy,
  formatLocalizedDate,
} from '../locales';
import { alertsClient } from '../services/alerts';
import { apiService } from '../services/api';
import { CreditCard } from '../types';
import { describeFeeWaiverPolicy, FeeWaiverLabels } from '../utils/feeWaiver';
import { getComparisonSummary } from '../utils/narratives';
import { slugify } from '../utils/slugify';
import { breadcrumbJsonLd } from '../utils/structuredData';
import '../styles/CardDetailPage.css';

const CARD_DETAIL_PAGE = 'card-detail-page';
const METRIC_CLASS = 'metric';
const LABEL_CLASS = 'label';
const VALUE_CLASS = 'value';
const SPEC_KEY_CLASS = 'spec-key';
const SPEC_VALUE_CLASS = 'spec-value';

const CardDetailPage: React.FC = () => {
  const { bankSlug, cardSlug } = useParams<{ bankSlug: string; cardSlug: string }>();
  const { status: authStatus } = useAuth();
  const { lang } = useLanguage();
  const authCopy = getAuthCopy(lang);
  const alertsCopy = getAlertsCopy(lang);
  const copy = getCardDetailCopy(lang);

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
            fee: card.annualFee === null ? copy.na : `${copy.bdt} ${card.annualFee}`,
            apr: card.interestRateApr === null ? copy.na : `${card.interestRateApr}%`,
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

        // Fetch similar cards (same bank or similar fee range)
        if (foundCard.bankId) {
          const similarResponse = await apiService.getCreditCards({
            bankId: foundCard.bankId,
            page_size: 5,
          });
          if (cancelled) return;
          const similar = similarResponse.results
            .map(c => apiService.transformCreditCard(c))
            .filter(c => c.id !== foundCard.id)
            .slice(0, 3);
          setSimilarCards(similar);
        } else {
          setSimilarCards([]);
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
    if (fee === null) return copy.dataNotAvailable;
    if (fee === 0) return copy.noAnnualFee;
    return `${copy.bdt} ${fee.toLocaleString()}`;
  };

  // null = field absent (unknown), '' = explicitly no access.
  const loungeText = (value: string | null): string =>
    value === null ? copy.unknown : value === '' ? copy.none : value;

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

  if (isLoading) {
    return (
      <div className={CARD_DETAIL_PAGE}>
        <div className="loading-state" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
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

  // Never render a dead button: apply link falls back to the bank source, else nothing.
  const applyHref = card.applyUrl || card.sourceUrl || '';
  const verifiedText = card.verifiedAt
    ? fillCopy(copy.verifiedOn, { date: formatLocalizedDate(card.verifiedAt, lang) })
    : '';
  // Islamic cards charge profit/fees, not interest: don't label a missing APR as unknown interest.
  const aprLabel =
    card.isIslamic && card.interestRateApr === null ? copy.specProfitFeeShariah : copy.apr;
  const networkLabel = getNetworkLabel(copy, card.cardNetwork);
  const unknownIfEmpty = (value?: string): string => value || copy.unknown;

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

  return (
    <div className="card-detail-page">
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
        <span className="breadcrumb-item">{card.bankName}</span>
        <span aria-hidden="true"> / </span>
        <span className="breadcrumb-item" aria-current="page">
          {card.name}
        </span>
      </nav>

      <div className="card-detail-container">
        {/* Left section: Card image and key details */}
        <div className="card-detail-left">
          {card.images && card.images.length > 0 && (
            <div className="card-image-section">
              <img src={card.images[0].full} alt={card.name} className="card-large-image" />
            </div>
          )}

          <div className="card-key-details">
            <h1>{card.name}</h1>
            <p className="bank-name">{card.bankName}</p>
            <section className="card-insight" aria-label={copy.cardInsight}>
              <h2>{copy.cardInsight}</h2>
              <p>{cardInsight}</p>
            </section>

            <div className="key-metrics">
              <div className={METRIC_CLASS}>
                <span className={LABEL_CLASS}>{copy.annualFee}</span>
                <span className={VALUE_CLASS}>{formatAnnualFee(card.annualFee)}</span>
              </div>
              <div className={METRIC_CLASS}>
                <span className={LABEL_CLASS}>{aprLabel}</span>
                <span className={VALUE_CLASS}>
                  {card.interestRateApr === null
                    ? copy.dataNotAvailable
                    : `${card.interestRateApr}% ${copy.apr}`}
                </span>
              </div>
              {card.loungeAccessInternational && (
                <div className={METRIC_CLASS}>
                  <span className={LABEL_CLASS}>{copy.internationalLounge}</span>
                  <span className={VALUE_CLASS}>{card.loungeAccessInternational}</span>
                </div>
              )}
              {card.loungeAccessDomestic && (
                <div className={METRIC_CLASS}>
                  <span className={LABEL_CLASS}>{copy.domesticLounge}</span>
                  <span className={VALUE_CLASS}>{card.loungeAccessDomestic}</span>
                </div>
              )}
            </div>

            {/* Watch Toggle */}
            <div className="watch-section">
              {renderWatchToggle()}
              {watchError && (
                <p className="watch-error" role="alert">
                  {watchError}
                </p>
              )}
            </div>

            {applyHref && (
              <a
                className={`btn btn-primary apply-cta ${ctaClicked ? 'clicked' : ''}`}
                href={applyHref}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={handleApplyNow}
              >
                {ctaClicked ? copy.openingApplication : copy.applyOnBankSite}
              </a>
            )}

            {(card.sourceUrl || verifiedText) && (
              <p className="data-provenance">
                {card.sourceUrl && (
                  <>
                    {copy.sourceLabel}{' '}
                    <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                      {copy.sourceScheduleOfCharges}
                    </a>
                  </>
                )}
                {card.sourceUrl && verifiedText && ' · '}
                {verifiedText}
              </p>
            )}
            <p className="data-disclaimer">
              {copy.dataDisclaimer} <Link to="/disclaimer">{copy.disclaimerLink}</Link>
            </p>
            <button
              type="button"
              className="btn btn-outline report-issue-btn"
              onClick={() => setReportOpen(true)}
            >
              {copy.reportButton}
            </button>
          </div>
        </div>

        {/* Right section: Details and specs */}
        <div className="card-detail-right">
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
                        value: card.loungeAccessInternational,
                      })}
                    </li>
                  )}
                  {card.loungeAccessDomestic && (
                    <li>
                      {fillCopy(copy.proDomesticLounge, { value: card.loungeAccessDomestic })}
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
                      {copy.conCashAdvanceFee} {card.cashAdvanceFee}
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

          {/* Complete Specs Table */}
          <section className="specs-section">
            <h2>{copy.specsHeading}</h2>
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
                  <td className={SPEC_VALUE_CLASS}>{card.bankName || copy.na}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specAnnualFee}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{formatAnnualFee(card.annualFee)}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {card.isIslamic && card.interestRateApr === null
                      ? copy.specProfitFeeShariah
                      : copy.specApr}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.interestRateApr === null
                      ? copy.dataNotAvailable
                      : `${card.interestRateApr}% ${copy.apr}`}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specInternationalLounge}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{loungeText(card.loungeAccessInternational)}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specDomesticLounge}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{loungeText(card.loungeAccessDomestic)}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specNetwork}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{networkLabel ?? copy.unknown}</td>
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
                    {copy.specDualCurrency}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.isDualCurrency == null
                      ? copy.unknown
                      : card.isDualCurrency
                      ? copy.yes
                      : copy.no}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specMinIncome}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.minMonthlyIncome == null
                      ? copy.unknown
                      : fillCopy(copy.minIncomePerMonth, {
                          amount: `${copy.bdt} ${card.minMonthlyIncome.toLocaleString()}`,
                        })}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specSupplementaryFee}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{unknownIfEmpty(card.supplementaryCardFee)}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specForeignTransactionFee}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{unknownIfEmpty(card.foreignTransactionFee)}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specCashAdvanceFee}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.cashAdvanceFee || copy.na}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specLatePaymentFee}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.latePaymentFee || copy.na}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specRewardsPolicy}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.rewardPointsPolicy || copy.na}</td>
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
                      copy.dataNotAvailable
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    {copy.specAdditionalFeatures}
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.additionalFeatures.length
                      ? card.additionalFeatures.map(formatFeature).join(', ')
                      : copy.dataNotAvailable}
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
                      : copy.unknown}
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
                      copy.dataNotAvailable
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Fee Waiver Calculator */}
          {feeWaiverThreshold && card.annualFee !== null && card.annualFee > 0 && (
            <section className="fee-waiver-section">
              <h2>{copy.waiverHeading}</h2>
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
                        : copy.na,
                    })}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Additional Features */}
          {card.additionalFeatures && card.additionalFeatures.length > 0 && (
            <section className="features-section">
              <h2>{copy.additionalFeaturesHeading}</h2>
              <ul className="features-list">
                {card.additionalFeatures.map((feature, idx) => (
                  <li key={idx}>{formatFeature(feature)}</li>
                ))}
              </ul>
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

      {/* Similar Cards */}
      {similarCards.length > 0 && (
        <section className="similar-cards-section">
          <h2>{fillCopy(copy.similarCardsHeading, { bank: card.bankName ?? '' })}</h2>
          <div className="similar-cards-grid">
            {similarCards.map(similarCard => (
              <div key={similarCard.id} className="similar-card-item">
                {similarCard.images && similarCard.images.length > 0 && (
                  <img
                    src={similarCard.images[0].small}
                    alt={similarCard.name}
                    className="similar-card-image"
                  />
                )}
                <h3>{similarCard.name}</h3>
                <p className="annual-fee">{formatAnnualFee(similarCard.annualFee)}</p>
                <Link
                  to={`/card/${bankSlug}/${similarCard.name.toLowerCase().replace(/\s+/g, '-')}`}
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

      {/* Reviews Section */}
      {card && (
        <ReviewsSection
          cardId={card.id}
          cardName={card.name}
          cardUrl={cardPath || window.location.pathname}
        />
      )}
    </div>
  );
};

export default CardDetailPage;
