import React from 'react';

import { Radio } from './Radio';

export default {
  title: 'UI/Radio',
  component: Radio,
  tags: ['autodocs'],
};

export const Group = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <Radio name="employment" value="salaried" label="Salaried" defaultChecked />
    <Radio name="employment" value="self" label="Self-employed" />
    <Radio name="employment" value="business" label="Business owner" />
  </div>
);

export const Disabled = {
  args: { name: 'employment', label: 'Student', disabled: true },
};
