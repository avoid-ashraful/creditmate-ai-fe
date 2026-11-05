import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SkeletonCardGrid } from '../components/Skeleton';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useLanguage, getCommonCopy, formatLocalizedDate, getDetailCopy } from '../locales';
import { apiService, BankApiResponse } from '../services/api';
import { getAccountProducts } from '../services/bankAccounts';
import { bankPath, fetchAllBanks } from '../services/banks';
import { getDepositProducts } from '../services/deposits';
import { fetchLoanProducts } from '../services/loans';
import { breadcrumbJsonLd } from '../utils/structuredData';
import '../styles/HomePage.css';
import '../styles/CategoryPage.css';
import '../styles/BankPage.css';

type LoadState = 'loading' | 'ready' | 'error';

const byCardCountThenName = (a: BankApiResponse, b: BankApiResponse): number =>
  b.credit_card_count - a.credit_card_count || a.name.localeCompare(b.name);

const BanksPage: React.FC = () => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [banks, setBanks] = useState<BankApiResponse[]>([]);
  const [search, setSearch] = useState('');
  // Cross-vertical index data (redesign Phase 2): per-bank product counts
  // for deposits/loans/accounts and the bank's last verification date
  // across every vertical, cards included. Each source loads on its own;
  // a failed source just leaves its counts off the tiles.
  const [verticalCounts, setVerticalCounts] = useState<{
    deposits: Map<number, number>;
    loans: Map<number, number>;
    accounts: Map<number, number>;
  } | null>(null);
  const [lastVerifiedByBank, setLastVerifiedByBank] = useState<Map<number, Date>>(new Map());
  const detail = getDetailCopy(lang);

  useSeoMeta({
    title: 'Banks in Bangladesh offering credit cards | CreditMate AI',
    description:
      'Browse every bank in Bangladesh that offers credit cards and compare the cards each bank issues.',
    canonicalPath: '/banks',
    jsonLd: breadcrumbJsonLd(window.location.origin, [
      { name: 'Home', path: '/' },
      { name: 'Banks', path: '/banks' },
    ]),
  });

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const allBanks = await fetchAllBanks();
        if (cancelled) return;
        setBanks([...allBanks].sort(byCardCountThenName));
        setLoadState('ready');
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to load banks:', fetchError);
        setLoadState('error');
      }
    };
    load();

    const bumpVerified = (bankId: number | null, value: string | Date | null | undefined) => {
      if (bankId === null || !value) return;
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return;
      setLastVerifiedByBank(prev => {
        const existing = prev.get(bankId);
        if (existing && existing >= date) return prev;
        const next = new Map(prev);
        next.set(bankId, date);
        return next;
      });
    };
    const countBy = (ids: Array<number | null>): Map<number, number> => {
      const map = new Map<number, number>();
      ids.forEach(id => {
        if (id !== null) map.set(id, (map.get(id) ?? 0) + 1);
      });
      return map;
    };

    getDepositProducts({ pageSize: 500 })
      .then(response => {
        if (cancelled) return;
        response.results.forEach(product =>
          bumpVerified(product.bank?.id ?? null, product.verifiedAt)
        );
        setVerticalCounts(prev => ({
          deposits: countBy(response.results.map(product => product.bank?.id ?? null)),
          loans: prev?.loans ?? new Map(),
          accounts: prev?.accounts ?? new Map(),
        }));
      })
      .catch(() => undefined);
    fetchLoanProducts({})
      .then(items => {
        if (cancelled) return;
        items.forEach(item => bumpVerified(item.bank, item.verifiedAt));
        setVerticalCounts(prev => ({
          deposits: prev?.deposits ?? new Map(),
          loans: countBy(items.map(item => item.bank)),
          accounts: prev?.accounts ?? new Map(),
        }));
      })
      .catch(() => undefined);
    getAccountProducts({ pageSize: 500 })
      .then(response => {
        if (cancelled) return;
        response.results.forEach(product => bumpVerified(product.bank.id, product.verifiedAt));
        setVerticalCounts(prev => ({
          deposits: prev?.deposits ?? new Map(),
          loans: prev?.loans ?? new Map(),
          accounts: countBy(response.results.map(product => product.bank.id)),
        }));
      })
      .catch(() => undefined);
    // Cards: page through the catalogue once for verification dates.
    (async () => {
      try {
        let page = 1;
        for (;;) {
          const response = await apiService.getCreditCards({ page, page_size: 100 });
          if (cancelled) return;
          response.results.forEach(raw => {
            const card = apiService.transformCreditCard(raw);
            bumpVerified(card.bankId ?? null, card.verifiedAt);
          });
          if (!response.next) return;
          page += 1;
        }
      } catch {
        // Verification dates are an enhancement; the index works without.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleBanks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return banks;
    return banks.filter(bank => bank.name.toLowerCase().includes(query));
  }, [banks, search]);

  return (
    <div className="category-page banks-page">
      <div className="category-header">
        <h1>{common.banksIndexTitle}</h1>
        <p>{common.banksIndexDesc}</p>
        {loadState === 'ready' && (
          <span className="category-count">
            {banks.length} {common.banksTotalLabel}
          </span>
        )}
      </div>

      {loadState === 'loading' ? (
        <SkeletonCardGrid label={common.banksSkeletonLabel} />
      ) : loadState === 'error' ? (
        <div className="error-state" role="alert">
          {common.banksErrorLoading}
        </div>
      ) : (
        <>
          <div className="banks-search">
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={common.banksSearchPlaceholder}
              aria-label={common.banksSearchAriaLabel}
            />
          </div>

          {visibleBanks.length === 0 ? (
            <p className="banks-no-results">{common.banksNoResults}</p>
          ) : (
            <ul className="banks-grid">
              {visibleBanks.map(bank => (
                <li key={bank.id} className="bank-tile">
                  <Link to={bankPath(bank)} className="bank-tile-link">
                    {bank.logo ? (
                      <img
                        className="bank-tile-logo"
                        src={bank.logo}
                        alt=""
                        loading="lazy"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="bank-tile-logo bank-tile-logo-fallback" aria-hidden="true">
                        {bank.name.charAt(0)}
                      </span>
                    )}
                    <span className="bank-tile-name">{bank.name}</span>
                    <span className="bank-tile-count">
                      {common.banksCardCount.replace('{count}', String(bank.credit_card_count))}
                    </span>
                    {verticalCounts && (
                      <span className="bank-tile-count">
                        {verticalCounts.deposits.get(bank.id) ?? 0} {detail.indexDepositsLabel} ·{' '}
                        {verticalCounts.loans.get(bank.id) ?? 0} {detail.indexLoansLabel} ·{' '}
                        {verticalCounts.accounts.get(bank.id) ?? 0} {detail.indexAccountsLabel}
                      </span>
                    )}
                    {lastVerifiedByBank.get(bank.id) && (
                      <span className="bank-tile-count">
                        {detail.indexLastVerified}:{' '}
                        {formatLocalizedDate(lastVerifiedByBank.get(bank.id) as Date, lang)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default BanksPage;
