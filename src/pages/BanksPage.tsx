import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SkeletonCardGrid } from '../components/Skeleton';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useLanguage, getCommonCopy } from '../locales';
import { BankApiResponse } from '../services/api';
import { bankPath, fetchAllBanks } from '../services/banks';
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
