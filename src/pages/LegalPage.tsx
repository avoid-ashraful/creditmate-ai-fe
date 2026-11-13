import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import ScoreScaleRuler from '../components/ScoreScaleRuler';
import { CONTACT_EMAIL } from '../config/site';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { fillCopy, useLanguage } from '../locales';
import { getLegalCopy, LEGAL_PAGE_PATHS, type LegalPageKey } from '../locales/legal';
import '../styles/LegalPage.css';

const pageKeyForPath = (pathname: string): LegalPageKey | null => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const entry = (Object.entries(LEGAL_PAGE_PATHS) as [LegalPageKey, string][]).find(
    ([, path]) => path === normalized
  );
  return entry ? entry[0] : null;
};

const slugify = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';

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

  // Docs-style scrollspy (Phase 4) — methodology only: a sticky contents
  // list whose active entry tracks the section in view. Other legal
  // pages stay single-column documents.
  const isMethodology = key === 'methodology';
  const [activeSection, setActiveSection] = useState<string | null>(null);
  useEffect(() => {
    if (!isMethodology || typeof IntersectionObserver === 'undefined') return;
    const headings = Array.from(document.querySelectorAll<HTMLElement>('.legal-section[id]'));
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    headings.forEach(heading => observer.observe(heading));
    return () => observer.disconnect();
  }, [isMethodology, pathname, lang]);

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
      {isMethodology ? (
        <nav className="legal-toc" aria-label={page.title}>
          <ul>
            {page.sections.map(section => {
              const id = `methodology-${slugify(section.heading)}`;
              return (
                <li key={section.heading}>
                  <a
                    href={`#${id}`}
                    aria-current={activeSection === id ? 'true' : undefined}
                    className={activeSection === id ? 'is-active' : undefined}
                  >
                    {section.heading}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
      {page.sections.map(section => (
        <section
          key={section.heading}
          className="legal-section"
          id={isMethodology ? `methodology-${slugify(section.heading)}` : undefined}
        >
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
          {/* Plan V2 P4: the score section carries the 0–10 ledger
              ruler. Both locales name this section after CreditMate
              (and no other methodology section does). */}
          {isMethodology && section.heading.includes('CreditMate') && <ScoreScaleRuler />}
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
