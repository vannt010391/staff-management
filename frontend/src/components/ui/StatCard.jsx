/**
 * Standardized Stat/Metric Card Component
 *
 * @param {Component} icon - Icon component (from lucide-react)
 * @param {string} label - Stat label
 * @param {string|number} value - Stat value
 * @param {string} gradient - Gradient variant: 'blue' | 'purple' | 'green' | 'red' | 'yellow'
 * @param {object} trend - Optional trend indicator {value: number, direction: 'up' | 'down'}
 * @param {string} className - Additional classes
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  gradient = 'blue',
  trend,
  className = '',
  ...props
}) {
  // Gradient color mappings
  const gradientColors = {
    blue: 'from-blue-600 to-purple-600',
    purple: 'from-purple-600 to-pink-600',
    green: 'from-green-600 to-emerald-600',
    red: 'from-red-600 to-pink-600',
    yellow: 'from-yellow-600 to-orange-600',
  };

  const iconBgColors = {
    blue: 'from-blue-100 to-purple-100',
    purple: 'from-purple-100 to-pink-100',
    green: 'from-green-100 to-emerald-100',
    red: 'from-red-100 to-pink-100',
    yellow: 'from-yellow-100 to-orange-100',
  };

  const iconTextColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div
      className={`bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-2">
            {label}
          </p>
          <p className={`text-2xl font-black bg-gradient-to-r ${gradientColors[gradient]} bg-clip-text text-transparent`}>
            {value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-gradient-to-br ${iconBgColors[gradient]} rounded-xl`}>
          {Icon && <Icon className={`h-6 w-6 ${iconTextColors[gradient]}`} />}
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${gradientColors[gradient]} rounded-full`} />
    </div>
  );
}
