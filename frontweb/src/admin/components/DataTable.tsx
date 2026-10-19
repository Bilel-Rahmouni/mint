import type { CSSProperties, ReactNode } from 'react'
import './DataTable.css'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  hideOnMobile?: boolean
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  empty?: string
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty = 'Nothing here' }: Props<T>) {
  const cellClass = (col: Column<T>) =>
    `data-table__cell data-table__cell--${col.align ?? 'left'} ${col.hideOnMobile ? 'data-table__cell--optional' : ''}`

  return (
    <div className="data-table__wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cellClass(col)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? 'data-table__row--clickable' : undefined}
              style={{ '--i': i } as CSSProperties}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={cellClass(col)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="data-table__empty">{empty}</p>}
    </div>
  )
}
