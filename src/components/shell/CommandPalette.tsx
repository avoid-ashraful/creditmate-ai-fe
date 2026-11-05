/**
 * The global command palette (plan Section 5.4).
 *
 * One search overlay for the whole product: actions, products across all
 * four verticals, banks, and recent picks. Results are computed locally
 * from the cached catalogue — no network round-trip while typing. The
 * palette opens instantly with no animation (plan Section 5.2: keyboard-
 * initiated actions never animate), and its aria-activedescendant uses a
 * single flattened index space so the announced option is always the
 * highlighted one.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDialogFocus } from '../../hooks/useDialogFocus';
import { getShellCopy, useLanguage } from '../../locales';
import { apiService } from '../../services/api';
import { getAccountProducts } from '../../services/bankAccounts';
import { bankSlug, fetchAllBanks } from '../../services/banks';
import { getDepositProducts } from '../../services/deposits';
import { fetchLoanProducts } from '../../services/loans';
import { fetchAllPages } from '../../utils/fetchAllPages';
import { cardPathFor } from '../../utils/sitemap';

export interface PaletteItem {
  id: string;
  group: 'actions' | 'products' | 'banks' | 'recent';
  label: string;
  sublabel?: string;
  href: string;
  keywords: string;
}

interface CatalogueState {
  products: PaletteItem[];
  banks: PaletteItem[];
}

const RECENTS_KEY_PREFIX = 'creditmate.paletteRecents.v1';
const MAX_PER_GROUP = 6;

/** Recents are scoped per account (guest otherwise), like saved searches. */
export const paletteRecentsKey = (userId: number | null | undefined): string =>
  `${RECENTS_KEY_PREFIX}:${userId ? `user-${userId}` : 'guest'}`;

let catalogueCache: Promise<CatalogueState> | null = null;

const loadCatalogue = (): Promise<CatalogueState> => {
  if (!catalogueCache) {
    catalogueCache = (async () => {
      const products: PaletteItem[] = [];
      const banks: PaletteItem[] = [];
      const [bankRows, cardPages, depositPages, loanRows, accountPages] = await Promise.all([
        fetchAllBanks().catch(() => []),
        fetchAllPages(page => apiService.getCreditCards({ page_size: 100, page })).catch(
          () => null
        ),
        fetchAllPages(page => getDepositProducts({ page, pageSize: 100 })).catch(() => null),
        fetchLoanProducts({}).catch(() => []),
        fetchAllPages(page =>
          getAccountProducts({ page, pageSize: 100, includeVariants: true })
        ).catch(() => null),
      ]);

      bankRows.forEach(bank => {
        banks.push({
          id: `bank-${bank.id}`,
          group: 'banks',
          label: bank.name,
          href: `/bank/${bankSlug(bank)}`,
          keywords: bank.name.toLowerCase(),
        });
      });
      cardPages?.results.forEach(raw => {
        const card = apiService.transformCreditCard(raw);
        const href = card.bankName ? cardPathFor(card.bankName, card.name) : null;
        if (!href) return;
        products.push({
          id: `card-${card.id}`,
          group: 'products',
          label: card.name,
          sublabel: card.bankName,
          href,
          keywords: `${card.name} ${card.bankName ?? ''}`.toLowerCase(),
        });
      });
      depositPages?.results.forEach(product => {
        products.push({
          id: `deposit-${product.id}`,
          group: 'products',
          label: product.name,
          sublabel: product.institutionDisplayName,
          href: `/deposits/${product.slug}`,
          keywords: `${product.name} ${product.institutionDisplayName}`.toLowerCase(),
        });
      });
      loanRows.forEach(product => {
        products.push({
          id: `loan-${product.id}`,
          group: 'products',
          label: product.name,
          sublabel: product.lenderName,
          href: `/loans/${product.slug}`,
          keywords: `${product.name} ${product.lenderName}`.toLowerCase(),
        });
      });
      accountPages?.results.forEach(product => {
        products.push({
          id: `account-${product.id}`,
          group: 'products',
          label: product.name,
          sublabel: product.bank.name,
          href: `/accounts/${product.slug}`,
          keywords: `${product.name} ${product.bank.name}`.toLowerCase(),
        });
      });
      return { products, banks };
    })().catch(() => ({ products: [], banks: [] }));
  }
  return catalogueCache;
};

/** Test seam: drop the module-level catalogue cache. */
export const resetPaletteCatalogueCache = (): void => {
  catalogueCache = null;
};

const readRecents = (key: string): PaletteItem[] => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PaletteItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_PER_GROUP) : [];
  } catch {
    return [];
  }
};

const rememberRecent = (key: string, item: PaletteItem): void => {
  try {
    const next = [item, ...readRecents(key).filter(r => r.id !== item.id)].slice(0, MAX_PER_GROUP);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Non-fatal.
  }
};

const matches = (item: PaletteItem, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return item.keywords.includes(q) || item.label.toLowerCase().includes(q);
};

export interface CommandPaletteProps {
  onClose: () => void;
  /** Signed-in user id, used to scope the recents list; null = guest. */
  userId?: number | null;
}

