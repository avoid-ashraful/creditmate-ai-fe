import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import CardComparisonTable from '../components/CardComparisonTable';
import { Money, ResultCard, UnknownValue, VerdictStrip } from '../components/ui';
import { useShortlist } from '../hooks/ShortlistProvider';
import { compareVerdicts } from '../lib/verdicts';
import {
  getCardDetailCopy,
  getCommonCopy,
  getDiscoveryCopy,
  getSavedCopy,
  useLanguage,
} from '../locales';
import { getScoreCopy } from '../locales/score';
import type { CreditCardApiResponse } from '../services/api';
import { apiService } from '../services/api';
import { savedService, SharedSavedItem } from '../services/saved';
import type { CreditCard } from '../types';
import { cardPathFor } from '../utils/sitemap';
import '../styles/SavedPages.css';

/**
 * Public shared pages (plan Section 4.7): a shared comparison renders the
 * SAME verdict strip and comparison table as the owner's workspace, and a
 * shared collection renders the same ResultCards as discovery — recipients
 * get the real decision surface, not a names list. Recipients can
 * shortlist from here (guest or account scope, like everywhere else).
 */
const SharedPage: React.FC<{ kind?: 'comparison' | 'collection' }> = ({ kind = 'comparison' }) => {
  const { token = '', slug = '' } = useParams();
  const { lang } = useLanguage();
  const t = getSavedCopy(lang);
  const common = getCommonCopy(lang);
  const discoveryCopy = getDiscoveryCopy(lang);
  const detailCopy = getCardDetailCopy(lang);
  const scoreCopy = getScoreCopy(lang);
  const shortlist = useShortlist();
  const [item, setItem] = useState<SharedSavedItem | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true;
    setItem(null);
    setMissing(false);
    const request =
      kind === 'collection' ? savedService.sharedCollection(slug) : savedService.shared(token);
    request
      .then(value => {
        if (active) setItem(value);
      })
      .catch(() => {
        if (active) setMissing(true);
      });
    return () => {
      active = false;
    };
  }, [token, slug, kind]);
  if (missing)
    return (
      <section className="saved-page">
        <p role="alert">{t.notFound}</p>
      </section>
    );
  if (!item)
    return (
      <p className="saved-page" role="status">
        {t.loading}
      </p>
    );

  const rawCards: CreditCardApiResponse[] = (item.cards ?? []).map(entry =>
    'card' in entry ? entry.card : entry
  );
  const cards: CreditCard[] = rawCards.map(raw => apiService.transformCreditCard(raw));

  if (kind === 'collection') {
    return (
      <section className="saved-page">
        <h1>{item.name}</h1>
        {item.description && <p>{item.description}</p>}
        <h2>{t.cards}</h2>
        <div className="cm-discovery-results">
          {cards.map(card => (
            <ResultCard
              key={card.id}
              bankName={card.bankName ?? ''}
              productName={card.name}
              detailHref={cardPathFor(card.bankName ?? '', card.name) ?? '/cards'}
              heroValue={
                card.creditmateScore !== null && card.creditmateScore !== undefined ? (
                  card.creditmateScore.toFixed(1)
                ) : (
                  <UnknownValue kind="not-published" />
                )
              }
              heroLabel={scoreCopy.badgeLabel}
              supportingFacts={[
                {
                  label: detailCopy.annualFee,
                  value:
                    card.annualFee !== null && card.annualFee !== undefined ? (
                      <Money value={card.annualFee} />
                    ) : (
                      <UnknownValue kind="not-published" />
                    ),
                },
                {
                  label: detailCopy.apr,
                  value:
                    card.interestRateApr !== null && card.interestRateApr !== undefined ? (
                      `${card.interestRateApr}%`
                    ) : (
                      <UnknownValue kind="not-published" />
                    ),
                },
                {
                  label: common.filterLabelMonthlyIncome,
                  value:
                    card.minMonthlyIncome !== null && card.minMonthlyIncome !== undefined ? (
                      <Money value={card.minMonthlyIncome} />
                    ) : (
                      <UnknownValue kind="not-published" />
                    ),
                },
              ]}
              islamic={card.isIslamic}
              inShortlist={shortlist.isInShortlist('cards', String(card.id))}
              onToggleShortlist={() =>
                shortlist.toggle({
                  vertical: 'cards',
                  key: String(card.id),
                  name: card.name,
                  bankName: card.bankName ?? '',
                  detailHref: cardPathFor(card.bankName ?? '', card.name) ?? '/cards',
                })
              }
            />
          ))}
        </div>
      </section>
    );
  }

  const verdictItems = compareVerdicts(cards, {
    lowestFee: common.comparisonVerdictLowestFee,
    lowestApr: common.comparisonVerdictLowestApr,
  });
  return (
    <section className="saved-page">
      <h1>{item.name}</h1>
      {item.notes && <p>{item.notes}</p>}
      {verdictItems.length > 0 ? <VerdictStrip items={verdictItems} /> : null}
      <CardComparisonTable cards={cards} highlightDifferences={true} differencesOnly={false} />
      <ul className="cm-home-list">
        {cards.map(card => (
          <li key={card.id}>
            <button
              type="button"
              onClick={() =>
                shortlist.toggle({
                  vertical: 'cards',
                  key: String(card.id),
                  name: card.name,
                  bankName: card.bankName ?? '',
                  detailHref: cardPathFor(card.bankName ?? '', card.name) ?? '/cards',
                })
              }
            >
              {shortlist.isInShortlist('cards', String(card.id))
                ? discoveryCopy.inShortlist
                : discoveryCopy.addToShortlist}
              {' · '}
              {card.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
export default SharedPage;
