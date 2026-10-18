import React, { useId } from 'react';
import { Link } from 'react-router-dom';

import { Language, useLanguage } from '../locales';

import '../styles/RelatedContent.css';

export interface RelatedLink {
  to: string;
  label: string;
  description?: string;
  lang?: Language;
}

interface RelatedContentProps {
  heading: string;
  links: RelatedLink[];
}

/**
 * Internal links between guides, categories and other pages (task 10.4).
 * Renders nothing when there are no links, so callers need no empty check.
 */
const RelatedContent: React.FC<RelatedContentProps> = ({ heading, links }) => {
  const headingId = useId();
  const { lang } = useLanguage();

  if (links.length === 0) {
    return null;
  }

  return (
    <section lang={lang} className="related-content" aria-labelledby={headingId}>
      <h2 id={headingId} className="related-content-heading">
        {heading}
      </h2>
      <ul className="related-content-list">
        {links.map(link => (
          <li key={link.to} className="related-content-item">
            <Link lang={link.lang ?? lang} to={link.to}>
              {link.label}
            </Link>
            {link.description && <p className="related-content-description">{link.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RelatedContent;
