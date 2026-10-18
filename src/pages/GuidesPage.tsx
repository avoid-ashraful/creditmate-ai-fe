import React, { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import RelatedContent from '../components/RelatedContent';
import { getCategoriesForGuide } from '../config/categories';
import { guides, getGuide, SITE_NAME } from '../content/guides';
import { useLanguage, getCommonCopy, getCategoryText } from '../locales';
import { breadcrumbJsonLd, faqPageJsonLd } from '../utils/structuredData';

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
 * means for crawlers. Because the other routes (Home included) do not touch
 * <head>, the metadata effect snapshots the previous values and restores them
 * on unmount, removing only the tags this page created (see applyHeadWrites).
 */

const GUIDES_PATH = '/guides';

/** Render the editorial [label](guide-slug) syntax as real app navigation links. */
const renderGuideParagraph = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    const [, label, slug] = match;
    parts.push(
      <Link key={`${slug}-${match.index}`} to={`${GUIDES_PATH}/${slug}`}>
        {label}
      </Link>
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};
const INDEX_TITLE = `Credit card guides and how-tos | ${SITE_NAME}`;
const INDEX_DESCRIPTION =
  'Plain-language guides about choosing, comparing and using credit cards in Bangladesh, including fees, interest rates and benefits.';

const ensureHeadElement = <T extends HTMLElement>(selector: string, tag: string): T => {
  const existing = document.querySelector<T>(selector);
  if (existing) {
    return existing;
  }
  const created = document.createElement(tag) as T;
  document.head.appendChild(created);
  return created;
};

/**
 * Metadata lifecycle (task 9.1 follow-up).
 *
 * The guides routes own shared <head> state (title, meta tags, canonical link,
 * JSON-LD), but the other pages - including Home - do not touch <head> at all.
 * Without a rollback, a guide's canonical URL, og:url and Article JSON-LD would
 * keep describing the Home page to crawlers after navigating away.
 *
 * `applyHeadWrites` snapshots `document.title` plus the prior node behind every
 * selector it is about to write, applies the writes, and returns the cleanup
 * React runs on unmount or before the next write:
 *   - a tag that existed before is restored in place (attributes and text), and
 *   - a tag that this helper created (absent from the snapshot) is removed.
 * Tags outside the snapshot - anything the page never wrote - are left alone.
 */
type HeadWrite = {
  /** Unique selector, so the snapshot can tell "pre-existing" from "created". */
  selector: string;
  tag: 'meta' | 'link' | 'script';
  attributes: Record<string, string>;
  /** Text content for JSON-LD scripts. */
  text?: string;
};

type HeadSnapshotEntry = {
  node: HTMLElement;
  /** True when no node matched the selector before this page wrote it. */
  created: boolean;
  attributes: [string, string][];
  text: string | null;
};

const applyHeadWrites = (title: string, writes: HeadWrite[]): (() => void) => {
  const priorTitle = document.title;
  const snapshot = new Map<string, HeadSnapshotEntry>();

  writes.forEach(({ selector, tag, attributes, text }) => {
    let entry = snapshot.get(selector);
    if (!entry) {
      const existing = document.querySelector<HTMLElement>(selector);
      entry = {
        node: existing ?? ensureHeadElement<HTMLElement>(selector, tag),
        created: existing === null,
        attributes: existing
          ? Array.from(existing.attributes).map(attr => [attr.name, attr.value] as [string, string])
          : [],
        text: existing ? existing.textContent : null,
      };
      snapshot.set(selector, entry);
    }
    const target = entry.node;
    Object.entries(attributes).forEach(([name, value]) => target.setAttribute(name, value));
    if (typeof text === 'string') {
      target.textContent = text;
    }
  });

  document.title = title;

  return () => {
    document.title = priorTitle;
    snapshot.forEach(({ node, created, attributes, text }) => {
      if (created) {
        // The snapshot proves no tag matched this selector before we wrote it,
        // so this node is ours to remove.
        node.remove();
        return;
      }
      // Restore the pre-existing tag in place; re-attach it if something in
      // between detached it, then put its attributes and text back.
      if (!node.isConnected) {
        document.head.appendChild(node);
      }
      const priorNames = new Set(attributes.map(([name]) => name));
      Array.from(node.attributes).forEach(attr => {
        if (!priorNames.has(attr.name)) {
          node.removeAttribute(attr.name);
        }
      });
      attributes.forEach(([name, value]) => node.setAttribute(name, value));
      node.textContent = text;
    });
  };
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

const GuidesPage: React.FC = () => {
  const { slug } = useParams();
  const guide = getGuide(slug);
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonical = `${origin}${slug ? `${GUIDES_PATH}/${slug}` : GUIDES_PATH}`;

  const isIndex = !slug;
  const notFound = Boolean(slug) && !guide;

  const title = isIndex
    ? INDEX_TITLE
    : guide
    ? `${guide.title} | ${SITE_NAME}`
    : `${common.guidesNotFoundTitle} | ${SITE_NAME}`;

  const description = isIndex
    ? INDEX_DESCRIPTION
    : guide
    ? guide.description
    : 'The guide you asked for does not exist. Browse the full list of CreditMate AI user guides instead.';

  const structuredData = useMemo(() => {
    const crumbs = breadcrumbJsonLd(origin, [
      { name: 'Home', path: '/' },
      { name: 'Guides', path: GUIDES_PATH },
      ...(guide ? [{ name: guide.title, path: `${GUIDES_PATH}/${guide.slug}` }] : []),
    ]);

    return {
      faq: guide ? faqPageJsonLd(guide.faqs) : null,
      primary: guide
        ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: guide.title,
            description: guide.description,
            inLanguage: lang,
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
            inLanguage: lang,
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
  }, [guide, canonical, origin, lang]);

  useEffect(() => {
    const writes: HeadWrite[] = [
      {
        selector: 'meta[name="description"]',
        tag: 'meta',
        attributes: { name: 'description', content: description },
      },
      {
        selector: 'meta[name="robots"]',
        tag: 'meta',
        attributes: { name: 'robots', content: 'index,follow' },
      },
      {
        selector: 'meta[property="og:site_name"]',
        tag: 'meta',
        attributes: { property: 'og:site_name', content: SITE_NAME },
      },
      {
        selector: 'meta[property="og:type"]',
        tag: 'meta',
        attributes: { property: 'og:type', content: guide ? 'article' : 'website' },
      },
      {
        selector: 'meta[property="og:locale"]',
        tag: 'meta',
        attributes: { property: 'og:locale', content: lang === 'bn' ? 'bn_BD' : 'en_US' },
      },
      {
        selector: 'meta[property="og:title"]',
        tag: 'meta',
        attributes: { property: 'og:title', content: title },
      },
      {
        selector: 'meta[property="og:description"]',
        tag: 'meta',
        attributes: { property: 'og:description', content: description },
      },
      {
        selector: 'meta[property="og:url"]',
        tag: 'meta',
        attributes: { property: 'og:url', content: canonical },
      },
      {
        selector: 'meta[name="twitter:card"]',
        tag: 'meta',
        attributes: { name: 'twitter:card', content: 'summary' },
      },
      {
        selector: 'meta[name="twitter:title"]',
        tag: 'meta',
        attributes: { name: 'twitter:title', content: title },
      },
      {
        selector: 'meta[name="twitter:description"]',
        tag: 'meta',
        attributes: { name: 'twitter:description', content: description },
      },
      {
        selector: 'link[rel="canonical"]',
        tag: 'link',
        attributes: { rel: 'canonical', href: canonical },
      },
      {
        selector: 'script#guides-structured-data',
        tag: 'script',
        attributes: { id: 'guides-structured-data', type: 'application/ld+json' },
        text: JSON.stringify(structuredData.primary),
      },
      {
        selector: 'script#guides-breadcrumb-data',
        tag: 'script',
        attributes: { id: 'guides-breadcrumb-data', type: 'application/ld+json' },
        text: JSON.stringify(structuredData.crumbs),
      },
      ...(structuredData.faq
        ? [
            {
              selector: 'script#guides-faq-data',
              tag: 'script' as const,
              attributes: { id: 'guides-faq-data', type: 'application/ld+json' },
              text: JSON.stringify(structuredData.faq),
            },
          ]
        : []),
    ];

    // The returned cleanup restores the prior <head> state when the page
    // unmounts (for example navigating a guide back to Home, which has no
    // metadata of its own) and before every index/detail re-write.
    return applyHeadWrites(title, writes);
  }, [title, description, canonical, guide, structuredData, lang]);

  if (notFound) {
    return (
      <div className="guides-page guides-not-found">
        <h1>{common.guidesNotFoundTitle}</h1>
        <p>{common.guidesNotFoundDesc}</p>
        <Link lang={lang} className="guides-button" to={GUIDES_PATH}>
          {common.guidesNotFoundButton}
        </Link>
      </div>
    );
  }

  if (!isIndex && guide) {
    return (
      <div className="guides-page">
        <article className="guides-article" lang={guide.language ?? 'en'}>
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
              <time lang={lang} dateTime={guide.updated}>
                {common.guidesArticleMetaUpdated} {formatDate(guide.updated)}
              </time>
            </p>
          </header>

          <p className="guides-lede">{guide.description}</p>

          {guide.sections.map(section => (
            <section key={section.heading} className="guides-section">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${section.heading}-p${paragraphIndex}`}>
                  {renderGuideParagraph(paragraph)}
                </p>
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

          <section className="guides-section guides-faq">
            <h2 lang={lang}>{common.guidesSectionFaq}</h2>
            {guide.faqs.map(faq => (
              <div key={faq.question} className="guides-faq-item">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </section>

          <section className="guides-section guides-sources">
            <h2 lang={lang}>{common.guidesSectionSources}</h2>
            <p lang={lang}>{common.guidesSourcesDesc}</p>
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
            <RelatedContent
              heading={common.guidesRelatedMore}
              links={guides
                .filter(item => item.slug !== guide.slug)
                .map(item => ({
                  to: `${GUIDES_PATH}/${item.slug}`,
                  label: item.title,
                  lang: item.language ?? 'en',
                }))}
            />
            <RelatedContent
              heading={common.guidesRelatedCategories}
              links={getCategoriesForGuide(guide.slug).map(category => ({
                to: `/category/${category.slug}`,
                label: getCategoryText(category, lang).name,
                description: getCategoryText(category, lang).description,
              }))}
            />
            <Link lang={lang} className="guides-button" to={GUIDES_PATH}>
              {common.guidesButtonAll}
            </Link>
          </footer>
        </article>
      </div>
    );
  }

  return (
    <div className="guides-page">
      <header className="guides-header">
        <p className="guides-eyebrow">{common.guidesIndexEyebrow}</p>
        <h1>{common.guidesIndexTitle}</h1>
        <p className="guides-lede">{common.guidesIndexLede}</p>
      </header>

      <nav aria-label="User guides" className="guides-index">
        <ul className="guides-grid">
          {guides.map(listed => (
            <li key={listed.slug} className="guides-card" lang={listed.language ?? 'en'}>
              <article>
                <p className="guides-eyebrow">{listed.category}</p>
                <h2>
                  <Link to={`${GUIDES_PATH}/${listed.slug}`}>{listed.title}</Link>
                </h2>
                <p>{listed.description}</p>
                <p className="guides-meta">
                  <span>{listed.readingTime}</span>
                  <span aria-hidden="true">&middot;</span>
                  <time lang="en" dateTime={listed.updated}>
                    Updated {formatDate(listed.updated)}
                  </time>
                </p>
                <Link lang={lang} className="guides-card-link" to={`${GUIDES_PATH}/${listed.slug}`}>
                  {common.guidesIndexReadButton}
                  <span lang={listed.language ?? 'en'} className="guides-visually-hidden">
                    : {listed.title}
                  </span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </nav>

      <section className="guides-cta">
        <h2>{common.guidesCtaTitle}</h2>
        <p>{common.guidesCtaDesc}</p>
        <Link className="guides-button" to="/">
          {common.guidesCtaButton}
        </Link>
      </section>
    </div>
  );
};

export default GuidesPage;
