/**
 * Card Detail Page with "Watch this card" toggle for alert subscriptions.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { useLanguage, getAuthCopy, getAlertsCopy } from '../locales';
import { alertsClient } from '../services/alerts';
import { apiService } from '../services/api';
import { CreditCard } from '../types';
import { getComparisonSummary } from '../utils/narratives';
import { slugify } from '../utils/slugify';
import { breadcrumbJsonLd } from '../utils/structuredData';
import '../styles/CardDetailPage.css';

const NA = 'N/A';
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

  const [card, setCard] = useState<CreditCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarCards, setSimilarCards] = useState<CreditCard[]>([]);
  const [ctaClicked, setCtaClicked] = useState(false);

  // Watch this card state
  const [isWatching, setIsWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchError, setWatchError] = useState<string | null>(null);

  const cardPath =
    card?.bankName && card.name ? `/card/${slugify(card.bankName)}/${slugify(card.name)}` : null;
  useSeoMeta(
    card
      ? {
          title: `${card.name} from ${card.bankName ?? 'a Bangladeshi bank'} | CreditMate AI`,
          description: `${card.name} from ${card.bankName ?? 'a Bangladeshi bank'}. Annual fee: ${
            card.annualFee === null ? NA : `BDT ${card.annualFee}`
          }. APR: ${card.interestRateApr === null ? NA : `${card.interestRateApr}%`}`,
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
          setError('Invalid card URL');
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
          setError('Card not found');
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
        setError('Failed to load card details. Please try again.');
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
    if (card?.sourceUrl) {
      analytics.track(ANALYTICS_EVENTS.cardSelect, {
        cardId: card.id,
      });
      setCtaClicked(true);
      window.open(card.sourceUrl, '_blank', 'noopener,noreferrer');
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
    if (fee === null) return 'Data not available';
    if (fee === 0) return 'No annual fee';
    return `BDT ${fee.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className={CARD_DETAIL_PAGE}>
        <div className="loading-state" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading card details...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className={CARD_DETAIL_PAGE}>
        <div className="error-state">
          <h2>Card Not Found</h2>
          <p>{error || 'The card you are looking for does not exist.'}</p>
          <div className="error-actions">
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
            <Link to="/compare" className="btn btn-secondary">
              Compare Cards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const feeWaiverThreshold = calculateFeeWaiverThreshold();
  const cardInsight = getComparisonSummary([card]);
  const annualWaiverSpend = feeWaiverThreshold
    ? Number(feeWaiverThreshold.replace(/,/g, ''))
    : null;

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
            ? 'Updating…'
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
            {authCopy.loginCreateLink}
          </Link>
        </p>
        <p className="watch-prompt-text">
          {alertsCopy.watchPromptRegister}
          <Link to="/register" className="watch-prompt-link">
            {' '}
            {authCopy.registerLoginLink}
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
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/">Home</Link>
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
            <section className="card-insight" aria-label="Card insight">
              <h2>Card insight</h2>
              <p>{cardInsight}</p>
            </section>

            <div className="key-metrics">
              <div className={METRIC_CLASS}>
                <span className={LABEL_CLASS}>Annual Fee</span>
                <span className={VALUE_CLASS}>{formatAnnualFee(card.annualFee)}</span>
              </div>
              <div className={METRIC_CLASS}>
                <span className={LABEL_CLASS}>APR</span>
                <span className={VALUE_CLASS}>
                  {card.interestRateApr === null
                    ? 'Data not available'
                    : `${card.interestRateApr}% APR`}
                </span>
              </div>
              {card.loungeAccessInternational && (
                <div className={METRIC_CLASS}>
                  <span className={LABEL_CLASS}>International Lounge</span>
                  <span className={VALUE_CLASS}>{card.loungeAccessInternational}</span>
                </div>
              )}
              {card.loungeAccessDomestic && (
                <div className={METRIC_CLASS}>
                  <span className={LABEL_CLASS}>Domestic Lounge</span>
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

            {card.sourceUrl && (
              <button
                className={`btn btn-primary apply-cta ${ctaClicked ? 'clicked' : ''}`}
                onClick={handleApplyNow}
              >
                {ctaClicked ? 'Opening application...' : 'Apply Now'}
              </button>
            )}
          </div>
        </div>

        {/* Right section: Details and specs */}
        <div className="card-detail-right">
          {/* Pros and Cons */}
          <section className="pros-cons-section">
            <h2>Pros & Cons</h2>
            <p className="data-derived-note">
              Highlights are generated from published card fields. The APR comparison flag uses a
              20% threshold.
            </p>
            <div className="pros-cons-grid">
              <div className="pros">
                <h3>Pros</h3>
                <ul>
                  {card.loungeAccessInternational && (
                    <li>{card.loungeAccessInternational} international lounge access</li>
                  )}
                  {card.loungeAccessDomestic && (
                    <li>{card.loungeAccessDomestic} domestic lounge access</li>
                  )}
                  {card.annualFeeWaiverPolicy && <li>Annual fee waiver available</li>}
                  {card.rewardPointsPolicy && <li>Rewards program available</li>}
                  {card.additionalFeatures && card.additionalFeatures.length > 0 && (
                    <li>Multiple additional benefits</li>
                  )}
                </ul>
              </div>

              <div className="cons">
                <h3>Considerations</h3>
                <ul>
                  {card.annualFee && card.annualFee > 0 && (
                    <li>Annual fee of BDT {card.annualFee.toLocaleString()}</li>
                  )}
                  {card.interestRateApr && card.interestRateApr > 20 && (
                    <li>Higher interest rate at {card.interestRateApr}% APR</li>
                  )}
                  {card.cashAdvanceFee && <li>Cash advance fee: {card.cashAdvanceFee}</li>}
                  {!card.loungeAccessInternational && !card.loungeAccessDomestic && (
                    <li>No lounge access included</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Complete Specs Table */}
          <section className="specs-section">
            <h2>Complete Specifications</h2>
            <table className="specs-table">
              <tbody>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Card Name
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.name}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Bank
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.bankName || NA}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Annual Fee
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{formatAnnualFee(card.annualFee)}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Interest Rate (APR)
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.interestRateApr === null
                      ? 'Data not available'
                      : `${card.interestRateApr}% APR`}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    International Lounge Access
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.loungeAccessInternational || 'Not available'}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Domestic Lounge Access
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.loungeAccessDomestic || 'Not available'}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Cash Advance Fee
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.cashAdvanceFee || NA}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Late Payment Fee
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.latePaymentFee || NA}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Rewards Policy
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.rewardPointsPolicy || NA}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Annual Fee Waiver Policy
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.annualFeeWaiverPolicy
                      ? (card.annualFeeWaiverPolicy.conditions as string) ||
                        JSON.stringify(card.annualFeeWaiverPolicy)
                      : 'Data not available'}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Additional Features
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.additionalFeatures.length
                      ? card.additionalFeatures
                          .map(feature =>
                            typeof feature === 'string' ? feature : JSON.stringify(feature)
                          )
                          .join(', ')
                      : 'Data not available'}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Card Status
                  </th>
                  <td className={SPEC_VALUE_CLASS}>{card.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Last Updated
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.lastUpdated ? new Date(card.lastUpdated).toLocaleDateString() : 'Unknown'}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={SPEC_KEY_CLASS}>
                    Official Source
                  </th>
                  <td className={SPEC_VALUE_CLASS}>
                    {card.sourceUrl ? (
                      <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                        Bank website
                      </a>
                    ) : (
                      'Data not available'
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Fee Waiver Calculator */}
          {feeWaiverThreshold && card.annualFee && card.annualFee > 0 && (
            <section className="fee-waiver-section">
              <h2>Fee Waiver Calculator</h2>
              <div className="waiver-info">
                <p>
                  You can waive the annual fee of{' '}
                  <strong>BDT {card.annualFee.toLocaleString()}</strong> by spending at least{' '}
                  <strong>BDT {feeWaiverThreshold}</strong> per year.
                </p>
                <div className="waiver-breakdown">
                  <p>
                    That&apos;s approximately{' '}
                    <strong>
                      BDT{' '}
                      {annualWaiverSpend
                        ? (annualWaiverSpend / 12).toLocaleString('en-US', {
                            maximumFractionDigits: 0,
                          })
                        : NA}
                    </strong>{' '}
                    per month.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Additional Features */}
          {card.additionalFeatures && card.additionalFeatures.length > 0 && (
            <section className="features-section">
              <h2>Additional Features</h2>
              <ul className="features-list">
                {card.additionalFeatures.map((feature, idx) => (
                  <li key={idx}>
                    {typeof feature === 'string' ? feature : JSON.stringify(feature)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Similar Cards */}
      {similarCards.length > 0 && (
        <section className="similar-cards-section">
          <h2>Similar Cards from {card.bankName}</h2>
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
                  aria-label={`View details for ${similarCard.name}`}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="reviews-section">
        <h2>Customer Reviews</h2>
        <div className="reviews-placeholder">
          <p>
            <strong>Reviews Coming Soon</strong>
          </p>
          <p>
            We&apos;re building our community review system. In the meantime, check back soon to see
            what other cardholders think about this card!
          </p>
        </div>
      </section>
    </div>
  );
};

export default CardDetailPage;
