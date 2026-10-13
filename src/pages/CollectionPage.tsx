import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getSavedCopy, useLanguage } from '../locales';
import { savedService, SavedCollection, savedErrorMessage } from '../services/saved';
import '../styles/SavedPages.css';

const CollectionPage: React.FC = () => {
  const { id = '' } = useParams();
  const collectionId = Number(id);
  const { lang } = useLanguage();
  const t = getSavedCopy(lang);
  const [item, setItem] = useState<SavedCollection | null>(null);
  const [cardId, setCardId] = useState('');
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
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(cardId);
    if (!Number.isInteger(value) || value < 1) return;
    try {
      await savedService.addCard(collectionId, value);
      setCardId('');
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
  return (
    <section className="saved-page" aria-labelledby="collection-title">
      <Link to="/saved">← {t.title}</Link>
      {error && <p role="alert">{error}</p>}
      {!item ? (
        <p role="status">{t.loading}</p>
      ) : (
        <>
          <h1 id="collection-title">{item.name}</h1>
          <p>{item.description}</p>
          <form onSubmit={add} className="saved-create">
            <label>
              {t.addCard}
              <input
                type="number"
                min="1"
                value={cardId}
                onChange={e => setCardId(e.target.value)}
                required
              />
            </label>
            <button type="submit">{t.create}</button>
          </form>
          <h2>{t.cards}</h2>
          {item.cards?.length ? (
            <ul className="saved-list">
              {item.cards.map(card => (
                <li key={card.card_id}>
                  <span>{card.card?.name || `#${card.card_id}`}</span>
                  <button onClick={() => void remove(card.card_id)}>{t.remove}</button>
                </li>
              ))}
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
