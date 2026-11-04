import { render, screen } from '@testing-library/react';
import React from 'react';

import DataTable from './DataTable';

describe('DataTable', () => {
  it('renders scoped headers, caption and cells', () => {
    render(
      <DataTable
        caption="Fee schedule"
        columns={[
          { key: 'item', header: 'Item' },
          { key: 'fee', header: 'Fee', numeric: true },
        ]}
        rows={[
          { item: 'SMS alert', fee: '৳200' },
          { item: 'Card issuance', fee: '৳575' },
        ]}
      />
    );

    expect(screen.getByText('Fee schedule')).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
    headers.forEach(header => expect(header).toHaveAttribute('scope', 'col'));
    expect(screen.getByRole('cell', { name: 'SMS alert' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '৳575' })).toBeInTheDocument();
  });

  it('right-aligns numeric columns', () => {
    render(
      <DataTable
        columns={[{ key: 'fee', header: 'Fee', numeric: true }]}
        rows={[{ fee: '৳200' }]}
      />
    );
    expect(screen.getByRole('columnheader', { name: 'Fee' })).toHaveClass(
      'cm-datatable-cell-right'
    );
    expect(screen.getByRole('cell', { name: '৳200' })).toHaveClass('cm-datatable-cell-right');
  });
});
