import React from 'react';

import './DataTable.css';

export interface DataTableColumn {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'right';
  /** Right-aligns and uses tabular numerals; implies align: 'right'. */
  numeric?: boolean;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: Array<Record<string, React.ReactNode>>;
  /** Rendered as the table's <caption>. */
  caption?: string;
  className?: string;
}

/** A semantic data table: scoped column headers, aligned numeric columns. */
const DataTable: React.FC<DataTableProps> = ({ columns, rows, caption, className }) => {
  const classes = ['cm-datatable', className].filter(Boolean).join(' ');
  const isRight = (column: DataTableColumn) => column.numeric || column.align === 'right';

  return (
    <div className="cm-datatable-scroll">
      <table className={classes}>
        {caption ? <caption className="cm-datatable-caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                scope="col"
                className={isRight(column) ? 'cm-datatable-cell-right' : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            // Rows are display data without stable ids; index keys are safe here.
            // eslint-disable-next-line react/no-array-index-key
            <tr key={rowIndex}>
              {columns.map(column => (
                <td
                  key={column.key}
                  className={isRight(column) ? 'cm-datatable-cell-right' : undefined}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
