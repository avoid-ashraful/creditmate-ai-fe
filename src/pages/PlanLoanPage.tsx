/**
 * Plan loan comparison tool (Phase 3): the Phase 2 loan scenario engine
 * as a standalone Plan tool. Amount opens preset with the profile's
 * planned loan amount ("mirror, don't decorate"), inputs live in the URL,
 * and every figure is priced at both ends of the published rate band.
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import MirrorLine from '../components/MirrorLine';
import SaveScenarioButton from '../components/SaveScenarioButton';
import { Button, Money, ResultCard, UnknownValue } from '../components/ui';
import { formatTaka } from '../lib/format';
import { useProfile } from '../lib/profile';
import { fillCopy, useLanguage } from '../locales';
import { getLoansCopy } from '../locales/loans';
import { getPlanCopy } from '../locales/plan';
import { runLoanScenario, type LoanScenarioResponse, type LoanType } from '../services/loans';

import PlanLayout from './PlanLayout';

const LOAN_TYPES: LoanType[] = ['personal', 'home', 'car', 'secured_against_deposit'];

const PlanLoanPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getPlanCopy(lang);
  const loansCopy = getLoansCopy(lang);
  const { profile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState(
    () => searchParams.get('amount') ?? String(profile.loanAmount)
  );
  const [tenure, setTenure] = useState(() => searchParams.get('months') ?? '36');
  const [loanType, setLoanType] = useState<LoanType>(() => {
    const fromUrl = searchParams.get('type');
    return LOAN_TYPES.includes(fromUrl as LoanType) ? (fromUrl as LoanType) : 'personal';
  });
  const [response, setResponse] = useState<LoanScenarioResponse | null>(null);
  const [error, setError] = useState(false);
  const [running, setRunning] = useState(false);

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    const amountValue = Number(amount);
    const tenureValue = Number(tenure);
    if (!Number.isFinite(amountValue) || amountValue <= 0 || !Number.isFinite(tenureValue)) {
      return;
    }
    setSearchParams(
      { amount: String(amountValue), months: String(tenureValue), type: loanType },
      { replace: true }
    );
    setRunning(true);
    setError(false);
    try {
      const result = await runLoanScenario({
        loanType,
        amount: amountValue,
        tenureMonths: tenureValue,
      });
      setResponse(result);
    } catch {
      setError(true);
      setResponse(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <PlanLayout titleKey="toolLoan">
      <p className="cm-discovery-note">{copy.loanBandNote}</p>
      {Number(amount) > 0 && Number(tenure) > 0 ? (
        <MirrorLine>
          {fillCopy(copy.mirrorLoan, {
            amount: formatTaka(Number(amount)),
            months: tenure,
            type: loanType,
          })}
        </MirrorLine>
      ) : null}
      <form onSubmit={event => void run(event)} className="plan-tool-form">
        <div className="input-group">
          <label htmlFor="plan-loan-amount">{copy.loanAmountLabel}</label>
          <input
            id="plan-loan-amount"
            type="number"
            min="1"
            value={amount}
            onChange={event => setAmount(event.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="plan-loan-tenure">{copy.loanTenureLabel}</label>
          <input
            id="plan-loan-tenure"
            type="number"
            min="1"
            value={tenure}
            onChange={event => setTenure(event.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="plan-loan-type">{copy.loanPurposeLabel}</label>
          <select
            id="plan-loan-type"
            value={loanType}
            onChange={event => setLoanType(event.target.value as LoanType)}
          >
            {LOAN_TYPES.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={running}>
          {copy.loanRunLabel}
        </Button>
      </form>

      {error ? (
        <p role="alert">{copy.loanError}</p>
      ) : response ? (
        <section aria-labelledby="plan-loan-results">
          <h2 id="plan-loan-results" className="cm-discovery-section-label">
            {copy.loanResultsHeading}
          </h2>
          {response.results.length === 0 ? (
            <p className="cm-discovery-note">{copy.loanEmpty}</p>
          ) : (
            <div className="cm-discovery-list">
              {response.results.map(result => (
                <ResultCard
                  key={result.product.id}
                  bankName={result.product.lenderName}
                  productName={result.product.name}
                  detailHref={`/loans/${result.product.slug}`}
                  heroValue={
                    result.atMinRate && result.atMaxRate ? (
                      <>
                        <Money value={result.atMinRate.emi} /> –{' '}
                        <Money value={result.atMaxRate.emi} />
                      </>
                    ) : (
                      <UnknownValue kind="not-published" />
                    )
                  }
                  heroLabel={copy.loanMonthlyLabel}
                  supportingFacts={[
                    {
                      label: copy.loanTotalInterestLabel,
                      value:
                        result.atMinRate && result.atMaxRate ? (
                          <>
                            <Money value={result.atMinRate.totalInterestOrProfit} /> –{' '}
                            <Money value={result.atMaxRate.totalInterestOrProfit} />
                          </>
                        ) : (
                          <UnknownValue kind="not-published" />
                        ),
                    },
                    {
                      label: loansCopy.colStatus,
                      value: result.eligible ? loansCopy.statusFits : loansCopy.statusCheck,
                    },
                  ]}
                  islamic={result.product.isIslamic}
                />
              ))}
            </div>
          )}
          <p className="plan-save-row">
            <SaveScenarioButton tool="loan" params={{ amount, months: tenure, type: loanType }} />
          </p>
        </section>
      ) : null}
    </PlanLayout>
  );
};

export default PlanLoanPage;
