import React, { useState } from 'react';

import { Switch } from './Switch';

export default {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
};

const Demo = ({ initial, label }: { initial: boolean; label: string }) => {
  const [checked, setChecked] = useState(initial);
  return <Switch checked={checked} onCheckedChange={setChecked} label={label} />;
};

export const Off = () => <Demo initial={false} label="Differences only" />;

export const On = () => <Demo initial label="Email alerts" />;

export const Disabled = () => (
  <Switch checked={false} onCheckedChange={() => {}} label="Unavailable" disabled />
);
