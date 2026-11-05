import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getSavedCopy, useLanguage } from '../locales';
import { apiService, type CreditCardApiResponse } from '../services/api';
import { savedService, SavedCollection, savedErrorMessage } from '../services/saved';
import '../styles/SavedPages.css';

/**
 * Collection detail under /my/collections/:id.
 *
 * Cards are added by search/select (plan Section 4.14) — never by typing
 * a raw numeric ID, which meant nothing to anyone. Search results come
 * from the same card list endpoint discovery uses; cards already in the
 * collection are not offered again.
 */
const CollectionPage: React.FC = () => {
  const { id = '' } = useParams();
  const collectionId = Number(id);
  const { lang } = useLanguage();
  const t = getSavedCopy(lang);
  const [item, setItem] = useState<SavedCollection | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CreditCardApiResponse[]>([]);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      setItem(await savedService.getCollection(collectionId));
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  }, [collectionId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void apiService
        .getCreditCards({ searchTerm: term, page_size: 8 })
        .then(response => {
          if (!cancelled) setResults(response.results);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const add = async (value: number) => {
    try {
      await savedService.addCard(collectionId, value);
      setQuery('');
      setResults([]);
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const remove = async (value: number) => {
    try {
      await savedService.removeCard(collectionId, value);
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const inCollection = new Set(
    (item?.cards ?? []).map(card => card.card?.id).filter((v): v is number => v !== undefined)
  );
  return (
    <section className="saved-page" aria-labelledby="collection-title">
      <Link to="/my/saved">← {t.title}</Link>
      {error && <p role="alert">{error}</p>}
      {!item ? (
        <p role="status">{t.loading}</p>
      ) : (
        <>
          <h1 id="collection-title">{item.name}</h1>
          <p>{item.description}</p>
          <div className="saved-create">
            <label>
              {t.addCard}
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.addCardSearchPlaceholder}
              />
            </label>
            {results.length > 0 ? (
              <ul className="saved-list">
                {results
                  .filter(card => !inCollection.has(card.id))
                  .map(card => (
                    <li key={card.id}>
                      <span>
                        {card.name}
                        {card.bank_name ? ` · ${card.bank_name}` : ''}
                      </span>
                      <button type="button" onClick={() => void add(card.id)}>
                        {t.addCard}
                      </button>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
          <h2>{t.cards}</h2>
          {item.cards?.length ? (
            <ul className="saved-list">
              {item.cards.map(card => {
                const cardId = card.card?.id;
                return (
                  <li key={cardId}>
                    <span>{card.card?.name || `#${cardId}`}</span>
                    {cardId !== undefined && (
                      <button onClick={() => void remove(cardId)}>{t.remove}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>{t.empty}</p>
          )}
        </>
      )}
    </section>
  );
};
export default CollectionPage;
