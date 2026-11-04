import React from 'react';

import './Pagination.css';

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** First/last page plus a window of up to five pages around the current one. */
export function paginationItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, pageCount]);
  for (let p = page - 2; p <= page + 2; p += 1) {
    if (p >= 1 && p <= pageCount) {
      pages.add(p);
    }
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) {
      items.push(p <= page ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(p);
  });
  return items;
}

/** Numbered pagination with Previous/Next and ellipsis collapsing. */
const Pagination: React.FC<PaginationProps> = ({ page, pageCount, onChange, className }) => {
  if (pageCount < 1) {
    return null;
  }
  const classes = ['cm-pagination', className].filter(Boolean).join(' ');
  const items = paginationItems(page, pageCount);

  return (
    <nav className={classes} aria-label="Pagination">
      <button
        type="button"
        className="cm-pagination-button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      {items.map(item =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            className="cm-pagination-button"
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="cm-pagination-ellipsis" aria-hidden="true">
            …
          </span>
        )
      )}
      <button
        type="button"
        className="cm-pagination-button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
