import React from 'react';

import Money from './Money';
import ResultCard from './ResultCard';
import TrustChip from './TrustChip';
import UnknownValue from './UnknownValue';

export default {
  title: 'UI/ResultCard',
  component: ResultCard,
  tags: ['autodocs'],
};

/* Credit card result: hero is the annual cost outcome. */
export const CreditCard = () => {
  const [shortlisted, setShortlisted] = React.useState(false);
  return (
    <ResultCard
      bankName="Dutch-Bangla Bank"
      productName="Nexus Platinum Card"
      detailHref="/credit-cards/dbbl-nexus-platinum"
      heroValue={<Money value={3450} />}
      heroLabel="Estimated annual cost"
      supportingFacts={[
        { label: 'APR', value: '20%' },
        { label: 'Annual fee', value: <Money value={3000} /> },
        { label: 'Lounge visits', value: '4 / year' },
      ]}
      trustChip={<TrustChip source="Bank schedule of charges" dateLabel="verified 3 Nov" />}
      inShortlist={shortlisted}
      onToggleShortlist={() => setShortlisted(value => !value)}
    >
      <p>Grace period 45 days. Fee waived on 18 transactions a year.</p>
    </ResultCard>
  );
};

/* Deposit result: hero is the maturity value, provenance from the BB chart. */
export const Deposit = () => (
  <ResultCard
    bankName="BRAC Bank"
    productName="1-year Fixed Deposit"
    detailHref="/deposits/brac-fdr-1y"
    heroValue={<Money value={112500} />}
    heroLabel="Maturity value on ৳1,00,000 after tax"
    supportingFacts={[
      { label: 'Rate', value: '12.50%' },
      { label: 'Tenure', value: '1 year' },
      { label: 'Early encashment', value: <UnknownValue kind="not-published" /> },
    ]}
    trustChip={<TrustChip source="BB chart" dateLabel="Oct 2026 edition" />}
  />
);

/* Islamic product: expected profit, never interest. */
export const IslamicDeposit = () => (
  <ResultCard
    bankName="Pubali Bank (Islamic Banking)"
    productName="Al-Wadiah Term Deposit"
    detailHref="/deposits/pubali-al-wadiah-1y"
    heroValue={<Money value={110800} />}
    heroLabel="Expected maturity value on ৳1,00,000 after tax"
    supportingFacts={[
      { label: 'Expected profit rate', value: '10.80%' },
      { label: 'Tenure', value: '1 year' },
    ]}
    islamic
    trustChip={<TrustChip source="Bank page" dateLabel="verified 28 Oct" marker="derived" />}
  />
);
