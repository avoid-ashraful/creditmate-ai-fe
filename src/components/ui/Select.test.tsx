import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Select } from './Select';

const options = (
  <>
    <option value="">Choose</option>
    <option value="a">Option A</option>
    <option value="b">Option B</option>
  </>
);

describe('Select', () => {
  it('associates the label and reports selection changes', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <Select label="Bank" onChange={onChange}>
        {options}
      </Select>
    );
    const select = screen.getByLabelText('Bank');
    await user.selectOptions(select, 'b');
    expect(select).toHaveValue('b');
    expect(onChange).toHaveBeenCalled();
  });

  it('marks the select invalid and describes the error', () => {
    render(
      <Select label="Bank" error="Required" id="bank">
        {options}
      </Select>
    );
    const select = screen.getByLabelText('Bank');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select.getAttribute('aria-describedby')).toContain('bank-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});
