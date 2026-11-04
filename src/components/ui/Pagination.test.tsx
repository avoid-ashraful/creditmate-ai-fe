import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import Pagination, { paginationItems } from './Pagination';

describe('paginationItems', () => {
  it('lists every page when there are few', () => {
    expect(paginationItems(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it('collapses with ellipses around a middle page', () => {
    const items = paginationItems(10, 24);
    expect(items[0]).toBe(1);
    expect(items[items.length - 1]).toBe(24);
    expect(items).toContain('ellipsis-start');
    expect(items).toContain('ellipsis-end');
    expect(items).toContain(10);
  });
});

describe('Pagination', () => {
  it('marks the current page and disables Previous on page 1', () => {
    render(<Pagination page={1} pageCount={5} onChange={jest.fn()} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('disables Next on the last page', () => {
    render(<Pagination page={5} pageCount={5} onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('calls onChange for next, previous and numbered pages', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Pagination page={3} pageCount={9} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
