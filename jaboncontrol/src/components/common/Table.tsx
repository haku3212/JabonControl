import { ReactNode } from 'react';

interface Column {
  key: string;
  label: string;
  className?: string;
}

interface TableProps {
  columns: Column[];
  data: Record<string, ReactNode>[];
  onRowClick?: (row: Record<string, ReactNode>) => void;
}

export function Table({ columns, data, onRowClick }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left px-3 py-2 text-xs font-mono text-text-tertiary uppercase ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-dark-border hover:bg-dark-surface2 transition-colors cursor-pointer"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 text-text-secondary ${col.className || ''}`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
