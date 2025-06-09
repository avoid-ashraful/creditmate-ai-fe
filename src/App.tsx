import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import AboutPage from './pages/AboutPage';
import ComparisonPage from './pages/ComparisonPage';
import GlossaryPage from './pages/GlossaryPage';
import HomePage from './pages/HomePage';
import './styles/App.css';
import { GradientHeader, GradientFooter, GradientBackground } from './styles/StyledComponents';

const App: React.FC = () => {
  return (
    <Router>
      <GradientBackground />
      <div className="app">
        <GradientHeader>
          <div className="header-content">
            <div className="logo">
              <Link to="/">CreditMate AI</Link>
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
                  <Link to="/glossary">Glossary</Link>
                </li>
                <li>
                  <Link to="/about">About</Link>
                </li>
              </ul>
            </nav>
          </div>
        </GradientHeader>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparisonPage />} />
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
