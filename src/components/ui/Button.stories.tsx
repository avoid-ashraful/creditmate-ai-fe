import React from 'react';

import { Button } from './Button';

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export const Primary = {
  args: { children: 'Save changes', variant: 'primary' },
};

export const Ghost = {
  args: { children: 'Cancel', variant: 'ghost' },
};

export const Danger = {
  args: { children: 'Delete card', variant: 'danger' },
};

export const Small = {
  args: { children: 'Compare', variant: 'primary', size: 'sm' },
};

export const Loading = {
  args: { children: 'Saving…', variant: 'primary', loading: true },
};

export const Disabled = {
  args: { children: 'Unavailable', variant: 'primary', disabled: true },
};

export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="primary">Primary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="primary" size="sm">
      Small primary
    </Button>
    <Button variant="primary" loading>
      Loading
    </Button>
  </div>
);
