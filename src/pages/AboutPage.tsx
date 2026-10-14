import React from 'react';
import { Link } from 'react-router-dom';

import '../styles/AboutPage.css';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { useLanguage, getCommonCopy } from '../locales';

const AboutPage: React.FC = () => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  useSeoMeta({
    title: common.aboutTitle,
    description: common.aboutSubtitle,
    canonicalPath: '/about',
  });

  return (
    <div className="about-page">
      <div className="about-header">
        <h1>{common.aboutTitle}</h1>
        <p>{common.aboutSubtitle}</p>
      </div>

      <section className="mission-section">
        <div className="content-container">
          <h2>{common.missionTitle}</h2>
          <p>{common.missionDescription}</p>
        </div>
      </section>

      <section className="problem-section">
        <div className="content-container">
          <h2>{common.problemTitle}</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <h3>{common.problemInfoFragmentationTitle}</h3>
              <p>{common.problemInfoFragmentationDesc}</p>
            </div>
            <div className="problem-card">
              <h3>{common.problemComplexDocsTitle}</h3>
              <p>{common.problemComplexDocsDesc}</p>
            </div>
            <div className="problem-card">
              <h3>{common.problemTransparencyTitle}</h3>
              <p>{common.problemTransparencyDesc}</p>
            </div>
            <div className="problem-card">
              <h3>{common.problemDecisionFatigueTitle}</h3>
              <p>{common.problemDecisionFatigueDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="solution-section">
        <div className="content-container">
          <h2>{common.solutionTitle}</h2>
          <p>{common.solutionDescription}</p>

          <div className="feature-list">
            <div className="feature">
              <h3>{common.solutionDataAggregationTitle}</h3>
              <p>{common.solutionDataAggregationDesc}</p>
            </div>
            <div className="feature">
              <h3>{common.solutionStandardizedComparisonsTitle}</h3>
              <p>{common.solutionStandardizedComparisonsDesc}</p>
            </div>
            <div className="feature">
              <h3>{common.solutionIntuitiveSearchTitle}</h3>
              <p>{common.solutionIntuitiveSearchDesc}</p>
            </div>
            <div className="feature">
              <h3>{common.solutionEducationalContentTitle}</h3>
              <p>{common.solutionEducationalContentDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="team-section">
        <div className="content-container">
          <h2>{common.teamTitle}</h2>
          <p className="team-intro">{common.teamIntro}</p>

          <div className="team-members">
            <div className="team-member">
              <div className="member-photo placeholder"></div>
              <h3>{common.teamMember1Name}</h3>
              <p>{common.teamMember1Role}</p>
              <p className="member-bio">{common.teamMember1Bio}</p>
            </div>
            <div className="team-member">
              <div className="member-photo placeholder"></div>
              <h3>{common.teamMember2Name}</h3>
              <p>{common.teamMember2Role}</p>
              <p className="member-bio">{common.teamMember2Bio}</p>
            </div>
            <div className="team-member">
              <div className="member-photo placeholder"></div>
              <h3>{common.teamMember3Name}</h3>
              <p>{common.teamMember3Role}</p>
              <p className="member-bio">{common.teamMember3Bio}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="content-container">
          <h2>{common.contactTitle}</h2>
          <p>{common.contactDescription}</p>
          <div className="contact-info">
            <div className="contact-item">
              <h3>{common.contactEmailLabel}</h3>
              <p>{common.contactEmailValue}</p>
            </div>
            <div className="contact-item">
              <h3>{common.contactAddressLabel}</h3>
              <p>{common.contactAddressValue}</p>
            </div>
          </div>
          <div className="cta-buttons">
            <Link to="/" className="primary-button">
              {common.contactStartComparing}
            </Link>
            <Link to="/glossary" className="secondary-button">
              {common.contactExploreGlossary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
