import React from 'react';
import { Link } from 'react-router-dom';

import { useSeoMeta } from '../hooks/useSeoMeta';
import { useLanguage } from '../locales';
import { getLegalCopy, LEGAL_PAGE_PATHS } from '../locales/legal';
import '../styles/LegalPage.css';

/** Catch-all 404 page with links to the places people most likely wanted. */
const NotFoundPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getLegalCopy(lang).notFound;
  useSeoMeta({ title: `${copy.title} | CreditMate AI`, description: copy.description });

  return (
    <div className="legal-page not-found-page" lang={lang}>
      <h1>{copy.title}</h1>
      <p className="legal-lede">{copy.description}</p>
      <h2>{copy.suggestionsHeading}</h2>
      <ul>
        <li>
          <Link to="/">{copy.homeLink}</Link>
        </li>
        <li>
          <Link to="/search">{copy.searchLink}</Link>
        </li>
        <li>
          <Link to="/compare">{copy.compareLink}</Link>
        </li>
        <li>
          <Link to="/guides">{copy.guidesLink}</Link>
        </li>
        <li>
          <Link to={LEGAL_PAGE_PATHS.contact}>{copy.contactLink}</Link>
        </li>
      </ul>
    </div>
  );
};

export default NotFoundPage;
