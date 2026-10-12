import React, { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { guides, getGuide, SITE_NAME } from '../content/guides';

import '../styles/GuidesPage.css';

/**
 * Task 9.1 - rendered user guides.
 *
 * Routes (registered in App.tsx):
 *   /guides          -> index of all guides
 *   /guides/:slug    -> single guide
 *
 * The page keeps its own SEO metadata in <head> (title, description, canonical,
 * Open Graph, Twitter and JSON-LD) because the app is a client rendered SPA and
 * this repo does not run a prerender step. See the task 9.1 report for what that
 * means for crawlers.
 */

const GUIDES_PATH = '/guides';
const INDEX_TITLE = `Credit card guides and how-tos | ${SITE_NAME}`;
const INDEX_DESCRIPTION =
  'Four short, plain-language guides about credit cards in Bangladesh: how to pick your first card, annual fee waivers, airport lounge access and credit card vs debit card.';

const ensureHeadElement = <T extends HTMLElement>(selector: string, tag: string): T => {
  const existing = document.querySelector<T>(selector);
  if (existing) {
    return existing;
  }
  const created = document.createElement(tag) as T;
  document.head.appendChild(created);
  return created;
};

const setMeta = (attribute: 'name' | 'property', key: string, content: string): void => {
  const selector = `meta[${attribute}="${key}"]`;
  const meta = ensureHeadElement<HTMLMetaElement>(selector, 'meta');
  meta.setAttribute(attribute, key);
  meta.setAttribute('content', content);
};

const setLink = (rel: string, href: string): void => {
  const link = ensureHeadElement<HTMLLinkElement>(`link[rel="${rel}"]`, 'link');
  link.setAttribute('rel', rel);
  link.setAttribute('href', href);
};

const setJsonLd = (id: string, data: unknown): void => {
  const script = ensureHeadElement<HTMLScriptElement>(`script#${id}`, 'script');
  script.setAttribute('id', id);
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(data);
};

const formatDate = (isoDate: string): string =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

const organization = (name: string) => ({
  '@type': 'Organization',
  name,
});

const breadcrumb = (items: { name: string; item: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.item,
  })),
});

