import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import Money from './Money';
import ScenarioPanel from './ScenarioPanel';

describe('ScenarioPanel', () => {
  it('renders title, inputs and the live result region', () => {
    render(
      <ScenarioPanel title="EMI calculator" result={<Money value={15250} />}>
        <label>
          Loan amount
          <input type="number" />
        </label>
      </ScenarioPanel>
    );
    expect(screen.getByRole('heading', { name: 'EMI calculator' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loan amount')).toBeInTheDocument();
    expect(screen.getByText('৳15,250')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('links to assumptions and fires reset', async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    render(
      <ScenarioPanel assumptionsHref="/methodology#emi" onReset={onReset} result={<p>Done</p>}>
        <input aria-label="Amount" />
      </ScenarioPanel>
    );
    expect(screen.getByRole('link', { name: 'Assumptions & methodology' })).toHaveAttribute(
      'href',
      '/methodology#emi'
    );
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('omits the result region when no result is given', () => {
    render(
      <ScenarioPanel>
        <input aria-label="Amount" />
      </ScenarioPanel>
    );
    expect(screen.queryByRole('status')).toBeNull();
  });
});
