/**
 * My CreditMate overview (redesign plan Sections 2.1, 4.14; Phase 3).
 *
 * The signed-in home for everything personal: the shortlist (grouped by
 * vertical, with the route into compare), the account's server-stored
 * "Your numbers" defaults, saved searches (server-backed since Phase 3),
 * saved scenarios, counts of saved comparisons and collections, and links
 * into alerts and profile. Signed-out visitors get an explanation and the
 * sign-in/register actions — the route itself is not guarded so the page
 * can explain itself.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button, ConfirmDialog, useToast } from '../components/ui';
import { AUTH_STATUS, useAuth } from '../hooks/AuthProvider';
import { useShortlist } from '../hooks/ShortlistProvider';
import { useSavedSearches } from '../hooks/useSavedSearches';
import { formatTaka } from '../lib/format';
import { useProfile } from '../lib/profile';
import { fillCopy, getShellCopy, useLanguage } from '../locales';
import { savedService, type SavedScenario } from '../services/saved';
import type { SavedSearch } from '../services/savedSearches';

import './MyPage.css';

const scenarioHref = (scenario: SavedScenario): string => {
  const params = new URLSearchParams(scenario.params);
  const query = params.toString();
  return query ? `/plan/${scenario.tool}?${query}` : `/plan/${scenario.tool}`;
};

const MyPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getShellCopy(lang);
  const { status, user } = useAuth();
  const { toast } = useToast();
  const shortlist = useShortlist();
  const { profile } = useProfile();
  const { searches, remove: removeSearch } = useSavedSearches();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [savedCounts, setSavedCounts] = useState<{
    comparisons: number;
    collections: number;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedSearch | null>(null);
  const [pendingScenarioDelete, setPendingScenarioDelete] = useState<SavedScenario | null>(null);

  useEffect(() => {
    if (status !== AUTH_STATUS.authenticated) return;
    let cancelled = false;
    (async () => {
      const [comparisons, collections, scenarioRows] = await Promise.all([
        savedService.getComparisons().catch(() => []),
        savedService.getCollections().catch(() => []),
        savedService.getScenarios().catch(() => []),
      ]);
      if (!cancelled) {
        setSavedCounts({ comparisons: comparisons.length, collections: collections.length });
        setScenarios(scenarioRows);
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
    const target = pendingDelete;
    setPendingDelete(null);
    void removeSearch(target).then(() => {
      toast({ message: copy.mySearchDeleted });
    });
  };

  const confirmScenarioDelete = () => {
    if (!pendingScenarioDelete) return;
    const target = pendingScenarioDelete;
    setPendingScenarioDelete(null);
    void savedService
      .deleteScenario(target.id)
      .then(() => {
        setScenarios(previous => previous.filter(item => item.id !== target.id));
        toast({ message: copy.myScenarioDeleted });
      })
      .catch(() => undefined);
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

      <section aria-labelledby="my-numbers-heading">
        <h2 id="my-numbers-heading" className="cm-discovery-section-label">
          {copy.myNumbersHeading}
        </h2>
        <ul className="cm-home-list">
          <li>
            {copy.myNumbersBalance}: {formatTaka(profile.balance)}
          </li>
          <li>
            {copy.myNumbersSpend}: {formatTaka(profile.monthlySpend)}
          </li>
          <li>
            {copy.myNumbersLoan}: {formatTaka(profile.loanAmount)}
          </li>
        </ul>
        <p className="cm-discovery-note">{copy.myNumbersNote}</p>
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

      <section aria-labelledby="my-scenarios-heading">
        <h2 id="my-scenarios-heading" className="cm-discovery-section-label">
          {copy.myScenariosHeading}
        </h2>
        {scenarios.length === 0 ? (
          <p className="cm-discovery-note">{copy.myNoScenarios}</p>
        ) : (
          <ul className="cm-home-list">
            {scenarios.map(scenario => (
              <li key={scenario.id}>
                <Link to={scenarioHref(scenario)}>{scenario.name}</Link>{' '}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingScenarioDelete(scenario)}
                >
                  {copy.myDeleteScenario}
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
            {fillCopy(copy.mySavedCounts, {
              comparisons: String(savedCounts.comparisons),
              collections: String(savedCounts.collections),
            })}
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
      <ConfirmDialog
        open={pendingScenarioDelete !== null}
        title={copy.myDeleteScenario}
        message={pendingScenarioDelete?.name ?? ''}
        confirmLabel={copy.myDeleteScenario}
        onConfirm={confirmScenarioDelete}
        onCancel={() => setPendingScenarioDelete(null)}
      />
    </div>
  );
};

export default MyPage;
