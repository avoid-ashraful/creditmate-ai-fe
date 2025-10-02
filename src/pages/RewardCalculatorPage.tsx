import { useState } from 'react';

import CardListItem from '../components/CardListItem';
import { dummyCreditCards } from '../dummy-data/credit-cards';
import '../styles/RewardCalculatorPage.css';

const RewardCalculatorPage: React.FC = () => {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [monthlySpend, setMonthlySpend] = useState('');
  const [result, setResult] = useState<string>('');

  const handleCalculate = () => {
    const card = dummyCreditCards.find(c => c.id === selectedCardId);
    if (!card || !monthlySpend) {
      setResult('');
      return;
    }
    // Simple reward points extraction (example logic)
    const pointsMatch = card.rewardPointsPolicy.match(/(\d+) point[s]? for every BDT (\d+)/i);
    if (pointsMatch) {
      const pointsPer = parseInt(pointsMatch[1]);
      const bdtPer = parseInt(pointsMatch[2]);
      const totalPoints = Math.floor((parseInt(monthlySpend) / bdtPer) * pointsPer);
      setResult(`Estimated reward points: ${totalPoints}`);
    } else {
      setResult('Reward calculation not available for this card.');
    }
  };

  return (
    <div className="reward-calculator-page">
      <h1>Reward Calculator</h1>
      <div className="calculator-form">
        <label>
          Select a Credit Card:
          <select
            value={selectedCardId ?? ''}
            onChange={e => setSelectedCardId(Number(e.target.value))}
          >
            <option value="">-- Select Card --</option>
            {dummyCreditCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Monthly Spend (BDT):
          <input
            type="number"
            value={monthlySpend}
            onChange={e => setMonthlySpend(e.target.value)}
            placeholder="e.g. 50000"
            required
          />
        </label>
        <button type="button" onClick={handleCalculate}>
          Calculate Rewards
        </button>
      </div>
      <div className="calculator-result">
        {result && <p>{result}</p>}
        {selectedCardId &&
          (() => {
            const card = dummyCreditCards.find(c => c.id === selectedCardId);
            if (!card) return null;
            return (
              <div style={{ marginTop: '32px' }}>
                <CardListItem card={card} />
              </div>
            );
          })()}
      </div>
    </div>
  );
};

export default RewardCalculatorPage;
