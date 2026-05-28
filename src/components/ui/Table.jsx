import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

export function Table({
  columns = [],
  rows = [],
  getRowKey,
  emptyTitle = 'Tidak ada data',
  emptyDescription = 'Data akan tampil setelah tersedia.',
  loading = false,
  renderMobileCard,
  className = '',
}) {
  if (loading) {
    return <LoadingState label="Memuat tabel..." />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={className}>
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <article key={getRowKey ? getRowKey(row, index) : index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {renderMobileCard ? (
              renderMobileCard(row, index)
            ) : (
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-xs font-black uppercase text-slate-400">{column.header}</span>
                    <span className="text-right font-bold text-slate-700">{column.render ? column.render(row, index) : row[column.key]}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="border-b border-slate-200 px-4 py-3">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={getRowKey ? getRowKey(row, index) : index} className="hover:bg-teal-50/40">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top text-slate-700">
                      {column.render ? column.render(row, index) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
