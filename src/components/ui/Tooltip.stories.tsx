import React from 'react';

import Tooltip from './Tooltip';

export default {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};

export const OnButton = () => (
  <p>
    <Tooltip content="Bangladesh Bank publishes this rate chart monthly">
      <button type="button">Where does this rate come from?</button>
    </Tooltip>
  </p>
);

export const OnText = () => (
  <p>
    The CreditMate Score weighs{' '}
    <Tooltip content="Annual fee, supplementary fees and renewal charges">
      <span tabIndex={0}>total annual cost</span>
    </Tooltip>{' '}
    most heavily.
  </p>
);
