/**
 * Standardized Page Header Component
 *
 * @param {Component} icon - Icon component (from lucide-react)
 * @param {string} title - Page title
 * @param {string} subtitle - Page subtitle/description
 * @param {ReactNode} actions - Action buttons (e.g., "New Item" button)
 * @param {string} className - Additional classes
 */
export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className = '',
  ...props
}) {
  return (
    <div
      className={`bg-white/40 backdrop-blur-2xl border border-white/20 shadow-lg rounded-2xl p-6 mb-8 ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
              <Icon className="h-7 w-7 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 text-base mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
