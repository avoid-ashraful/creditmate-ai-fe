/**
 * Plan workspace landing (redesign plan Section 4.8, Phase 3).
 *
 * The tools as one workspace: each tool card states the question it
 * answers, the workspace opens preset with the user's numbers, and saved
 * scenarios (real server rows for signed-in users) reopen exactly where
 * they were saved. Guests are told plainly that saving needs an account.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button, ConfirmDialog, useToast } from '../components/ui';
import { AUTH_STATUS, useAuth } from '../hooks/AuthProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { computeScenarioPreview } from '../lib/scenarioPreview';
import { useLanguage } from '../locales';
import { getPlanCopy } from '../locales/plan';
import { savedService, type SavedScenario } from '../services/saved';

import PlanLayout from './PlanLayout';

const scenarioHref = (scenario: SavedScenario): string => {
  const params = new URLSearchParams(scenario.params);
  const query = params.toString();
  return query ? `/plan/${scenario.tool}?${query}` : `/plan/${scenario.tool}`;
};

const PlanPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getPlanCopy(lang);
  const { status } = useAuth();
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [pendingDelete, setPendingDelete] = useState<SavedScenario | null>(null);
  // Ghost-preview state (Phase 4): the scenario whose outcome is being
  // shown before the user commits to opening it.
  const [preview, setPreview] = useState<{
    scenario: SavedScenario;
    text: string | null;
    loading: boolean;
  } | null>(null);

  const openPreview = (scenario: SavedScenario) => {
    setPreview({ scenario, text: null, loading: true });
    void computeScenarioPreview(scenario.tool, scenario.params, copy).then(text => {
      setPreview(current =>
        current && current.scenario.id === scenario.id
          ? { scenario, text, loading: false }
          : current
      );
    });
  };

  useSeoMeta({
    title: 'Plan your money | CreditMate AI',
    description:
      'EMI, payoff, rewards, deposit, loan and account tools in one workspace, preset with your numbers.',
    canonicalPath: '/plan',
  });

  useEffect(() => {
    if (status !== AUTH_STATUS.authenticated) return;
    let cancelled = false;
    savedService
      .getScenarios()
      .then(rows => {
        if (!cancelled) setScenarios(rows);
      })
      .catch(() => {
        if (!cancelled) setScenarios([]);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const tools: { href: string; title: string; desc: string }[] = [
    { href: '/plan/emi', title: copy.toolEmi, desc: copy.toolEmiDesc },
    { href: '/plan/payoff', title: copy.toolPayoff, desc: copy.toolPayoffDesc },
    { href: '/plan/rewards', title: copy.toolRewards, desc: copy.toolRewardsDesc },
    { href: '/plan/deposit', title: copy.toolDeposit, desc: copy.toolDepositDesc },
    { href: '/plan/loan', title: copy.toolLoan, desc: copy.toolLoanDesc },
    { href: '/plan/account', title: copy.toolAccount, desc: copy.toolAccountDesc },
    { href: '/eligibility-checker', title: copy.toolEligibility, desc: copy.toolEligibilityDesc },
  ];

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    void savedService
      .deleteScenario(target.id)
      .then(() => {
        setScenarios(previous => previous.filter(item => item.id !== target.id));
        toast({ message: copy.scenarioDeleted });
      })
      .catch(() => undefined);
  };

  return (
    <PlanLayout titleKey="heading" landing>
      <p className="cm-discovery-note">{copy.intro}</p>
      <p className="cm-discovery-note">{copy.numbersNote}</p>

      <section aria-labelledby="plan-tools-heading">
        <h2 id="plan-tools-heading" className="cm-discovery-section-label">
          {copy.toolsHeading}
        </h2>
        <ul className="cm-home-list">
          {tools.map(tool => (
            <li key={tool.href}>
              <Link to={tool.href}>{tool.title}</Link>
              <p className="cm-discovery-note">{tool.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="plan-saved-heading">
        <h2 id="plan-saved-heading" className="cm-discovery-section-label">
          {copy.savedHeading}
        </h2>
        {status !== AUTH_STATUS.authenticated ? (
          <p className="cm-discovery-note">{copy.signInToSave}</p>
        ) : scenarios.length === 0 ? (
          <p className="cm-discovery-note">{copy.noSavedScenarios}</p>
        ) : (
          <>
            <ul className="cm-home-list">
              {scenarios.map(scenario => (
                <li key={scenario.id}>
                  <button
                    type="button"
                    className="plan-scenario-name"
                    onClick={() => openPreview(scenario)}
                  >
                    {scenario.name}
                  </button>{' '}
                  <Button variant="ghost" size="sm" onClick={() => setPendingDelete(scenario)}>
                    {copy.deleteLabel}
                  </Button>
                </li>
              ))}
            </ul>
            {preview ? (
              <div className="plan-preview" role="region" aria-label={preview.scenario.name}>
                <p className="plan-preview-text">
                  {preview.loading ? copy.previewLoading : preview.text ?? copy.previewFailed}
                </p>
                <p className="plan-preview-actions">
                  <Link to={scenarioHref(preview.scenario)}>{copy.previewOpen}</Link>{' '}
                  <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                    {copy.previewCancel}
                  </Button>
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={copy.deleteLabel}
        message={pendingDelete?.name ?? ''}
        confirmLabel={copy.deleteLabel}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </PlanLayout>
  );
};

export default PlanPage;
