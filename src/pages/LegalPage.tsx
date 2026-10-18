import React from 'react';
import { useLocation } from 'react-router-dom';

import { CONTACT_EMAIL } from '../config/site';
import { useSeoMeta } from '../hooks/useSeoMeta';
import {
  fillCopy,
  getLegalCopy,
  LEGAL_PAGE_PATHS,
  useLanguage,
  type LegalPageKey,
} from '../locales';
import '../styles/LegalPage.css';

const pageKeyForPath = (pathname: string): LegalPageKey | null => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const entry = (Object.entries(LEGAL_PAGE_PATHS) as [LegalPageKey, string][]).find(
    ([, path]) => path === normalized
  );
  return entry ? entry[0] : null;
};

/**
 * One component for all legal and trust pages. The page shown is chosen from the
 * route path, so each route can lazy-load the same chunk.
 */
const LegalPage: React.FC = () => {
  const { lang } = useLanguage();
  const { pathname } = useLocation();
  const copy = getLegalCopy(lang);
  const key = pageKeyForPath(pathname);
  const page = key ? copy.pages[key] : null;

  useSeoMeta(
    key && page
      ? {
          title: `${page.title} | CreditMate AI`,
          description: page.description,
          canonicalPath: LEGAL_PAGE_PATHS[key],
        }
      : null
  );

  if (!key || !page) return null;
  const withEmail = (text: string) => fillCopy(text, { email: CONTACT_EMAIL });

  return (
    <article className="legal-page" lang={lang}>
      <p className="legal-draft-banner" role="note">
        {copy.draftBanner}
      </p>
      <h1>{page.title}</h1>
      <p className="legal-lede">{page.description}</p>
      {page.sections.map(section => (
        <section key={section.heading} className="legal-section">
          <h2>{section.heading}</h2>
          {section.paragraphs?.map(paragraph => (
            <p key={paragraph}>{withEmail(paragraph)}</p>
          ))}
          {section.bullets && (
            <ul>
              {section.bullets.map(bullet => (
                <li key={bullet}>{withEmail(bullet)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {key === 'contact' && (
        <p className="legal-contact">
          {copy.contactEmailLabel}: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}
    </article>
  );
};

export default LegalPage;
