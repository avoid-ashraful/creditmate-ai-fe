import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import CardDetailsPopup from '../components/CardDetailsPopup';
import CardList from '../components/CardList';
import ComparisonBar from '../components/ComparisonBar';
import { SkeletonCardGrid } from '../components/Skeleton';
import Toast from '../components/Toast';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useLanguage, getCommonCopy } from '../locales';
import { apiService, BankApiResponse } from '../services/api';
import { bankPath, computeBankCardStats, fetchAllBanks, findBankBySlug } from '../services/banks';
import { CreditCard } from '../types';
import { breadcrumbJsonLd } from '../utils/structuredData';
import '../styles/HomePage.css';
import '../styles/CategoryPage.css';
import '../styles/BankPage.css';

const PAGE_SIZE = 100;

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

/** Fetch every page of a bank's cards so stats cover the bank's full list. */
const fetchAllBankCards = async (bankId: number): Promise<CreditCard[]> => {
  const cards: CreditCard[] = [];
  let page = 1;
  for (;;) {
    const response = await apiService.getCreditCards({ bankId, page, page_size: PAGE_SIZE });
    cards.push(...response.results.map(card => apiService.transformCreditCard(card)));
    if (!response.next) return cards;
    page += 1;
  }
};

const formatFeeRange = (min: number | null, max: number | null): string | null => {
  if (min === null || max === null) return null;
  if (min === max) return `BDT ${min.toLocaleString()}`;
  return `BDT ${min.toLocaleString()} – ${max.toLocaleString()}`;
};

const BankPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bank, setBank] = useState<BankApiResponse | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [viewedCard, setViewedCard] = useState<CreditCard | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string>('');

  useSeoMeta(
    bank
      ? {
          title: `${bank.name} credit cards in Bangladesh | CreditMate AI`,
          description: `Compare all ${bank.credit_card_count} credit cards from ${bank.name}: annual fees, APR, lounge access, rewards and more.`,
          canonicalPath: bankPath(bank),
          jsonLd: breadcrumbJsonLd(window.location.origin, [
            { name: 'Home', path: '/' },
            { name: 'Banks', path: '/banks' },
            { name: bank.name, path: bankPath(bank) },
          ]),
        }
      : null
  );

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    setBank(null);
    setCards([]);
    setSelectedCardIds([]);
    setSelectionMessage('');

    const load = async (): Promise<void> => {
      try {
        const banks = await fetchAllBanks();
        if (cancelled) return;
        const found = slug ? findBankBySlug(banks, slug) : undefined;
        if (!found) {
          setLoadState('not-found');
          return;
        }
        setBank(found);
        const bankCards = await fetchAllBankCards(found.id);
        if (cancelled) return;
        setCards(bankCards);
        setLoadState('ready');
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to load bank page:', fetchError);
        setLoadState('error');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleCardSelect = (card: CreditCard) => {
    if (selectedCardIds.includes(card.id)) {
      setSelectionMessage('');
      setSelectedCardIds(prev => prev.filter(id => id !== card.id));
      return;
    }
    if (selectedCardIds.length >= 4) {
      setSelectionMessage(common.categorySelectionLimit);
      return;
    }
    setSelectionMessage('');
    setSelectedCardIds(prev => [...prev, card.id]);
  };

  if (loadState === 'not-found') {
    return (
      <div className="category-page">
        <div className="category-not-found">
          <h1>{common.bankNotFoundTitle}</h1>
          <p>{common.bankNotFoundDesc}</p>
          <Link to="/banks">{common.bankBackToBanks}</Link>
        </div>
      </div>
    );
  }

  const stats = computeBankCardStats(cards);
  const feeRange = formatFeeRange(stats.annualFeeMin, stats.annualFeeMax);
  const aprRange =
    stats.aprMin === null || stats.aprMax === null
      ? null
      : stats.aprMin === stats.aprMax
      ? `${stats.aprMin}${common.aprSuffix}`
      : `${stats.aprMin} – ${stats.aprMax}${common.aprSuffix}`;

  return (
    <div className="category-page bank-page">
      <nav aria-label="Breadcrumb" className="bank-breadcrumb">
        <Link to="/banks">{common.bankBackToBanks}</Link>
      </nav>

      {loadState === 'error' ? (
        <div className="error-state" role="alert">
          {common.bankErrorLoading}
        </div>
      ) : loadState === 'loading' || !bank ? (
        <>
          <div className="category-header">
            <h1>{common.banksIndexTitle}</h1>
          </div>
          <SkeletonCardGrid label={common.bankSkeletonLabel} />
        </>
      ) : (
        <>
          <div className="category-header">
            {bank.logo && (
              <img className="bank-logo" src={bank.logo} alt={`${bank.name} logo`} loading="lazy" />
            )}
            <h1>{bank.name}</h1>
            <span className="category-count">
              {cards.length} {common.categoryCount}
            </span>
            {bank.website && (
              <p className="bank-website">
                <a href={bank.website} target="_blank" rel="noopener noreferrer">
                  {common.bankVisitWebsite}
                </a>
              </p>
            )}
          </div>

          {cards.length > 0 && (
            <dl className="bank-stats">
              <div className="bank-stat">
                <dt>{common.bankStatCards}</dt>
                <dd>{stats.totalCards}</dd>
              </div>
              {feeRange && (
                <div className="bank-stat">
                  <dt>{common.bankStatAnnualFeeRange}</dt>
                  <dd>{feeRange}</dd>
                </div>
              )}
              {aprRange && (
                <div className="bank-stat">
                  <dt>{common.bankStatAprRange}</dt>
                  <dd>{aprRange}</dd>
                </div>
              )}
              <div className="bank-stat">
                <dt>{common.bankStatFreeCards}</dt>
                <dd>{stats.freeCardCount}</dd>
              </div>
              <div className="bank-stat">
                <dt>{common.bankStatLoungeCards}</dt>
                <dd>{stats.loungeCardCount}</dd>
              </div>
            </dl>
          )}

          <h2 className="bank-cards-heading">{common.bankCardsHeading}</h2>

          {cards.length === 0 ? (
            <div className="bank-empty">
              <h3>{common.bankNoCardsTitle}</h3>
              <p>{common.bankNoCardsDesc}</p>
            </div>
          ) : (
            <>
              <CardList
                cards={cards}
                onCardSelect={handleCardSelect}
                selectedCardIds={selectedCardIds}
                maxSelections={4}
                onViewCardDetails={setViewedCard}
              />

              <AnimatePresence>
                {viewedCard && (
                  <CardDetailsPopup
                    key={viewedCard.id}
                    card={viewedCard}
                    onClose={() => setViewedCard(null)}
                    onAddToCompare={handleCardSelect}
                    isInCompareList={selectedCardIds.includes(viewedCard.id)}
                  />
                )}
              </AnimatePresence>

              <ComparisonBar
                selectedCards={cards.filter(card => selectedCardIds.includes(card.id))}
                onRemoveCard={cardId =>
                  setSelectedCardIds(prev => prev.filter(id => id !== cardId))
                }
                maxSelections={4}
              />

              <Toast className="selection-message" message={selectionMessage} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BankPage;
