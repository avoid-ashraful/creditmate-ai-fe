import { useEffect } from 'react';

import { resetSeoMeta, setSeoMeta, SeoMetaOptions } from '../utils/seo';

/**
 * Applies page metadata while the calling component is mounted and restores
 * the previous head on unmount. Pass null while the data a page needs is still
 * loading; metadata is applied once options are available.
 *
 * Options are compared by value, so callers can build them inline on every
 * render without re-applying the same metadata.
 */
export const useSeoMeta = (options: SeoMetaOptions | null): void => {
  const serialized = options ? JSON.stringify(options) : null;

  useEffect(() => {
    if (serialized === null) return undefined;
    setSeoMeta(JSON.parse(serialized) as SeoMetaOptions);
    return () => {
      resetSeoMeta();
    };
  }, [serialized]);
};
