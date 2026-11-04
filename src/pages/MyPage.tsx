/**
 * My CreditMate overview (redesign plan Section 2.1 / Section 4.10).
 *
 * The signed-in home for everything personal: the shortlist (grouped by
 * vertical, with the route into compare), saved searches tied to the
 * account, counts of saved comparisons and collections, and links into
 * alerts and profile. Signed-out visitors get an explanation and the
 * sign-in/register actions — the route itself is not guarded so the page
 * can explain itself.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button, ConfirmDialog, useToast } from '../components/ui';
import { AUTH_STATUS, useAuth } from '../hooks/AuthProvider';
import { useShortlist } from '../hooks/ShortlistProvider';
import { getShellCopy, useLanguage } from '../locales';
import { savedService } from '../services/saved';
import { deleteSavedSearch, listSavedSearches, SavedSearch } from '../services/savedSearches';

const MyPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getShellCopy(lang);
  const { status, user } = useAuth();
  const { toast } = useToast();
  const shortlist = useShortlist();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [savedCounts, setSavedCounts] = useState<{
    comparisons: number;
    collections: number;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedSearch | null>(null);

  const refreshSearches = useCallback(() => {
    setSearches(listSavedSearches(user?.id ?? null));
  }, [user?.id]);

  useEffect(() => {
    refreshSearches();
  }, [refreshSearches]);

  useEffect(() => {
    if (status !== AUTH_STATUS.authenticated) return;
    let cancelled = false;
    (async () => {
      const [comparisons, collections] = await Promise.all([
        savedService.getComparisons().catch(() => []),
        savedService.getCollections().catch(() => []),
      ]);
      if (!cancelled) {
        setSavedCounts({ comparisons: comparisons.length, collections: collections.length });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === AUTH_STATUS.loading) return null;

  if (status !== AUTH_STATUS.authenticated || !user) {
    return (
      <div className="my-page">
        <h1>{copy.myHeading}</h1>
        <p className="cm-discovery-note">{copy.mySignedOut}</p>
        <p>
          <Link to="/login">{copy.signIn}</Link> · <Link to="/register">{copy.register}</Link>
        </p>
      </div>
    );
  }

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteSavedSearch(user.id ?? null, pendingDelete.id);
    setPendingDelete(null);
    refreshSearches();
    toast({ message: copy.mySearchDeleted });
  };

  return (
    <div className="my-page">
      <h1>{copy.myHeading}</h1>
      <p className="cm-discovery-note">{copy.myIntro}</p>

      <section aria-labelledby="my-shortlist-heading">
        <h2 id="my-shortlist-heading" className="cm-discovery-section-label">
          {copy.myShortlistHeading}
        </h2>
        {shortlist.items.length === 0 ? (
          <p className="cm-discovery-note">{copy.myNoShortlist}</p>
        ) : (
          <>
            <ul className="cm-home-list">
              {shortlist.items.map(item => (
                <li key={`${item.vertical}-${item.key}`}>
                  <Link to={item.detailHref}>
                    {item.name} · {item.bankName}
                  </Link>{' '}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shortlist.remove(item.vertical, item.key)}
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
            {shortlist.cardIds.length >= 2 ? (
              <p>
                <Link to={`/compare?ids=${shortlist.cardIds.join(',')}`}>
                  {copy.shortlistCompareCards} ({shortlist.cardIds.length})
                </Link>
              </p>
            ) : null}
          </>
        )}
      </section>

      <section aria-labelledby="my-searches-heading">
        <h2 id="my-searches-heading" className="cm-discovery-section-label">
          {copy.mySavedSearchesHeading}
        </h2>
        {searches.length === 0 ? (
          <p className="cm-discovery-note">{copy.myNoSavedSearches}</p>
        ) : (
          <ul className="cm-home-list">
            {searches.map(search => (
              <li key={search.id}>
                <Link to={search.query ? `${search.path}?${search.query}` : search.path}>
                  {search.name}
                </Link>{' '}
                <Button variant="ghost" size="sm" onClick={() => setPendingDelete(search)}>
                  {copy.myDeleteSearch}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="my-saved-heading">
        <h2 id="my-saved-heading" className="cm-discovery-section-label">
          {copy.mySavedItemsHeading}
        </h2>
        {savedCounts ? (
          <p className="cm-discovery-note">
            {savedCounts.comparisons} · {savedCounts.collections}
          </p>
        ) : null}
        <p>
          <Link to="/my/saved">{copy.myViewAllSaved}</Link>
        </p>
      </section>

      <section aria-labelledby="my-alerts-heading">
        <h2 id="my-alerts-heading" className="cm-discovery-section-label">
          {copy.myAlertsHeading}
        </h2>
        <p>
          <Link to="/my/alerts">{copy.myManageAlerts}</Link>
        </p>
      </section>

      <section aria-labelledby="my-profile-heading">
        <h2 id="my-profile-heading" className="cm-discovery-section-label">
          {copy.myProfileHeading}
        </h2>
        <p>
          <Link to="/my/profile">{copy.myEditProfile}</Link>
        </p>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={copy.myDeleteSearch}
        message={pendingDelete?.name ?? ''}
        confirmLabel={copy.myDeleteSearch}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default MyPage;
