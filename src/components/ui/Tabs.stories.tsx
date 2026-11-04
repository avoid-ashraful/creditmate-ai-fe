import React from 'react';

import Tabs from './Tabs';

export default {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

const sampleTabs = [
  { id: 'fees', label: 'Fees', content: <p>Annual fee, joining fee and renewal fee details.</p> },
  { id: 'rates', label: 'Rates', content: <p>APR, grace period and late-payment charges.</p> },
  { id: 'rewards', label: 'Rewards', content: <p>Points, cashback and lounge access.</p> },
  {
    id: 'terms',
    label: 'Terms',
    content: <p>Full terms from the bank schedule of charges.</p>,
    disabled: true,
  },
];

export const Default = () => <Tabs ariaLabel="Card details" tabs={sampleTabs} />;

export const SecondTabByDefault = () => (
  <Tabs ariaLabel="Card details" tabs={sampleTabs} defaultTabId="rates" />
);

export const Controlled = () => {
  const [active, setActive] = React.useState('fees');
  return (
    <>
      <Tabs ariaLabel="Card details" tabs={sampleTabs} activeTabId={active} onChange={setActive} />
      <p>Active tab: {active}</p>
    </>
  );
};
