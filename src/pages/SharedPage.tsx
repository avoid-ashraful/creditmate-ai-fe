import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getSavedCopy, useLanguage } from '../locales';
import { savedService, SharedSavedItem } from '../services/saved';
import '../styles/SavedPages.css';

const SharedPage: React.FC = () => {
  const { token = '' } = useParams();
  const { lang } = useLanguage();
  const t = getSavedCopy(lang);
  const [item, setItem] = useState<SharedSavedItem | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true;
    savedService
      .shared(token)
      .then(value => {
        if (active) setItem(value);
      })
      .catch(() => {
        if (active) setMissing(true);
      });
    return () => {
      active = false;
    };
  }, [token]);
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
  const cardId = (card: NonNullable<typeof item.cards>[number]) =>
    'id' in card ? card.id : card.card?.id;
  const cardName = (id: number) => {
    const card = item.cards?.find(candidate => cardId(candidate) === id);
    return card && 'id' in card ? card.name : card?.card?.name;
  };
  const ids =
    item.card_ids || item.cards?.map(cardId).filter((id): id is number => id !== undefined) || [];
  return (
    <section className="saved-page">
      <h1>{item.name}</h1>
      {item.description && <p>{item.description}</p>}
      <h2>{t.cards}</h2>
      <ul>
        {ids.map(id => (
          <li key={id}>{cardName(id) || `#${id}`}</li>
        ))}
      </ul>
    </section>
  );
};
export default SharedPage;
