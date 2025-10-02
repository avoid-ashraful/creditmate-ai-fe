import React, { useState } from 'react';
import { FaCommentDots } from 'react-icons/fa';
import '../styles/FaqChatbox.css';
const faqData: { question: string; answer: string }[] = [
  {
    question: 'What is CreditMate AI?',
    answer:
      'CreditMate AI is a platform for comparing credit cards and making informed financial decisions.',
  },
  {
    question: 'How do I compare credit cards?',
    answer:
      'Go to the Compare Cards page, select up to 4 cards, and view their features side-by-side.',
  },
  {
    question: 'Is my data safe?',
    answer: 'We do not collect personal financial data. All comparisons are anonymous.',
  },
  {
    question: 'How are recommendations made?',
    answer: 'Recommendations are based on your input and card features. No bank sponsorships.',
  },
  {
    question: 'Can I save my comparison?',
    answer: 'You can share your comparison using the shareable link feature.',
  },
];

function getFaqAnswer(userQuestion: string): string {
  const lowerQ = userQuestion.toLowerCase();
  for (const faq of faqData) {
    if (lowerQ.includes(faq.question.toLowerCase().slice(0, 10))) {
      return faq.answer;
    }
  }
  return 'Sorry, I could not find an answer. Please try a different question.';
}

const FaqChatbot: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'bot'; text: string }>>([
    { from: 'bot', text: 'Hi! Ask me anything about CreditMate AI or credit cards.' },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text: input }]);
    const answer = getFaqAnswer(input);
    setMessages(prev => [...prev, { from: 'bot', text: answer }]);
    setInput('');
  };

  return (
    <div className="faq-chatbot">
      <div className="chat-header">
        {FaCommentDots({})}
        <strong>AI FAQ Assistant</strong>
        <button onClick={onClose} aria-label="Close chatbot">
          &times;
        </button>
      </div>

      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.from}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your question..."
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default FaqChatbot;
