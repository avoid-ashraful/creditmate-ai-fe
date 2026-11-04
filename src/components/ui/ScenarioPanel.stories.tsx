import React from 'react';

import Money from './Money';
import ScenarioPanel from './ScenarioPanel';

export default {
  title: 'UI/ScenarioPanel',
  component: ScenarioPanel,
  tags: ['autodocs'],
};

/* Dummy EMI scenario — the panel is a shell; wiring/maths live in callers. */
export const EmiScenario = () => {
  const [amount, setAmount] = React.useState(500000);
  const [months, setMonths] = React.useState(36);
  const monthly = Math.round(amount / months);
  return (
    <ScenarioPanel
      title="EMI calculator"
      assumptionsHref="/methodology#emi"
      onReset={() => {
        setAmount(500000);
        setMonths(36);
      }}
      result={
        <p>
          Monthly payment <Money value={monthly} /> over {months} months (illustrative, no
          interest).
        </p>
      }
    >
      <label>
        Loan amount (৳)
        <input
          type="number"
          value={amount}
          onChange={event => setAmount(Number(event.target.value))}
        />
      </label>
      <label>
        Tenure (months)
        <input
          type="number"
          value={months}
          onChange={event => setMonths(Number(event.target.value))}
        />
      </label>
    </ScenarioPanel>
  );
};

export const InputsOnly = () => (
  <ScenarioPanel title="Your situation">
    <label>
      Monthly income (৳)
      <input type="number" placeholder="60,000" />
    </label>
  </ScenarioPanel>
);
