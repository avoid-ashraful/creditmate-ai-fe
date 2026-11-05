import React from 'react';
import { Link } from 'react-router-dom';

import {
  changeDirection,
  feedEntryHref,
  feedSourceName,
  formatFeedValue,
  humaniseField,
} from '../lib/feedFormat';
import { formatLocalizedDate, useLanguage } from '../locales';
import { getAlertsCopy } from '../locales/alerts';
import { getChangesCopy } from '../locales/changes';
import type { BankFollowFeedEntry } from '../types/alerts';

import StatusChip from './ui/StatusChip';
import './ChangeCard.css';

/**
 * The delta-poster change card (Phase 4, addendum B1).
 *
 * One recorded change per card: the field as a label, the old -> new
 * values set large in tabular type with the new value as the hero, a
 * NEUTRAL slate direction chip (arrow + word — a rise helps savers and
 * hurts borrowers, so the data makes no judgement), and the change date
 * always present. Values are the stored history values rendered
 * verbatim; a missing side reads "Not published", never a blank.
 */
const ChangeCard: React.FC<{ entry: BankFollowFeedEntry }> = ({ entry }) => {
  const { lang } = useLanguage();
  const alertsCopy = getAlertsCopy(lang);
  const changesCopy = getChangesCopy(lang);
  const direction = changeDirection(entry.old_value, entry.new_value);
  const rawDirectionWord =
    direction === 'up'
      ? changesCopy.increased
      : direction === 'down'
      ? changesCopy.decreased
      : changesCopy.changed;
  // The locale strings are mid-sentence forms; the chip capitalises.
  const directionWord = rawDirectionWord.charAt(0).toUpperCase() + rawDirectionWord.slice(1);
  const directionIcon = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  return (
    <article className="cm-change-card">
      <header className="cm-change-card-head">
        <p className="cm-change-card-product">
          <Link to={feedEntryHref(entry)}>{entry.product_name}</Link>
          <span className="cm-change-card-bank"> · {entry.bank_name}</span>
        </p>
        {entry.is_new ? <StatusChip tone="accent">{changesCopy.newBadge}</StatusChip> : null}
      </header>
      <p className="cm-change-card-field">{humaniseField(entry.field_name)}</p>
      <p className="cm-change-card-values">
        <span className="cm-change-card-old">
          {formatFeedValue(entry.old_value, alertsCopy.feedNotPublished, lang)}
        </span>
        <span className="cm-change-card-arrow" aria-hidden="true">
          →
        </span>
        <strong className="cm-change-card-new">
          {formatFeedValue(entry.new_value, alertsCopy.feedNotPublished, lang)}
        </strong>
      </p>
      <p className="cm-change-card-meta">
        <StatusChip tone="neutral" icon={directionIcon}>
          {directionWord}
        </StatusChip>
        <span>{formatLocalizedDate(new Date(entry.changed_at), lang)}</span>
        {entry.source ? (
          <span>
            {alertsCopy.feedSourceLabel}: {feedSourceName(entry.source)}
          </span>
        ) : null}
      </p>
    </article>
  );
};

export default ChangeCard;
