/**
 * Plan account comparison tool (Phase 3): the Phase 2 account scenario
 * engine as a standalone Plan tool. The balance opens preset with the
 * profile's typical balance, inputs live in the URL, and accounts rank by
 * net annual value — interest earned minus the published fees, with
 * unpublished fee lines never treated as zero.
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import SaveScenarioButton from '../components/SaveScenarioButton';
import { Button, Money, ResultCard, UnknownValue } from '../components/ui';
import { useProfile } from '../lib/profile';
import { useLanguage } from '../locales';
import { getAccountsCopy } from '../locales/accounts';
import { getPlanCopy } from '../locales/plan';
import { runAccountScenario, type AccountScenarioResponse } from '../services/bankAccounts';

import PlanLayout from './PlanLayout';

const PlanAccountPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getPlanCopy(lang);
  const accountsCopy = getAccountsCopy(lang);
  const { profile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [balance, setBalance] = useState(
    () => searchParams.get('balance') ?? String(profile.balance)
  );
  const [response, setResponse] = useState<AccountScenarioResponse | null>(null);
  const [error, setError] = useState(false);
  const [running, setRunning] = useState(false);

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    const balanceValue = Number(balance);
    if (!Number.isFinite(balanceValue) || balanceValue < 0) return;
    setSearchParams({ balance: String(balanceValue) }, { replace: true });
    setRunning(true);
    setError(false);
    try {
      const result = await runAccountScenario({ averageBalance: balanceValue });
      setResponse(result);
    } catch {
      setError(true);
      setResponse(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <PlanLayout titleKey="toolAccount">
      <form onSubmit={event => void run(event)} className="plan-tool-form">
        <div className="input-group">
          <label htmlFor="plan-account-balance">{copy.accountBalanceLabel}</label>
          <input
            id="plan-account-balance"
            type="number"
            min="0"
            value={balance}
            onChange={event => setBalance(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={running}>
          {copy.accountRunLabel}
        </Button>
      </form>

      {error ? (
        <p role="alert">{copy.accountError}</p>
      ) : response ? (
        <section aria-labelledby="plan-account-results">
          <h2 id="plan-account-results" className="cm-discovery-section-label">
            {copy.accountResultsHeading}
          </h2>
          {response.results.length === 0 ? (
            <p className="cm-discovery-note">{copy.accountEmpty}</p>
          ) : (
            <div className="cm-discovery-list">
              {response.results.map(result => (
                <ResultCard
                  key={result.product.id}
                  bankName={result.product.bank.name}
                  productName={result.product.name}
                  detailHref={`/accounts/${result.product.slug}`}
                  heroValue={
                    result.netAnnualValue !== null ? (
                      <Money value={result.netAnnualValue} />
                    ) : (
                      <UnknownValue kind="not-published" />
                    )
                  }
                  heroLabel={copy.accountNetLabel}
                  supportingFacts={[
                    {
                      label: accountsCopy.payoutLabel,
                      value: <Money value={result.interestEarned} />,
                    },
                    {
                      label: copy.accountFeesLabel,
                      value:
                        result.totalFees !== null ? (
                          <Money value={result.totalFees} />
                        ) : (
                          <UnknownValue kind="not-published" />
                        ),
                    },
                  ]}
                  islamic={result.product.isIslamic}
                />
              ))}
            </div>
          )}
          <p className="plan-save-row">
            <SaveScenarioButton tool="account" params={{ balance }} />
          </p>
        </section>
      ) : null}
    </PlanLayout>
  );
};

export default PlanAccountPage;
