import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Radio } from './Radio';

describe('Radio', () => {
  it('selects within a named group', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Radio name="employment" value="salaried" label="Salaried" />
        <Radio name="employment" value="self" label="Self-employed" />
      </>
    );
    const salaried = screen.getByRole('radio', { name: 'Salaried' });
    const self = screen.getByRole('radio', { name: 'Self-employed' });
    await user.click(salaried);
    expect(salaried).toBeChecked();
    await user.click(self);
    expect(self).toBeChecked();
    expect(salaried).not.toBeChecked();
  });
});
