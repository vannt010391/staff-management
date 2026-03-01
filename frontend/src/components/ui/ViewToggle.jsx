import { LayoutGrid, List } from 'lucide-react';

/**
 * View Toggle Component
 * Toggle between grid and list views
 *
 * @param {string} view - Current view ('grid' or 'list')
 * @param {Function} onViewChange - Callback when view changes
 */
export default function ViewToggle({ view = 'grid', onViewChange }) {
  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200">
      <button
        onClick={() => onViewChange('grid')}
        className={`
          p-2 rounded-md transition-all
          ${view === 'grid'
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
        title="Grid View"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`
          p-2 rounded-md transition-all
          ${view === 'list'
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
        title="List View"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
