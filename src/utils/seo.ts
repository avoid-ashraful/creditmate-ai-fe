/**
 * Lightweight document head management for SEO (react-helmet not installed).
 */

interface ManagedMetaTag {
  tag: HTMLMetaElement;
  previousContent: string | null;
  created: boolean;
}

let createdMetaTags: ManagedMetaTag[] = [];
let previousTitle: string | null = null;
let managedCanonical: HTMLLinkElement | null = null;
let previousCanonicalHref: string | null = null;
let createdCanonical = false;

const findMetaTag = (attribute: 'name' | 'property', key: string) =>
  document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

const setMetaTag = (attribute: 'name' | 'property', key: string, content: string): void => {
  const currentTag = findMetaTag(attribute, key);
  const managedTag = createdMetaTags.find(managed => managed.tag === currentTag);

  if (managedTag) {
    managedTag.tag.setAttribute('content', content);
    return;
  }

  let tag = currentTag;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
    createdMetaTags.push({ tag, previousContent: null, created: true });
  } else {
    createdMetaTags.push({ tag, previousContent: tag.getAttribute('content'), created: false });
  }

  tag.setAttribute('content', content);
};

export const setSeoMeta = (options: {
  title: string;
  description: string;
  canonicalPath?: string;
}): void => {
  if (previousTitle === null) {
    previousTitle = document.title;
  }
  document.title = options.title;

  setMetaTag('name', 'description', options.description);
  setMetaTag('property', 'og:title', options.title);
  setMetaTag('property', 'og:description', options.description);
  setMetaTag('property', 'og:type', 'website');

  if (options.canonicalPath) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
      managedCanonical = link;
      previousCanonicalHref = null;
      createdCanonical = true;
    } else if (!managedCanonical) {
      managedCanonical = link;
      previousCanonicalHref = link.getAttribute('href');
      createdCanonical = false;
    }
    link.setAttribute('href', `${window.location.origin}${options.canonicalPath}`);
  }
};

export const resetSeoMeta = (): void => {
  if (previousTitle !== null) {
    document.title = previousTitle;
  }

  createdMetaTags.forEach(({ tag, previousContent, created }) => {
    if (created) {
      tag.parentNode?.removeChild(tag);
      return;
    }
    if (previousContent === null) {
      tag.removeAttribute('content');
    } else {
      tag.setAttribute('content', previousContent);
    }
  });
  createdMetaTags = [];

  if (managedCanonical) {
    if (createdCanonical) {
      managedCanonical.parentNode?.removeChild(managedCanonical);
    } else if (previousCanonicalHref === null) {
      managedCanonical.removeAttribute('href');
    } else {
      managedCanonical.setAttribute('href', previousCanonicalHref);
    }
    managedCanonical = null;
  }

  previousCanonicalHref = null;
  createdCanonical = false;
  previousTitle = null;
};
