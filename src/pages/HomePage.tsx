/**
 * Home as a decision dashboard (redesign plan Section 2.3).
 *
 * Home is no longer the card catalogue. In order: the promise and
 * coverage, a search entry into the command palette, the user's numbers
 * (profile strip), four mode entry cards whose headlines are computed by
 * the same scenario engines the discovery pages use, shortlist & saved
 * continuation, the most recently verified products from the latest
 * data, a Learn strip, and the trust strip. Every figure is fault-
 * isolated: a failed headline degrades to an invitation, never a
 * fabricated number.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button, MoneyInput, TrustChip, useToast } from '../components/ui';
import { guidesForLanguage } from '../content/guides';
import type { Guide } from '../content/guides';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSavedSearches } from '../hooks/useSavedSearches';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { formatTaka } from '../lib/format';
import { isDefaultProfile, useProfile } from '../lib/profile';
import { fillCopy, getCardDetailCopy, getHomeCopy, getShellCopy, useLanguage } from '../locales';
import { getAccountsCopy } from '../locales/accounts';
import { getDepositsCopy } from '../locales/deposits';
import {
  advancedSearchService,
  transformAdvancedSearchCard,
  uiStateToParams,
  DEFAULT_UI_STATE,
} from '../services/advancedSearch';
import { apiService } from '../services/api';
import { getAccountProducts, runAccountScenario } from '../services/bankAccounts';
import { fetchAllBanks } from '../services/banks';
import { getDepositProducts, runDepositScenario } from '../services/deposits';
import { fetchLoanProducts, runLoanScenario } from '../services/loans';
import { fetchAllPages } from '../utils/fetchAllPages';
import { organizationJsonLd, websiteJsonLd } from '../utils/structuredData';

import './HomePage.css';

interface VerifiedEntry {
  key: string;
  name: string;
  bankName: string;
  href: string;
  date: string;
  source: string;
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const HomePage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getHomeCopy(lang);
  const depositsCopy = getDepositsCopy(lang);
  const accountsCopy = getAccountsCopy(lang);
  const shellCopy = getShellCopy(lang);
  const cardDetailCopy = getCardDetailCopy(lang);
  const { toast } = useToast();
  const shortlist = useShortlist();
  const { profile, setProfile } = useProfile();

  useSeoMeta({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath: '/',
    jsonLd: [organizationJsonLd(window.location.origin), websiteJsonLd(window.location.origin)],
  });

  const [coverage, setCoverage] = useState<{ banks: number; products: number } | null>(null);
  const [headlines, setHeadlines] = useState<{
    card: string | null;
    deposit: string | null;
    account: string | null;
    loan: string | null;
  }>({ card: null, deposit: null, account: null, loan: null });
  const [recentlyVerified, setRecentlyVerified] = useState<VerifiedEntry[] | null>(null);
  const { searches: savedSearches } = useSavedSearches();

  const [draftBalance, setDraftBalance] = useState<number | null>(profile.balance);
  const [draftSpend, setDraftSpend] = useState<number | null>(profile.monthlySpend);
  const [draftLoan, setDraftLoan] = useState<number | null>(profile.loanAmount);

  useEffect(() => {
    setDraftBalance(profile.balance);
    setDraftSpend(profile.monthlySpend);
    setDraftLoan(profile.loanAmount);
  }, [profile]);

  // Coverage counts — fault-isolated per source.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [banks, cards, deposits, loans, accounts] = await Promise.all([
        fetchAllBanks().catch(() => null),
        apiService.getCreditCards({ page_size: 1 }).catch(() => null),
        fetchAllPages(page => getDepositProducts({ page, pageSize: 100 })).catch(() => null),
        fetchLoanProducts({}).catch(() => null),
        fetchAllPages(page =>
          getAccountProducts({ page, pageSize: 100, includeVariants: true })
        ).catch(() => null),
      ]);
      if (cancelled) return;
      const products =
        (cards?.count ?? 0) +
        (deposits?.results.length ?? 0) +
        (loans?.length ?? 0) +
        (accounts?.results.length ?? 0);
      // Provenance must never print a number we failed to load: if the bank
      // list failed, the whole coverage line stays hidden rather than
      // claiming "0 banks".
      if (banks !== null && products > 0) {
        setCoverage({ banks: banks.length, products });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mode headlines from the same scenario engines as discovery.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cardRes, depositRes, loanRes, accountRes] = await Promise.all([
        advancedSearchService
          .search(
            uiStateToParams({
              ...DEFAULT_UI_STATE,
              ordering: '-creditmate_score',
              page: 1,
              pageSize: 1,
            })
          )
          .catch(() => null),
        runDepositScenario({ kind: 'fdr', amount: 500000, months: 12, hasTin: true }).catch(
          () => null
        ),
        runLoanScenario({
          loanType: 'personal',
          amount: profile.loanAmount,
          tenureMonths: 60,
        }).catch(() => null),
        runAccountScenario({
          averageBalance: profile.balance,
          accountType: 'savings',
        }).catch(() => null),
      ]);
      if (cancelled) return;
      const next = { card: null, deposit: null, account: null, loan: null } as typeof headlines;

      const topCardRaw = cardRes?.results?.[0];
      if (topCardRaw) {
        const topCard = transformAdvancedSearchCard(topCardRaw);
        if (topCard.creditmateScore !== null && topCard.creditmateScore !== undefined) {
          next.card = fillCopy(copy.topCardHeadline, {
            score: topCard.creditmateScore.toFixed(1),
            name: topCard.name,
          });
        }
      }
      const bestDeposit = depositRes?.results?.[0];
      if (bestDeposit) {
        next.deposit = fillCopy(copy.bestDepositHeadline, {
          amount: formatTaka(500000),
          months: '12',
          value: formatTaka(bestDeposit.netMaturity, { decimals: 2 }),
          name: bestDeposit.product.name,
        });
      }
      if (loanRes && loanRes.results.length > 0) {
        const priced = loanRes.results.filter(r => r.atMaxRate !== null);
        if (priced.length > 0) {
          const cheapest = priced.reduce((a, b) =>
            (a.atMaxRate?.totalCost ?? Infinity) <= (b.atMaxRate?.totalCost ?? Infinity) ? a : b
          );
          if (cheapest.atMaxRate) {
            next.loan = fillCopy(copy.cheapestLoanHeadline, {
              amount: formatTaka(profile.loanAmount),
              // EMI range across the band, as on the loans page: the low
              // end at the band's minimum rate, the high end at its max.
              min: formatTaka(cheapest.atMinRate?.emi ?? cheapest.atMaxRate.emi),
              max: formatTaka(cheapest.atMaxRate.emi),
            });
          }
        }
      }
      const bestAccount = accountRes?.results?.[0];
      if (bestAccount && bestAccount.netAnnualValue !== null) {
        next.account = fillCopy(copy.bestAccountHeadline, {
          balance: formatTaka(profile.balance),
          value: formatTaka(bestAccount.netAnnualValue, { decimals: 2 }),
          name: bestAccount.product.name,
        });
      }
      setHeadlines(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.loanAmount, profile.balance, lang]);

  // Recently verified — the products with the newest verification dates.
  // Verification is all this data supports: nothing here claims a rate
  // *changed* (the real change feed is a later phase).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [deposits, accounts, cards] = await Promise.all([
        fetchAllPages(page => getDepositProducts({ page, pageSize: 100 })).catch(() => null),
        fetchAllPages(page =>
          getAccountProducts({ page, pageSize: 100, includeVariants: true })
        ).catch(() => null),
        apiService.getCreditCards({ page_size: 100, page: 1 }).catch(() => null),
      ]);
      if (cancelled) return;
      const entries: VerifiedEntry[] = [];
      deposits?.results.forEach(product => {
        const date = product.verifiedAt ?? product.rateEffectiveDate;
        if (!date) return;
        entries.push({
          key: `deposit-${product.id}`,
          name: product.name,
          bankName: product.institutionDisplayName,
          href: `/deposits/${product.slug}`,
          date,
          source: product.sourceKind === 'bb_chart' ? 'BB chart' : depositsCopy.sourceLabel,
        });
      });
      accounts?.results.forEach(product => {
        const date = product.verifiedAt ?? product.rateEffectiveDate;
        if (!date) return;
        entries.push({
          key: `account-${product.id}`,
          name: product.name,
          bankName: product.bank.name,
          href: `/accounts/${product.slug}`,
          date,
          source: accountsCopy.sourceSocLabel,
        });
      });
      cards?.results.forEach(raw => {
        const card = apiService.transformCreditCard(raw);
        const date = card.verifiedAt ?? card.lastUpdated;
        if (!date) return;
        entries.push({
          key: `card-${card.id}`,
          name: card.name,
          bankName: card.bankName ?? '',
          href: '/cards',
          date: date.toISOString(),
          source: cardDetailCopy.sourceScheduleOfCharges,
        });
      });
      entries.sort((a, b) => b.date.localeCompare(a.date));
      setRecentlyVerified(entries.slice(0, 5));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const learnGuides = useMemo(() => {
    const own = guidesForLanguage(lang);
    const pool = own.length >= 3 ? own : [...own, ...guidesForLanguage('en')];
    const pick = (pattern: RegExp) => pool.find(guide => pattern.test(guide.category));
    const chosen = [pick(/card/i), pick(/deposit|saving|account/i), pick(/loan|borrow/i)].filter(
      (guide): guide is Guide => Boolean(guide)
    );
    for (const guide of pool) {
      if (chosen.length >= 3) break;
      if (!chosen.includes(guide)) chosen.push(guide);
    }
    return chosen.slice(0, 3);
  }, [lang]);

  const saveProfile = () => {
    setProfile({
      balance: draftBalance ?? profile.balance,
      monthlySpend: draftSpend ?? profile.monthlySpend,
      loanAmount: draftLoan ?? profile.loanAmount,
    });
    toast({ message: copy.profileSaved });
  };

  const openPalette = () => {
    window.dispatchEvent(new Event('creditmate:open-palette'));
  };

  return (
    <div className="home-page">
      <section className="cm-home-hero">
        <h1>{copy.heading}</h1>
        <p className="cm-home-promise">{copy.promise}</p>
        {coverage ? (
          <p className="cm-discovery-note">
            {fillCopy(copy.coverage, {
              banks: String(coverage.banks),
              products: String(coverage.products),
            })}
          </p>
        ) : null}
        <button type="button" className="cm-home-search" onClick={openPalette}>
          <span>{shellCopy.searchPill}</span>
          <kbd className="cm-kbd" aria-hidden="true">
            ⌘K
          </kbd>
        </button>
      </section>

      <section className="cm-home-profile" aria-labelledby="home-profile-heading">
        <h2 id="home-profile-heading">{copy.profileHeading}</h2>
        <p className="cm-discovery-note">
          {isDefaultProfile(profile) ? copy.profileDefaultsNote : copy.profileMakeYours}
        </p>
        <div className="cm-home-profile-fields">
          <MoneyInput
            label={copy.profileBalanceLabel}
            value={draftBalance}
            onValueChange={setDraftBalance}
          />
          <MoneyInput
            label={copy.profileSpendLabel}
            value={draftSpend}
            onValueChange={setDraftSpend}
          />
          <MoneyInput
            label={copy.profileLoanLabel}
            value={draftLoan}
            onValueChange={setDraftLoan}
          />
        </div>
        <Button variant="primary" onClick={saveProfile}>
          {copy.profileSave}
        </Button>
      </section>

      <section aria-labelledby="home-modes-heading">
        <h2 id="home-modes-heading">{copy.modesHeading}</h2>
        <div className="cm-home-modes">
          <article className="cm-home-mode">
            <h3>{copy.modeCardsTitle}</h3>
            <p>{headlines.card ?? copy.headlineUnavailable}</p>
            <p className="cm-discovery-note">{copy.modeCardsBlurb}</p>
            <Link to="/cards">{copy.explore} →</Link>
          </article>
          <article className="cm-home-mode">
            <h3>{copy.modeSaveTitle}</h3>
            <p>{headlines.deposit ?? copy.headlineUnavailable}</p>
            {headlines.account ? <p>{headlines.account}</p> : null}
            <p className="cm-discovery-note">{copy.modeSaveBlurb}</p>
            <Link to="/deposits">{copy.explore} →</Link>
          </article>
          <article className="cm-home-mode">
            <h3>{copy.modeBorrowTitle}</h3>
            <p>{headlines.loan ?? copy.headlineUnavailable}</p>
            <Link to="/loans">{copy.explore} →</Link>
          </article>
          <article className="cm-home-mode">
            <h3>{copy.modeToolsTitle}</h3>
            <p className="cm-discovery-note">{copy.modeToolsBlurb}</p>
            <Link to="/eligibility-checker">{copy.explore} →</Link>
          </article>
        </div>
      </section>

      <section aria-labelledby="home-shortlist-heading">
        <h2 id="home-shortlist-heading">{copy.shortlistHeading}</h2>
        {shortlist.items.length === 0 && savedSearches.length === 0 ? (
          <p className="cm-discovery-note">{copy.shortlistEmpty}</p>
        ) : (
          <>
            {shortlist.items.length > 0 ? (
              <ul className="cm-home-list">
                {shortlist.items.slice(0, 4).map(item => (
                  <li key={`${item.vertical}-${item.key}`}>
                    <Link to={item.detailHref}>
                      {item.name} · {item.bankName}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {shortlist.cardIds.length >= 2 ? (
              <p>
                <Link to={`/compare?ids=${shortlist.cardIds.join(',')}`}>{copy.shortlistView}</Link>
              </p>
            ) : null}
            {savedSearches.length > 0 ? (
              <>
                <h3>{copy.savedHeading}</h3>
                <ul className="cm-home-list">
                  {savedSearches.slice(0, 3).map(search => (
                    <li key={search.id}>
                      <Link to={search.query ? `${search.path}?${search.query}` : search.path}>
                        {search.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </section>

      <section aria-labelledby="home-verified-heading">
        <h2 id="home-verified-heading">{copy.verifiedHeading}</h2>
        <p className="cm-discovery-note">{copy.verifiedIntro}</p>
        {recentlyVerified === null ? null : recentlyVerified.length === 0 ? (
          <p className="cm-discovery-note">{copy.verifiedEmpty}</p>
        ) : (
          <ul className="cm-home-changed">
            {recentlyVerified.map(entry => (
              <li key={entry.key} className="cm-home-changed-item">
                <Link to={entry.href}>
                  {entry.name} · {entry.bankName}
                </Link>
                <TrustChip source={entry.source} dateLabel={formatDate(entry.date)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="home-learn-heading">
        <h2 id="home-learn-heading">{copy.learnHeading}</h2>
        <div className="cm-home-modes">
          {learnGuides.map(guide => (
            <article key={guide.slug} className="cm-home-mode">
              <h3>
                <Link to={`/guides/${guide.slug}`}>{guide.title}</Link>
              </h3>
              <p className="cm-discovery-note">{guide.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cm-home-trust" aria-labelledby="home-trust-heading">
        <h2 id="home-trust-heading">{copy.trustHeading}</h2>
        <p>{copy.trustBody}</p>
        <Link to="/methodology">{copy.trustMethodologyLink}</Link>
      </section>
    </div>
  );
};

export default HomePage;
