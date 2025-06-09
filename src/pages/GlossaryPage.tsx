import React, { useState } from 'react';
import '../styles/GlossaryPage.css';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

const GlossaryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Dummy glossary data
  const glossaryTerms: GlossaryTerm[] = [
    {
      term: 'Annual Fee',
      definition:
        'A yearly charge for having a credit card, typically billed on your card anniversary date. Some cards waive this fee if you meet certain spending requirements.',
      category: 'fees',
    },
    {
      term: 'APR (Annual Percentage Rate)',
      definition:
        'The yearly interest rate charged on outstanding credit card balances. This rate is applied when you carry a balance from month to month.',
      category: 'interest',
    },
    {
      term: 'Cash Advance',
      definition:
        'Using your credit card to withdraw cash from an ATM or bank. This usually incurs higher interest rates and begins accruing interest immediately without a grace period.',
      category: 'transactions',
    },
    {
      term: 'Credit Limit',
      definition:
        'The maximum amount you can borrow on your credit card, as set by the issuing bank based on your creditworthiness and income.',
      category: 'basics',
    },
    {
      term: 'Grace Period',
      definition:
        'The time between the end of a billing cycle and the payment due date, during which you can pay your balance in full without incurring interest charges.',
      category: 'interest',
    },
    {
      term: 'Late Payment Fee',
      definition:
        'A penalty charged when you fail to make at least the minimum payment by the due date specified on your monthly statement.',
      category: 'fees',
    },
    {
      term: 'Minimum Payment',
      definition:
        'The smallest amount you must pay by the due date to keep your account in good standing and avoid late fees.',
      category: 'basics',
    },
    {
      term: 'Rewards Points',
      definition:
        'Points earned based on credit card spending that can be redeemed for various benefits such as cashback, travel, merchandise, or gift cards.',
      category: 'rewards',
    },
    {
      term: 'Balance Transfer',
      definition:
        'Moving debt from one credit card to another, often to take advantage of a lower interest rate or promotional period.',
      category: 'transactions',
    },
    {
      term: 'Credit Utilization Ratio',
      definition:
        "The percentage of your available credit that you're currently using. A lower ratio is generally better for your credit score.",
      category: 'basics',
    },
    {
      term: 'Foreign Transaction Fee',
      definition:
        'A fee charged for purchases made in foreign currencies or processed through foreign banks, typically 2-3% of the transaction amount.',
      category: 'fees',
    },
    {
      term: 'Introductory APR',
      definition:
        'A promotional interest rate offered for a limited time when you first open a credit card account, often lower than the standard rate.',
      category: 'interest',
    },
    {
      term: 'Over-limit Fee',
      definition:
        'A charge applied when you exceed your credit limit. Many banks now require you to opt in to allow transactions that would put you over your limit.',
      category: 'fees',
    },
    {
      term: 'Statement Cycle',
      definition:
        'The period of time between billing statements, typically about 30 days, during which transactions are recorded for your monthly bill.',
      category: 'basics',
    },
    {
      term: 'Cashback',
      definition:
        'A type of credit card reward where you receive a percentage of your purchases back as cash, statement credit, or direct deposit.',
      category: 'rewards',
    },
  ];

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Terms' },
    { id: 'basics', name: 'Credit Card Basics' },
    { id: 'fees', name: 'Fees & Charges' },
    { id: 'interest', name: 'Interest & APR' },
    { id: 'rewards', name: 'Rewards & Benefits' },
    { id: 'transactions', name: 'Transactions' },
  ];

  // Filter terms based on search and category
  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || term.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort terms alphabetically
  const sortedTerms = [...filteredTerms].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h1>Financial Terms Glossary</h1>
        <p>Understanding the key terminology used in credit card offers and financial products</p>
      </div>

      <div className="glossary-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search for terms..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="glossary-content">
        {sortedTerms.length === 0 ? (
          <div className="no-results">
            <p>
              No terms match your search criteria. Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="terms-list">
            {sortedTerms.map((item, index) => (
              <div key={index} className="glossary-item">
                <h3 className="term">{item.term}</h3>
                <p className="definition">{item.definition}</p>
                <span className="category-tag">
                  {categories.find(cat => cat.id === item.category)?.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlossaryPage;
