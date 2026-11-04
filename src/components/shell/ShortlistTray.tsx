/**
 * The shortlist tray panel (plan Section 5.3): opened from the shell's
 * tray button, it lists shortlisted products per vertical with remove
 * actions and — for cards — the route into the compare workspace.
 * Mounted only while open.
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { ShortlistVertical, useShortlist } from '../../hooks/ShortlistProvider';
import { fillCopy, getShellCopy, useLanguage } from '../../locales';

const VERTICAL_LABELS: Record<ShortlistVertical, { en: string; bn: string }> = {
  cards: { en: 'Cards', bn: 'কার্ড' },
  deposits: { en: 'Deposits', bn: 'আমানত' },
  loans: { en: 'Loans', bn: 'ঋণ' },
  accounts: { en: 'Bank accounts', bn: 'ব্যাংক অ্যাকাউন্ট' },
};

const VERTICAL_ORDER: ShortlistVertical[] = ['cards', 'deposits', 'loans', 'accounts'];

export interface ShortlistTrayProps {
  onClose: () => void;
}

const ShortlistTray: React.FC<ShortlistTrayProps> = ({ onClose }) => {
  const { lang } = useLanguage();
  const copy = getShellCopy(lang);
  const { items, remove, cardIds } = useShortlist();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cm-tray-backdrop" onMouseDown={onClose}>
      <div
        ref={panelRef}
        className="cm-tray"
        role="dialog"
        aria-modal="false"
        aria-label={copy.shortlistButton}
        tabIndex={-1}
        onMouseDown={event => event.stopPropagation()}
      >
        <h2 className="cm-tray-title">{copy.shortlistButton}</h2>
        {items.length === 0 ? (
          <p className="cm-tray-empty">{copy.shortlistEmpty}</p>
        ) : (
          VERTICAL_ORDER.map(vertical => {
            const group = items.filter(item => item.vertical === vertical);
            if (group.length === 0) return null;
            return (
              <div key={vertical} className="cm-tray-group">
                <h3 className="cm-tray-group-label">{VERTICAL_LABELS[vertical][lang]}</h3>
                <ul className="cm-tray-list">
                  {group.map(item => (
                    <li key={`${item.vertical}-${item.key}`} className="cm-tray-item">
                      <Link to={item.detailHref} onClick={onClose} className="cm-tray-item-link">
                        <span className="cm-tray-item-name">{item.name}</span>
                        <span className="cm-tray-item-bank">{item.bankName}</span>
                      </Link>
                      <button
                        type="button"
                        className="cm-tray-remove"
                        aria-label={fillCopy(copy.shortlistRemove, { name: item.name })}
                        onClick={() => remove(item.vertical, item.key)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                {vertical === 'cards' && cardIds.length >= 2 ? (
                  <Link
                    to={`/compare?ids=${cardIds.join(',')}`}
                    onClick={onClose}
                    className="cm-tray-compare"
                  >
                    {copy.shortlistCompareCards} ({cardIds.length})
                  </Link>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ShortlistTray;
