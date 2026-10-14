import { resetSeoMeta, setSeoMeta } from './seo';

describe('SEO meta lifecycle', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  test('restores pre-existing meta content, canonical href, and title', () => {
    document.title = 'Original Title';
    const description = document.createElement('meta');
    description.setAttribute('name', 'description');
    description.setAttribute('content', 'Original description');
    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Original social title');
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://example.com/original');
    document.head.append(description, ogTitle, canonical);

    setSeoMeta({
      title: 'Managed Title',
      description: 'Managed description',
      canonicalPath: '/category/travel',
    });

    expect(document.title).toBe('Managed Title');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Managed description'
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://localhost/category/travel'
    );

    resetSeoMeta();

    expect(document.title).toBe('Original Title');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Original description'
    );
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Original social title'
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://example.com/original'
    );
  });

  test('removes only tags the helper created', () => {
    document.title = 'Original Title';
    const unrelated = document.createElement('meta');
    unrelated.setAttribute('name', 'unrelated');
    unrelated.setAttribute('content', 'Unchanged');
    document.head.appendChild(unrelated);

    setSeoMeta({
      title: 'Managed Title',
      description: 'Managed description',
      canonicalPath: '/category/travel',
    });
    resetSeoMeta();

    expect(document.title).toBe('Original Title');
    expect(document.querySelector('meta[name="description"]')).not.toBeInTheDocument();
    expect(document.querySelector('meta[property="og:title"]')).not.toBeInTheDocument();
    expect(document.querySelector('meta[property="og:description"]')).not.toBeInTheDocument();
    expect(document.querySelector('meta[property="og:type"]')).not.toBeInTheDocument();
    expect(document.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
    expect(unrelated).toHaveAttribute('content', 'Unchanged');
  });
});

describe('SEO social tags and JSON-LD', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  test('writes Open Graph, Twitter and canonical URL tags from one call', () => {
    setSeoMeta({
      title: 'Travel cards | CreditMate AI',
      description: 'Travel credit cards in Bangladesh.',
      canonicalPath: '/category/travel',
      ogType: 'article',
    });

    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'http://localhost/category/travel'
    );
    expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'article'
    );
    expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'CreditMate AI'
    );
    expect(document.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary'
    );
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'Travel cards | CreditMate AI'
    );
    expect(document.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      'content',
      'Travel credit cards in Bangladesh.'
    );

    resetSeoMeta();

    expect(document.querySelector('meta[property="og:url"]')).not.toBeInTheDocument();
    expect(document.querySelector('meta[name="twitter:card"]')).not.toBeInTheDocument();
    expect(document.querySelector('meta[property="og:site_name"]')).not.toBeInTheDocument();
  });

  test('defaults og:type to website and omits og:url without a canonical path', () => {
    setSeoMeta({ title: 'Home', description: 'Home page.' });

    expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website'
    );
    expect(document.querySelector('meta[property="og:url"]')).not.toBeInTheDocument();
    expect(document.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
  });

  test('writes JSON-LD as one script and replaces it on the next call', () => {
    setSeoMeta({
      title: 'First',
      description: 'First page.',
      jsonLd: { '@type': 'Organization', name: 'First' },
    });
    setSeoMeta({
      title: 'Second',
      description: 'Second page.',
      jsonLd: [{ '@type': 'WebSite', name: 'Second' }],
    });

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '')).toEqual([
      { '@type': 'WebSite', name: 'Second' },
    ]);
  });

  test('drops JSON-LD when a later call does not supply it', () => {
    setSeoMeta({ title: 'First', description: 'First.', jsonLd: { '@type': 'FAQPage' } });
    setSeoMeta({ title: 'Second', description: 'Second.' });

    expect(document.querySelectorAll('script[data-seo-json-ld]')).toHaveLength(0);
  });

  test('removes the JSON-LD script on reset and leaves other scripts alone', () => {
    const unrelated = document.createElement('script');
    unrelated.setAttribute('type', 'application/ld+json');
    unrelated.textContent = '{"@type":"Thing"}';
    document.head.appendChild(unrelated);

    setSeoMeta({
      title: 'Managed',
      description: 'Managed page.',
      jsonLd: { '@type': 'FAQPage' },
    });
    resetSeoMeta();

    expect(document.querySelectorAll('script[data-seo-json-ld]')).toHaveLength(0);
    expect(unrelated.textContent).toBe('{"@type":"Thing"}');
  });
});