const GuidesPage: React.FC = () => {
  const { slug } = useParams();
  const guide = getGuide(slug);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonical = `${origin}${slug ? `${GUIDES_PATH}/${slug}` : GUIDES_PATH}`;

  const isIndex = !slug;
  const notFound = Boolean(slug) && !guide;

  const title = isIndex
    ? INDEX_TITLE
    : guide
    ? `${guide.title} | ${SITE_NAME}`
    : `Guide not found | ${SITE_NAME}`;

  const description = isIndex
    ? INDEX_DESCRIPTION
    : guide
    ? guide.description
    : 'The guide you asked for does not exist. Browse the full list of CreditMate AI user guides instead.';

  const structuredData = useMemo(() => {
    const crumbs = breadcrumb([
      { name: 'Home', item: `${origin}/` },
      { name: 'Guides', item: `${origin}${GUIDES_PATH}` },
      ...(guide ? [{ name: guide.title, item: canonical }] : []),
    ]);

    return {
      primary: guide
        ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: guide.title,
            description: guide.description,
            inLanguage: 'en',
            dateModified: guide.updated,
            articleSection: guide.category,
            author: organization(SITE_NAME),
            publisher: organization(SITE_NAME),
            mainEntityOfPage: canonical,
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: INDEX_TITLE,
            description: INDEX_DESCRIPTION,
            inLanguage: 'en',
            url: canonical,
            author: organization(SITE_NAME),
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: guides.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.title,
                url: `${origin}${GUIDES_PATH}/${item.slug}`,
              })),
            },
          },
      crumbs,
    };
  }, [guide, canonical, origin]);

  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', 'index,follow');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:type', guide ? 'article' : 'website');
    setMeta('property', 'og:locale', 'en_US');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setLink('canonical', canonical);
    setJsonLd('guides-structured-data', structuredData.primary);
    setJsonLd('guides-breadcrumb-data', structuredData.crumbs);
  }, [title, description, canonical, guide, structuredData]);

  if (notFound) {
    return (
      <div className="guides-page guides-not-found">
        <h1>Guide not found</h1>
        <p>That guide address does not exist. Browse the guides we do have.</p>
        <Link className="guides-button" to={GUIDES_PATH}>
          See all guides
        </Link>
      </div>
    );
  }

  if (!isIndex && guide) {
    return (
      <div className="guides-page">
        <article className="guides-article">
          <nav aria-label="Breadcrumb" className="guides-breadcrumb">
            <ol>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to={GUIDES_PATH}>Guides</Link>
              </li>
              <li aria-current="page">{guide.title}</li>
            </ol>
          </nav>

          <header className="guides-article-header">
            <p className="guides-eyebrow">{guide.category}</p>
            <h1>{guide.title}</h1>
            <p className="guides-meta">
              <span>{guide.readingTime}</span>
              <span aria-hidden="true">&middot;</span>
              <time dateTime={guide.updated}>Updated {formatDate(guide.updated)}</time>
            </p>
          </header>

          <p className="guides-lede">{guide.description}</p>

          {guide.sections.map(section => (
            <section key={section.heading} className="guides-section">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${section.heading}-p${paragraphIndex}`}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="guides-list-block">
                  {section.bullets.map(bullet => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.steps && (
                <ol className="guides-list-block">
                  {section.steps.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
              {section.comparison && (
                <div className="guides-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">What you check</th>
                        <th scope="col">Debit card</th>
                        <th scope="col">Credit card</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.comparison.map(row => (
                        <tr key={row.aspect}>
                          <th scope="row">{row.aspect}</th>
                          <td>{row.debit}</td>
                          <td>{row.credit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          <section className="guides-section guides-sources">
            <h2>Sources</h2>
            <p>Every claim in this guide comes from one of these pages.</p>
            <ul className="guides-list-block">
              {guide.sources.map(source => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label}
                  </a>
                  <span className="guides-source-publisher">{source.publisher}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside className="guides-disclaimer">
            <p>{guide.disclaimer}</p>
          </aside>

          <footer className="guides-related">
            <h2>More guides</h2>
            <ul className="guides-list-block">
              {guides
                .filter(item => item.slug !== guide.slug)
                .map(item => (
                  <li key={item.slug}>
                    <Link to={`${GUIDES_PATH}/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
            </ul>
            <Link className="guides-button" to={GUIDES_PATH}>
              All guides
            </Link>
          </footer>
        </article>
      </div>
    );
  }

  return (
    <div className="guides-page">
      <header className="guides-header">
        <p className="guides-eyebrow">Learn</p>
        <h1>Credit card guides and how-tos</h1>
        <p className="guides-lede">
          Four short guides that explain credit cards in plain English. Each guide cites Bangladesh
          Bank rules, or pages that a bank publishes itself.
        </p>
      </header>

      <nav aria-label="User guides" className="guides-index">
        <ul className="guides-grid">
          {guides.map(listed => (
            <li key={listed.slug} className="guides-card">
              <article>
                <p className="guides-eyebrow">{listed.category}</p>
                <h2>
                  <Link to={`${GUIDES_PATH}/${listed.slug}`}>{listed.title}</Link>
                </h2>
                <p>{listed.description}</p>
                <p className="guides-meta">
                  <span>{listed.readingTime}</span>
                  <span aria-hidden="true">&middot;</span>
                  <time dateTime={listed.updated}>Updated {formatDate(listed.updated)}</time>
                </p>
                <Link className="guides-card-link" to={`${GUIDES_PATH}/${listed.slug}`}>
                  Read guide
                  <span className="guides-visually-hidden">: {listed.title}</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </nav>

      <section className="guides-cta">
        <h2>Ready to compare cards?</h2>
        <p>
          Start on the home page. Use the fee waiver and lounge filters there, pick two to four
          cards, then press Compare Cards to see them side by side.
        </p>
        <Link className="guides-button" to="/">
          Browse cards on the home page
        </Link>
      </section>
    </div>
  );
};

export default GuidesPage;
