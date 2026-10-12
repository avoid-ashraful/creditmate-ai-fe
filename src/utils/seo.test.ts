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