/**
 * Mounted only while open (the shell renders it conditionally), so mount
 * itself is the open event: focus lands in the input and the catalogue
 * starts loading immediately.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, userId = null }) => {
  const { lang } = useLanguage();
  const copy = getShellCopy(lang);
  const navigate = useNavigate();
  const recentsKey = paletteRecentsKey(userId);
  const [query, setQuery] = useState('');
  const [catalogue, setCatalogue] = useState<CatalogueState | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useDialogFocus(dialogRef, inputRef);

  useEffect(() => {
    if (!catalogue) {
      setLoading(true);
      loadCatalogue()
        .then(state => setCatalogue(state))
        .finally(() => setLoading(false));
    }
  }, [catalogue]);

  const actions = useMemo<PaletteItem[]>(
    () => [
      {
        id: 'action-eligibility',
        group: 'actions',
        label: copy.actionEligibility,
        href: '/eligibility-checker',
        keywords: 'eligibility check income যোগ্যতা যাচাই',
      },
      {
        id: 'action-compare',
        group: 'actions',
        label: copy.actionCompare,
        href: '/compare',
        keywords: 'compare comparison তুলনা',
      },
      {
        id: 'action-emi',
        group: 'actions',
        label: copy.actionEmi,
        href: '/calculators',
        keywords: 'emi calculator loan instalment কিস্তি',
      },
      {
        id: 'action-payoff',
        group: 'actions',
        label: copy.actionPayoff,
        href: '/calculators',
        keywords: 'payoff calculator credit card debt',
      },
      {
        id: 'action-rewards',
        group: 'actions',
        label: copy.actionRewards,
        href: '/reward-calculator',
        keywords: 'reward value-back cashback points রিওয়ার্ড',
      },
      {
        id: 'action-quiz',
        group: 'actions',
        label: copy.actionQuiz,
        href: '/perfect-card-finder',
        keywords: 'quiz finder recommend কুইজ',
      },
      {
        id: 'action-deposits',
        group: 'actions',
        label: copy.actionDeposits,
        href: '/deposits',
        keywords: 'deposit fdr dps fixed deposit আমানত',
      },
      {
        id: 'action-loans',
        group: 'actions',
        label: copy.actionLoans,
        href: '/loans',
        keywords: 'loan personal home car ঋণ',
      },
      {
        id: 'action-accounts',
        group: 'actions',
        label: copy.actionAccounts,
        href: '/accounts',
        keywords: 'account savings current অ্যাকাউন্ট',
      },
    ],
    [copy]
  );

  const groups = useMemo(() => {
    const q = query.trim();
    const recent = q ? [] : readRecents(recentsKey);
    const actionItems = actions.filter(item => matches(item, q)).slice(0, MAX_PER_GROUP);
    const productItems = q
      ? (catalogue?.products ?? []).filter(item => matches(item, q)).slice(0, MAX_PER_GROUP)
      : [];
    const bankItems = q
      ? (catalogue?.banks ?? []).filter(item => matches(item, q)).slice(0, MAX_PER_GROUP)
      : [];
    return [
      { key: 'recent' as const, label: copy.paletteGroupRecent, items: recent },
      { key: 'actions' as const, label: copy.paletteGroupActions, items: actionItems },
      { key: 'products' as const, label: copy.paletteGroupProducts, items: productItems },
      { key: 'banks' as const, label: copy.paletteGroupBanks, items: bankItems },
    ].filter(group => group.items.length > 0);
  }, [actions, catalogue, copy, query, recentsKey]);

  const flatItems = useMemo(() => groups.flatMap(group => group.items), [groups]);

  /**
   * Rendered option ids are namespaced by group: the same item can appear
   * in Recent and in its own group, and aria-activedescendant must resolve
   * to the highlighted copy — never to a duplicate id earlier in the DOM.
   */
  const optionId = (groupKey: string, item: PaletteItem): string =>
    `cm-palette-option-${groupKey}-${item.id}`;

  const activeEntry = useMemo(() => {
    let cursor = -1;
    for (const group of groups) {
      for (const item of group.items) {
        cursor += 1;
        if (cursor === activeIndex) return { groupKey: group.key, item };
      }
    }
    return null;
  }, [groups, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const choose = (item: PaletteItem) => {
    rememberRecent(recentsKey, { ...item, group: 'recent' });
    onClose();
    navigate(item.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => (flatItems.length ? (index + 1) % flatItems.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index =>
        flatItems.length ? (index - 1 + flatItems.length) % flatItems.length : 0
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = flatItems[activeIndex];
      if (item) choose(item);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  let flatCursor = -1;

  return (
    <div className="cm-palette-backdrop" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="cm-palette"
        role="dialog"
        aria-modal="true"
        aria-label={copy.paletteAriaLabel}
        onMouseDown={event => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="cm-palette-input"
          type="text"
          role="combobox"
          aria-expanded={true}
          aria-controls="cm-palette-listbox"
          aria-activedescendant={
            activeEntry ? optionId(activeEntry.groupKey, activeEntry.item) : undefined
          }
          aria-label={copy.paletteAriaLabel}
          placeholder={copy.palettePlaceholder}
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div id="cm-palette-listbox" role="listbox" aria-label={copy.paletteAriaLabel}>
          {loading && flatItems.length === 0 ? (
            <p className="cm-palette-status">{copy.paletteLoading}</p>
          ) : null}
          {!loading && flatItems.length === 0 ? (
            <p className="cm-palette-status">{copy.paletteNoResults}</p>
          ) : null}
          {groups.map(group => (
            <div key={group.key} className="cm-palette-group">
              <p className="cm-palette-group-label" aria-hidden="true">
                {group.label}
              </p>
              <ul className="cm-palette-list">
                {group.items.map(item => {
                  flatCursor += 1;
                  const index = flatCursor;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={`${group.key}-${item.id}`}
                      id={optionId(group.key, item)}
                      role="option"
                      aria-selected={isActive}
                      className={isActive ? 'cm-palette-item is-active' : 'cm-palette-item'}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(item)}
                    >
                      <span className="cm-palette-item-label">{item.label}</span>
                      {item.sublabel ? (
                        <span className="cm-palette-item-sub">{item.sublabel}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
