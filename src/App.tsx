import React, { useState } from 'react';
import { FaGift, FaCommentDots } from 'react-icons/fa';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import FaqChatbot from './components/FaqChatbot';
import Logo from './components/Logo';
import AboutPage from './pages/AboutPage';
import ComparisonPage from './pages/ComparisonPage';
import GlossaryPage from './pages/GlossaryPage';
import HomePage from './pages/HomePage';
import PerfectCardFinderPage from './pages/PerfectCardFinderPage';
import RewardCalculatorPage from './pages/RewardCalculatorPage';
import './styles/FloatingRewardButton.css';
import './styles/FaqChatbotButton.css';
import './styles/App.css';
import { GradientHeader, GradientFooter, GradientBackground } from './styles/StyledComponents';

const App: React.FC = () => {
  const [showRewardCalculator, setShowRewardCalculator] = useState(false);
  const [showFaqChatbot, setShowFaqChatbot] = useState(false);

  return (
    <Router>
      <GradientBackground />
      <div className="app">
        <GradientHeader>
          <div className="header-content">
            <div className="logo">
              <Link to="/">
                <Logo />
              </Link>
            </div>
            <nav className="main-nav">
              <ul>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/compare">Compare Cards</Link>
                </li>
                <li>
                  <Link to="/perfect-finder">Perfect Card Finder</Link>
                </li>
                <li>
                  <Link to="/glossary">Glossary</Link>
                </li>
                <li>
                  <Link to="/about">About</Link>
                </li>
              </ul>
            </nav>
          </div>
        </GradientHeader>

        {/* Floating Reward Calculator Button */}
        <button
          className="floating-reward-btn"
          onClick={() => setShowRewardCalculator(true)}
          aria-label="Open Reward Calculator"
        >
          {FaGift({}) as JSX.Element}
        </button>

        {/* Floating FAQ Chatbot Button */}
        <button
          className="floating-faq-btn"
          onClick={() => setShowFaqChatbot(true)}
          aria-label="Open FAQ Chatbot"
        >
          {FaCommentDots({}) as JSX.Element}
        </button>

        {/* Reward Calculator Modal */}
        {showRewardCalculator && (
          <div className="reward-calculator-modal" onClick={() => setShowRewardCalculator(false)}>
            <div className="reward-calculator-modal-content" onClick={e => e.stopPropagation()}>
              <button
                className="close-button"
                onClick={() => setShowRewardCalculator(false)}
                aria-label="Close Reward Calculator"
              >
                &times;
              </button>
              <RewardCalculatorPage />
            </div>
          </div>
        )}

        {/* FAQ Chatbot Modal */}
        {showFaqChatbot && (
          <div className="faq-chatbot-modal" onClick={() => setShowFaqChatbot(false)}>
            <div onClick={e => e.stopPropagation()}>
              <FaqChatbot onClose={() => setShowFaqChatbot(false)} />
            </div>
          </div>
        )}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route path="/perfect-finder" element={<PerfectCardFinderPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        <GradientFooter>
          <div className="footer-content">
            <div className="footer-section">
              <h3>CreditMate AI</h3>
              <p>Making financial decisions simpler for Bangladeshi consumers.</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/compare">Compare Cards</Link>
                </li>
                <li>
                  <Link to="/glossary">Glossary</Link>
                </li>
                <li>
                  <Link to="/about">About</Link>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Legal</h3>
              <ul>
                <li>
                  <Link to="/terms">Terms of Service</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} CreditMate AI. All rights reserved.</p>
          </div>
        </GradientFooter>
      </div>
    </Router>
  );
};

export default App;
