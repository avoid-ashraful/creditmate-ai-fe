import React, { useState } from 'react';

import CardListItem from '../components/CardListItem';
import { dummyCreditCards } from '../dummy-data/credit-cards';
import '../styles/PerfectCardFinderPage.css';

const lifestyleOptions = [
  { label: 'Travel', value: 'travel' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Savings', value: 'savings' },
  { label: 'Dining', value: 'dining' },
  { label: 'Entertainment', value: 'entertainment' },
];

const PerfectCardFinderPage: React.FC = () => {
  const [income, setIncome] = useState('');
  const [spending, setSpending] = useState('');
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [results, setResults] = useState<typeof dummyCreditCards>([]);

  const handleLifestyleChange = (option: string) => {
    setLifestyle(prev =>
      prev.includes(option) ? prev.filter(l => l !== option) : [...prev, option]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userIncome = parseInt(income);
    const filtered = dummyCreditCards.filter(card => {
      let match = true;

      // Condition 1: annual fee <= 10% of income
      if (income && card.annualFee > userIncome * 0.1) {
        match = false;
      }

      // Condition 2: lifestyle match
      if (match && lifestyle.length > 0) {
        const featuresText =
          (card.additionalFeatures?.join(' ') ?? '') + ' ' + (card.rewardPointsPolicy ?? '');
        const hasLifestyleMatch = lifestyle.some(l =>
          featuresText.toLowerCase().includes(l.toLowerCase())
        );
        if (!hasLifestyleMatch) {
          match = false;
        }
      }

      return match;
    });

    setResults(filtered.slice(0, 3));
  };

  return (
    <div className="perfect-card-finder-page">
      <h1>Perfect Card Finder</h1>
      <form className="finder-form" onSubmit={handleSubmit}>
        <label>
          Annual Income (BDT):
          <input
            type="number"
            value={income}
            onChange={e => setIncome(e.target.value)}
            placeholder="e.g. 600000"
            required
          />
        </label>
        <label>
          Monthly Spending (BDT):
          <input
            type="number"
            value={spending}
            onChange={e => setSpending(e.target.value)}
            placeholder="e.g. 50000"
            required
          />
        </label>
        <fieldset>
          <legend>Lifestyle Preferences:</legend>
          {lifestyleOptions.map(opt => (
            <label key={opt.value}>
              <input
                type="checkbox"
                checked={lifestyle.includes(opt.value)}
                onChange={() => handleLifestyleChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
        <button type="submit">Find My Perfect Card</button>
      </form>

      <div className="finder-results">
        {results.length > 0 && (
          <>
            <h2>Top 3 Recommended Cards</h2>
            <div className="card-list">
              {results.map(card => (
                <CardListItem key={card.id} card={card} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PerfectCardFinderPage;
