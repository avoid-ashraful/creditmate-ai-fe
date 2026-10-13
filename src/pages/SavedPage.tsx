import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getSavedCopy, useLanguage } from '../locales';
import {
  savedService,
  SavedComparison,
  SavedCollection,
  savedErrorMessage,
} from '../services/saved';
import '../styles/SavedPages.css';

const SavedPage: React.FC = () => {
  const { lang } = useLanguage();
  const t = getSavedCopy(lang);
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const refresh = async () => {
    setBusy(true);
    setError('');
    try {
      const [c, l] = await Promise.all([
        savedService.getComparisons(),
        savedService.getCollections(),
      ]);
      setComparisons(c);
      setCollections(l);
    } catch (e) {
      setError(savedErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const copyComparisonLink = async (item: SavedComparison) => {
    try {
      const updated = item.share_token
        ? item
        : await savedService.updateComparison(item.id, { is_public: true });
      await copyLink(updated.share_token);
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const copyCollectionLink = async (item: SavedCollection) => {
    try {
      const updated = item.share_token
        ? item
        : await savedService.updateCollection(item.id, { is_public: true });
      await copyLink(updated.share_token);
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const copyLink = async (token?: string | null) => {
    if (!token) throw new Error('Share token was not returned');
    await navigator.clipboard.writeText(
      `${window.location.origin}/shared/${encodeURIComponent(token)}`
    );
  };
  const createCollection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await savedService.createCollection({ name: name.trim(), description: '', is_public: false });
      setName('');
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const renameComparison = async (item: SavedComparison) => {
    const next = window.prompt(t.rename, item.name);
    if (!next?.trim()) return;
    try {
      await savedService.updateComparison(item.id, { name: next.trim() });
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const deleteComparison = async (item: SavedComparison) => {
    try {
      await savedService.deleteComparison(item.id);
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const renameCollection = async (item: SavedCollection) => {
    const next = window.prompt(t.rename, item.name);
    if (!next?.trim()) return;
    try {
      await savedService.updateCollection(item.id, { name: next.trim() });
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  const deleteCollection = async (item: SavedCollection) => {
    try {
      await savedService.deleteCollection(item.id);
      await refresh();
    } catch (e) {
      setError(savedErrorMessage(e));
    }
  };
  return (
    <section className="saved-page" aria-labelledby="saved-title">
      <h1 id="saved-title">{t.title}</h1>
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">{t.loading}</p>}
      <h2>{t.comparisons}</h2>
      {comparisons.length ? (
        <ul className="saved-list">
          {comparisons.map(item => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.card_ids.join(', ')}</span>
              <button onClick={() => void renameComparison(item)}>{t.rename}</button>
              <button onClick={() => void deleteComparison(item)}>{t.delete}</button>
              <button onClick={() => void copyComparisonLink(item)}>{t.share}</button>
            </li>
          ))}
        </ul>
      ) : (
        !busy && <p>{t.empty}</p>
      )}
      <h2>{t.collections}</h2>
      <form onSubmit={createCollection} className="saved-create">
        <label>
          {t.name}
          <input value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <button type="submit">{t.createCollection}</button>
      </form>
      {collections.length ? (
        <ul className="saved-list">
          {collections.map(item => (
            <li key={item.id}>
              <Link to={`/saved/collections/${item.id}`}>{item.name}</Link>
              <span>{item.description}</span>
              <button onClick={() => void renameCollection(item)}>{t.rename}</button>
              <button onClick={() => void deleteCollection(item)}>{t.delete}</button>
              <button onClick={() => void copyCollectionLink(item)}>{t.share}</button>
            </li>
          ))}
        </ul>
      ) : (
        !busy && <p>{t.empty}</p>
      )}
    </section>
  );
};
export default SavedPage;
