/**
 * The application shell (redesign plan Section 2 + Section 6).
 *
 * Desktop: a left rail (240px, collapsible to a 72px icon rail) holding the
 * four modes — Cards, Save, Borrow, Tools — plus Banks and Learn, with My
 * CreditMate, the shortlist tray, language/theme and the account control in
 * the rail footer. Mobile: a slim top bar (wordmark + search), the same
 * modes as a bottom bar, a "More" sheet for everything else, and a
 * shortlist sticky bar above the bottom bar while the shortlist is
 * non-empty. Mode memory returns each mode to its last discovery URL.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/AuthProvider';
import { useShortlist } from '../../hooks/ShortlistProvider';
import { getLegalNav, getShellCopy, LEGAL_PAGE_PATHS, useLanguage } from '../../locales';
import type { ShellCopy } from '../../locales';
import { importLegacySavedSearches } from '../../services/savedSearches';
import { AccountMenu } from '../AccountMenu';
import { ThemeToggle } from '../ThemeToggle';

import CommandPalette from './CommandPalette';
import {
  isMemorablePath,
  MODE_DEFINITIONS,
  ModeDefinition,
  modeForPath,
  ModeMemory,
  modeTarget,
  readModeMemory,
  writeModeMemory,
} from './modes';
import ShortlistTray from './ShortlistTray';

const RAIL_COLLAPSED_KEY = 'creditmate.railCollapsed.v1';

const ModeIcon: React.FC<{ id: string }> = ({ id }) => {
  const paths: Record<string, React.ReactNode> = {
    cards: <rect x="3" y="5" width="18" height="14" rx="2" />,
    save: (
      <>
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    ),
    borrow: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21v-8l7-5 7 5v8" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
    tools: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
      </>
    ),
    banks: (
      <>
        <path d="M3 9l9-6 9 6" />
        <path d="M4 9v10M20 9v10M8 9v10M12 9v10M16 9v10" />
        <path d="M2 19h20" />
      </>
    ),
    learn: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      </>
    ),
    my: <circle cx="12" cy="8" r="4" />,
  };
  return (
    <svg
      className="cm-mode-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[id] ?? <circle cx="12" cy="12" r="9" />}
      {id === 'my' ? <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /> : null}
    </svg>
  );
};

const SearchIcon: React.FC = () => (
  <svg
    className="cm-mode-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

const modeLabel = (copy: ShellCopy, id: string): string => {
  const labels: Record<string, string> = {
    cards: copy.modeCards,
    save: copy.modeSave,
    borrow: copy.modeBorrow,
    tools: copy.modeTools,
    banks: copy.navBanks,
    learn: copy.navLearn,
    my: copy.navMy,
  };
  return labels[id] ?? id;
};

const subLabel = (copy: ShellCopy, key: string): string =>
  (copy as unknown as Record<string, string>)[key] ?? key;

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { lang, toggleLang } = useLanguage();
  const copy = getShellCopy(lang);
  const location = useLocation();
  const { user } = useAuth();
  const { count, cardIds } = useShortlist();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(RAIL_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [memory, setMemory] = useState<ModeMemory>(() => readModeMemory());

  const activeMode = modeForPath(location.pathname);

  // Mode memory: remember the discovery URL inside each mode.
  useEffect(() => {
    const mode = modeForPath(location.pathname);
    if (!mode || !isMemorablePath(location.pathname)) return;
    const full = `${location.pathname}${location.search}`;
    setMemory(previous => {
      if (previous[mode] === full) return previous;
      const next = { ...previous, [mode]: full };
      writeModeMemory(next);
      return next;
    });
  }, [location.pathname, location.search]);

  // One-time import of legacy localStorage saved searches for signed-in users.
  useEffect(() => {
    if (user?.id) importLegacySavedSearches(user.id);
  }, [user?.id]);

  // Close transient overlays on navigation.
  useEffect(() => {
    setMoreOpen(false);
    setTrayOpen(false);
  }, [location.pathname]);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(open => !open);
      }
    };
    const onOpenRequest = () => setPaletteOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('creditmate:open-palette', onOpenRequest);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('creditmate:open-palette', onOpenRequest);
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(previous => {
      try {
        window.localStorage.setItem(RAIL_COLLAPSED_KEY, previous ? '0' : '1');
      } catch {
        // Non-fatal.
      }
      return !previous;
    });
  };

  const legalLinks = useMemo(() => {
    const nav = getLegalNav(lang);
    const keys = ['terms', 'privacy', 'disclaimer', 'howWeMakeMoney', 'methodology', 'contact'];
    return keys
      .filter(key => key in LEGAL_PAGE_PATHS && key in nav.titles)
      .map(key => ({
        key,
        label: (nav.titles as Record<string, string>)[key],
        href: (LEGAL_PAGE_PATHS as Record<string, string>)[key],
      }));
  }, [lang]);

  const mainModes = MODE_DEFINITIONS.filter(m =>
    ['cards', 'save', 'borrow', 'tools'].includes(m.id)
  );
  const secondaryModes = MODE_DEFINITIONS.filter(m => ['banks', 'learn'].includes(m.id));
  const myMode = MODE_DEFINITIONS.find(m => m.id === 'my') as ModeDefinition;

  const renderModeBlock = (mode: ModeDefinition, showSubs: boolean) => {
    const isActive = activeMode === mode.id;
    return (
      <div key={mode.id} className="cm-rail-mode">
        <Link
          to={modeTarget(mode, memory)}
          className={isActive ? 'cm-rail-mode-link is-active' : 'cm-rail-mode-link'}
          aria-current={isActive ? 'page' : undefined}
          title={collapsed ? modeLabel(copy, mode.id) : undefined}
        >
          <ModeIcon id={mode.id} />
          <span className="cm-rail-mode-label">{modeLabel(copy, mode.id)}</span>
        </Link>
        {showSubs && isActive && !collapsed ? (
          <ul className="cm-rail-subs">
            {mode.subs.map(sub => (
              <li key={sub.to}>
                <NavLink
                  to={sub.to}
                  end={sub.to === mode.landing}
                  className={({ isActive: subActive }) =>
                    subActive ? 'cm-rail-sub is-active' : 'cm-rail-sub'
                  }
                >
                  {subLabel(copy, sub.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  };

  const trayBarVisible = count > 0 && location.pathname !== '/compare';

  return (
    <div className={collapsed ? 'cm-layout is-collapsed' : 'cm-layout'} lang={lang}>
      <a href="#main-content" className="cm-skip-link">
        {copy.skipToContent}
      </a>

      <aside className="cm-rail" aria-label={copy.navAriaLabel}>
        <Link to="/" className="cm-rail-logo" aria-label="CreditMate AI">
          <span className="cm-logo-mark" aria-hidden="true">
            CM
          </span>
          <span className="cm-logo-word">CreditMate AI</span>
        </Link>
        <button type="button" className="cm-rail-search" onClick={openPalette}>
          <SearchIcon />
          <span className="cm-rail-search-label">{copy.searchPill}</span>
          <kbd className="cm-kbd" aria-hidden="true">
            ⌘K
          </kbd>
        </button>
        <nav className="cm-rail-nav" aria-label={copy.navAriaLabel}>
          {mainModes.map(mode => renderModeBlock(mode, true))}
          <div className="cm-rail-divider" aria-hidden="true" />
          {secondaryModes.map(mode => renderModeBlock(mode, true))}
        </nav>
        <div className="cm-rail-footer">
          <button
            type="button"
            className="cm-rail-tray"
            onClick={() => setTrayOpen(true)}
            aria-label={`${copy.shortlistButton} (${count})`}
          >
            <span className="cm-rail-tray-label">{copy.shortlistButton}</span>
            <span className="cm-rail-tray-count">{count}</span>
          </button>
          {renderModeBlock(myMode, false)}
          <div className="cm-rail-controls">
            <button
              type="button"
              className="cm-lang-toggle"
              onClick={toggleLang}
              aria-label={copy.languageLabel}
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>
            <ThemeToggle />
          </div>
          <AccountMenu />
          <button
            type="button"
            className="cm-rail-collapse"
            onClick={toggleCollapsed}
            aria-label={collapsed ? copy.expandRail : copy.collapseRail}
            aria-expanded={!collapsed}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
      </aside>

      <div className="cm-column">
        <header className="cm-topbar">
          <Link to="/" className="cm-topbar-logo">
            CreditMate AI
          </Link>
          <button
            type="button"
            className="cm-topbar-search"
            onClick={openPalette}
            aria-label={copy.searchAriaLabel}
          >
            <SearchIcon />
          </button>
        </header>

        <main id="main-content" className="cm-shell-main" tabIndex={-1}>
          {children}
        </main>

        <footer className="cm-shell-footer" role="contentinfo">
          <div className="cm-footer-inner">
            <div className="cm-footer-brand">
              <p className="cm-footer-name">CreditMate AI</p>
              <p className="cm-footer-tagline">{copy.footerTagline}</p>
            </div>
            <nav className="cm-footer-group" aria-label={copy.footerModesHeading}>
              <h2 className="cm-footer-heading">{copy.footerModesHeading}</h2>
              <ul>
                {mainModes.map(mode => (
                  <li key={mode.id}>
                    <Link to={mode.landing}>{modeLabel(copy, mode.id)}</Link>
                  </li>
                ))}
                <li>
                  <Link to="/banks">{copy.navBanks}</Link>
                </li>
              </ul>
            </nav>
            <nav className="cm-footer-group" aria-label={copy.footerLearnHeading}>
              <h2 className="cm-footer-heading">{copy.footerLearnHeading}</h2>
              <ul>
                <li>
                  <Link to="/guides">{copy.subGuides}</Link>
                </li>
                <li>
                  <Link to="/methodology">{copy.subMethodology}</Link>
                </li>
                <li>
                  <Link to="/glossary">{copy.subGlossary}</Link>
                </li>
              </ul>
            </nav>
            <nav className="cm-footer-group" aria-label={copy.footerLegalHeading}>
              <h2 className="cm-footer-heading">{copy.footerLegalHeading}</h2>
              <ul>
                {legalLinks.map(page => (
                  <li key={page.key}>
                    <Link to={page.href}>{page.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <p className="cm-footer-copy">© {new Date().getFullYear()} CreditMate AI</p>
        </footer>
      </div>

      {trayBarVisible ? (
        <div className="cm-traybar">
          <button type="button" className="cm-traybar-button" onClick={() => setTrayOpen(true)}>
            {copy.shortlistButton} · {count}
          </button>
          {cardIds.length >= 2 ? (
            <Link className="cm-traybar-compare" to={`/compare?ids=${cardIds.join(',')}`}>
              {copy.shortlistCompareCards}
            </Link>
          ) : null}
        </div>
      ) : null}

      <nav className="cm-bottombar" aria-label={copy.navAriaLabel}>
        {mainModes.map(mode => {
          const isActive = activeMode === mode.id;
          return (
            <Link
              key={mode.id}
              to={modeTarget(mode, memory)}
              className={isActive ? 'cm-bottombar-item is-active' : 'cm-bottombar-item'}
              aria-current={isActive ? 'page' : undefined}
            >
              <ModeIcon id={mode.id} />
              <span>{modeLabel(copy, mode.id)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="cm-bottombar-item"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(open => !open)}
        >
          <span className="cm-bottombar-more-icon" aria-hidden="true">
            •••
          </span>
          <span>{copy.moreButton}</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="cm-moresheet" role="dialog" aria-label={copy.moreButton}>
          <nav aria-label={copy.moreButton}>
            <ul className="cm-moresheet-list">
              <li>
                <Link to="/banks">{copy.navBanks}</Link>
              </li>
              <li>
                <Link to="/guides">{copy.navLearn}</Link>
              </li>
              <li>
                <Link to={modeTarget(myMode, memory)}>{copy.navMy}</Link>
              </li>
              <li>
                <Link to="/my/saved">{copy.subMySaved}</Link>
              </li>
              <li>
                <Link to="/my/alerts">{copy.subMyAlerts}</Link>
              </li>
              <li>
                <Link to="/my/profile">{copy.subMyProfile}</Link>
              </li>
            </ul>
          </nav>
          <div className="cm-moresheet-controls">
            <button type="button" className="cm-lang-toggle" onClick={toggleLang}>
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      ) : null}

      {paletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} /> : null}
      {trayOpen ? <ShortlistTray onClose={() => setTrayOpen(false)} /> : null}
    </div>
  );
};

export default AppShell;
