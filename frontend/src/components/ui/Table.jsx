/**
 * Reusable Table Component
 *
 * @param {Array} columns - Column definitions [{ key, label, render?, width? }]
 * @param {Array} data - Data array
 * @param {Function} onRowClick - Optional row click handler
 * @param {string} className - Additional classes
 */
export default function Table({
  columns = [],
  data = [],
  onRowClick,
  className = '',
  ...props
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden ${className}`} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    hover:bg-blue-50/50 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key || colIndex}
                      className="px-6 py-4 text-sm text-gray-900"
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
