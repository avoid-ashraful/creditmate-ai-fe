import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About CreditMate AI</h1>
        <p>The most trusted credit card comparison platform in Bangladesh</p>
      </div>

      <section className="mission-section">
        <div className="content-container">
          <h2>Our Mission</h2>
          <p>
            CreditMate AI aims to simplify financial decision-making for Bangladeshi consumers by
            providing clear, unbiased, and easily comparable credit card information. Our platform
            aggregates, standardizes, and presents complex financial data in a user-friendly format,
            supporting informed decisions aligned with users&apos; unique financial goals and
            lifestyles.
          </p>
        </div>
      </section>

      <section className="problem-section">
        <div className="content-container">
          <h2>The Problem We&apos;re Solving</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <h3>Information Fragmentation</h3>
              <p>
                Users struggle to access consistent and clear credit card information due to
                scattered data across numerous bank websites.
              </p>
            </div>
            <div className="problem-card">
              <h3>Complex Documentation</h3>
              <p>
                Key information like fees and interest rates is buried in lengthy,
                difficult-to-interpret PDF documents.
              </p>
            </div>
            <div className="problem-card">
              <h3>Transparency Issues</h3>
              <p>
                Hidden terms, ambiguous reward policies, and unclear eligibility criteria make it
                challenging to assess true card value.
              </p>
            </div>
            <div className="problem-card">
              <h3>Decision Fatigue</h3>
              <p>
                Lack of comparative tools leads to confusion, causing suboptimal decisions based on
                promotional material rather than factual comparisons.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="solution-section">
        <div className="content-container">
          <h2>Our Solution</h2>
          <p>
            CreditMate AI offers a comprehensive platform with standardized comparisons, intuitive
            search functionality, and educational resources to help users make informed financial
            decisions. We maintain transparency through clear presentation of information and
            don&apos;t promote specific cards without clear indication.
          </p>

          <div className="feature-list">
            <div className="feature">
              <h3>Data Aggregation</h3>
              <p>
                Centralized repository containing up-to-date credit card information from all major
                Bangladeshi banks
              </p>
            </div>
            <div className="feature">
              <h3>Standardized Comparisons</h3>
              <p>
                Clear, consistent formats to easily compare critical information such as fees,
                rewards, and lounge access
              </p>
            </div>
            <div className="feature">
              <h3>Intuitive Search & Filters</h3>
              <p>
                User-friendly search functionality and filters enabling quick identification of
                suitable credit cards
              </p>
            </div>
            <div className="feature">
              <h3>Educational Content</h3>
              <p>
                Informative articles and guides covering financial literacy topics to help users
                understand credit cards better
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="team-section">
        <div className="content-container">
          <h2>Our Team</h2>
          <p className="team-intro">
            CreditMate AI was founded by a team of financial experts and technology enthusiasts
            committed to bringing transparency to the Bangladeshi financial market.
          </p>

          <div className="team-members">
            <div className="team-member">
              <div className="member-photo placeholder"></div>
              <h3>Jane Doe</h3>
              <p>Founder & CEO</p>
              <p className="member-bio">
                Former banking executive with 15 years of experience in the financial sector.
              </p>
            </div>
            <div className="team-member">
              <div className="member-photo placeholder"></div>
              <h3>John Smith</h3>
              <p>Chief Technology Officer</p>
              <p className="member-bio">
                Tech entrepreneur with expertise in fintech solutions and data analytics.
              </p>
            </div>
            <div className="team-member">
              <div className="member-photo placeholder"></div>
              <h3>Sarah Rahman</h3>
              <p>Head of Content</p>
              <p className="member-bio">
                Financial educator with a passion for simplifying complex financial concepts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="content-container">
          <h2>Contact Us</h2>
          <p>Have questions or suggestions? We&apos;d love to hear from you!</p>
          <div className="contact-info">
            <div className="contact-item">
              <h3>Email</h3>
              <p>info@creditmate.ai</p>
            </div>
            <div className="contact-item">
              <h3>Address</h3>
              <p>123 Financial Street, Dhaka, Bangladesh</p>
            </div>
          </div>
          <div className="cta-buttons">
            <Link to="/" className="primary-button">
              Start Comparing Cards
            </Link>
            <Link to="/glossary" className="secondary-button">
              Explore Our Glossary
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
