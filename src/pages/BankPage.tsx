import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import CardDetailsPopup from '../components/CardDetailsPopup';
import CardList from '../components/CardList';
import ComparisonBar from '../components/ComparisonBar';
import FollowBankButton from '../components/FollowBankButton';
import { SkeletonCardGrid } from '../components/Skeleton';
import Toast from '../components/Toast';
import { VerdictStrip } from '../components/ui';
import { useSeoMeta } from '../hooks/useSeoMeta';
import {
  useLanguage,
  getCommonCopy,
  fillCopy,
  formatLocalizedDate,
  getDetailCopy,
} from '../locales';
import { apiService, BankApiResponse } from '../services/api';
import { getAccountProducts, AccountProduct } from '../services/bankAccounts';
import { bankPath, computeBankCardStats, fetchAllBanks, findBankBySlug } from '../services/banks';
import { getDepositProducts, DepositProduct } from '../services/deposits';
import { fetchLoanProducts, LoanProductListItem } from '../services/loans';
import { CreditCard } from '../types';
import { breadcrumbJsonLd } from '../utils/structuredData';
import '../styles/HomePage.css';
import '../styles/CategoryPage.css';
import '../styles/BankPage.css';
import '../styles/DecisionDetail.css';

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
  const [deposits, setDeposits] = useState<DepositProduct[] | null>(null);
  const [loans, setLoans] = useState<LoanProductListItem[] | null>(null);
  const [accounts, setAccounts] = useState<AccountProduct[] | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [viewedCard, setViewedCard] = useState<CreditCard | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string>('');
  const detail = getDetailCopy(lang);

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
    setDeposits(null);
    setLoans(null);
    setAccounts(null);
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
        // Cross-vertical hub data (redesign Phase 2): each vertical loads
        // independently; a failed vertical simply doesn't render its
        // section rather than failing the whole institution page.
        getDepositProducts({ bank: found.id, pageSize: 100 })
          .then(response => {
            if (!cancelled) setDeposits(response.results);
          })
          .catch(() => undefined);
        fetchLoanProducts({ bank: found.id })
          .then(items => {
            if (!cancelled) setLoans(items);
          })
          .catch(() => undefined);
        getAccountProducts({ bank: found.id, pageSize: 100 })
          .then(response => {
            if (!cancelled) setAccounts(response.results);
          })
          .catch(() => undefined);
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
  // Cross-vertical notables: flagship = highest CreditMate Score at the
  // bank; best deposit rate = top of the published rate ranges; the loan
  // figure spans the published bands, never a single point rate.
  const flagshipCard = cards
    .filter(card => card.creditmateScore != null)
    .sort((a, b) => (b.creditmateScore ?? 0) - (a.creditmateScore ?? 0))[0];
  const bestDeposit = (deposits ?? [])
    .filter(product => product.rateRange !== null)
    .sort((a, b) => (b.rateRange?.max ?? 0) - (a.rateRange?.max ?? 0))[0];
  const loanBandRange = (() => {
    const bands = (loans ?? []).flatMap(item => (item.effectiveRate ? [item.effectiveRate] : []));
    if (bands.length === 0) return null;
    const min = Math.min(...bands.map(band => band.min));
    const max = Math.max(...bands.map(band => band.max));
    return min === max ? `${min}%` : `${min}–${max}%`;
  })();
  const lastVerified = (() => {
    const dates: Date[] = [];
    cards.forEach(card => {
      if (card.verifiedAt) dates.push(new Date(card.verifiedAt));
    });
    (deposits ?? []).forEach(product => {
      if (product.verifiedAt) dates.push(new Date(product.verifiedAt));
    });
    (loans ?? []).forEach(item => {
      if (item.verifiedAt) dates.push(new Date(item.verifiedAt));
    });
    (accounts ?? []).forEach(product => {
      if (product.verifiedAt) dates.push(new Date(product.verifiedAt));
    });
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map(date => date.getTime())));
  })();
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
            <FollowBankButton bankId={bank.id} bankName={bank.name} />
          </div>

          {(flagshipCard || bestDeposit || loanBandRange || lastVerified) && (
            <VerdictStrip
              items={[
                ...(flagshipCard
                  ? [
                      {
                        label: detail.hubFlagshipCard,
                        value: `${flagshipCard.name} · ${flagshipCard.creditmateScore?.toFixed(
                          1
                        )}/10`,
                      },
                    ]
                  : []),
                ...(bestDeposit?.rateRange
                  ? [
                      {
                        label: detail.hubBestFdrRate,
                        value: `${bestDeposit.name} · ${bestDeposit.rateRange.max}%`,
                      },
                    ]
                  : []),
                ...(loanBandRange
                  ? [{ label: detail.hubLoanBandRange, value: loanBandRange }]
                  : []),
                ...(lastVerified
                  ? [
                      {
                        label: detail.hubLastVerified,
                        value: formatLocalizedDate(lastVerified, lang),
                      },
                    ]
                  : []),
              ]}
            />
          )}

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

          <h2 className="bank-cards-heading">{detail.hubCardsHeading}</h2>

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

          {deposits !== null && (
            <section className="p2-section" aria-labelledby="bank-deposits-heading">
              <h2 id="bank-deposits-heading">
                {detail.hubDepositsHeading} ·{' '}
                {fillCopy(detail.hubProductsCount, { count: String(deposits.length) })}
              </h2>
              <ul className="bank-hub-list">
                {deposits.slice(0, 3).map(product => (
                  <li key={product.slug}>
                    <Link to={`/deposits/${product.slug}`}>{product.name}</Link>
                    {product.rateRange && (
                      <span>
                        {' '}
                        · {product.rateRange.min}–{product.rateRange.max}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <Link to={`/deposits?bank=${bank.id}`}>{detail.hubViewDeposits}</Link>
            </section>
          )}

          {loans !== null && (
            <section className="p2-section" aria-labelledby="bank-loans-heading">
              <h2 id="bank-loans-heading">
                {detail.hubLoansHeading} ·{' '}
                {fillCopy(detail.hubProductsCount, { count: String(loans.length) })}
              </h2>
              <ul className="bank-hub-list">
                {loans.slice(0, 3).map(item => (
                  <li key={item.slug}>
                    <Link to={`/loans/${item.slug}`}>{item.name}</Link>
                    {item.effectiveRate && (
                      <span>
                        {' '}
                        · {item.effectiveRate.min}–{item.effectiveRate.max}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <Link to="/loans">{detail.hubViewLoans}</Link>
            </section>
          )}

          {accounts !== null && (
            <section className="p2-section" aria-labelledby="bank-accounts-heading">
              <h2 id="bank-accounts-heading">
                {detail.hubAccountsHeading} ·{' '}
                {fillCopy(detail.hubProductsCount, { count: String(accounts.length) })}
              </h2>
              <ul className="bank-hub-list">
                {accounts.slice(0, 3).map(product => (
                  <li key={product.slug}>
                    <Link to={`/accounts/${product.slug}`}>{product.name}</Link>
                    {product.rateSlabs.length > 0 && (
                      <span>
                        {' '}
                        · {Math.min(...product.rateSlabs.map(slab => slab.rate))}–
                        {Math.max(...product.rateSlabs.map(slab => slab.rateMax ?? slab.rate))}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <Link to={`/accounts?bank=${bank.id}`}>{detail.hubViewAccounts}</Link>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default BankPage;
