import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AUTH_STATUS, useAuth } from '../hooks/AuthProvider';
import { getAuthCopy, getShellCopy, useLanguage } from '../locales';

const MENU_ID = 'account-menu-panel';

/** Initials for the avatar — the trigger never renders the email address. */
export const accountInitials = (
  user: { email: string; first_name?: string; last_name?: string } | null
): string => {
  if (!user) return '';
  const first = user.first_name?.trim().charAt(0) ?? '';
  const last = user.last_name?.trim().charAt(0) ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  const local = user.email.split('@')[0] ?? '';
  return local.slice(0, 2).toUpperCase();
};

/**
 * Shell account control (Phase 1 shell). Anonymous visitors see Sign in and
 * Register actions. Signed-in users see an initials avatar; its panel links
 * into My CreditMate and offers sign-out. Escape closes the panel and
 * returns focus to the trigger.
 */
export const AccountMenu: React.FC = () => {
  const { status, user, logout } = useAuth();
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const shell = getShellCopy(lang);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (status === AUTH_STATUS.loading) return null;

  if (status === AUTH_STATUS.anonymous || !user) {
    return (
      <div className="cm-account-anon">
        <Link to="/login" className="cm-account-signin">
          {shell.signIn}
        </Link>
        <Link to="/register" className="cm-account-register">
          {shell.register}
        </Link>
      </div>
    );
  }

  const closeMenu = (focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const handleLogout = () => {
    setOpen(false);
    // Leave any protected page first, so the guard does not redirect to /login.
    navigate('/');
    void logout();
  };

  return (
    <div
      ref={rootRef}
      className="cm-account-menu"
      onKeyDown={event => {
        if (event.key === 'Escape' && open) closeMenu(true);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="cm-account-trigger"
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen(previous => !previous)}
      >
        <span className="cm-account-avatar" aria-hidden="true">
          {accountInitials(user)}
        </span>
        <span className="cm-sr-only">{shell.accountMenuAriaLabel}</span>
      </button>
      {open && (
        <div id={MENU_ID} className="cm-account-panel" role="menu">
          <Link to="/my" role="menuitem" onClick={() => closeMenu()}>
            {shell.subMyHome}
          </Link>
          <Link to="/my/saved" role="menuitem" onClick={() => closeMenu()}>
            {shell.subMySaved}
          </Link>
          <Link to="/my/alerts" role="menuitem" onClick={() => closeMenu()}>
            {shell.subMyAlerts}
          </Link>
          <Link to="/my/profile" role="menuitem" onClick={() => closeMenu()}>
            {shell.subMyProfile}
          </Link>
          <button type="button" className="cm-account-logout" onClick={handleLogout}>
            {copy.headerLogout}
          </button>
        </div>
      )}
    </div>
  );
};

AccountMenu.displayName = 'AccountMenu';
