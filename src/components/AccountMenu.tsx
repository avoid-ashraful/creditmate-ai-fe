import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AUTH_STATUS, useAuth } from '../hooks/AuthProvider';
import { useLanguage, getAuthCopy, getCommonCopy } from '../locales';

const MENU_ID = 'account-menu-panel';

/**
 * Header account control. Anonymous visitors see Log in and Register links.
 * Signed-in users see a disclosure button labelled with their email; it opens a
 * panel with My account and Log out. Escape closes the panel and returns focus
 * to the button.
 */
export const AccountMenu: React.FC = () => {
  const { status, user, logout } = useAuth();
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const common = getCommonCopy(lang);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (status === AUTH_STATUS.loading) return null;

  if (status === AUTH_STATUS.anonymous || !user) {
    return (
      <>
        <li className="lang-switcher-item">
          <Link to="/login" lang={lang}>
            {copy.headerLogin}
          </Link>
        </li>
        <li className="lang-switcher-item">
          <Link to="/register" lang={lang}>
            {copy.headerRegister}
          </Link>
        </li>
      </>
    );
  }

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleLogout = () => {
    setOpen(false);
    // Leave any protected page first, so the guard does not redirect to /login.
    navigate('/');
    void logout();
  };

  return (
    <li
      className="lang-switcher-item account-menu"
      onKeyDown={event => {
        if (event.key === 'Escape' && open) closeMenu();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="account-menu-trigger"
        aria-label={`${copy.headerAccountLabel}: ${user.email}`}
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen(previous => !previous)}
      >
        <span className="account-menu-email">{user.email}</span>
      </button>
      {open && (
        <div id={MENU_ID} className="account-menu-panel">
          <Link to="/account" onClick={() => setOpen(false)}>
            {copy.headerAccountLink}
          </Link>
          <Link to="/saved" onClick={() => setOpen(false)}>
            {common.accountMenuSavedItems}
          </Link>
          <button type="button" className="account-menu-logout" onClick={handleLogout}>
            {copy.headerLogout}
          </button>
        </div>
      )}
    </li>
  );
};

AccountMenu.displayName = 'AccountMenu';
