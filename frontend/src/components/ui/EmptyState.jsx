/**
 * Standardized Empty State Component
 *
 * @param {Component} icon - Icon component (from lucide-react)
 * @param {string} title - Empty state title
 * @param {string} description - Empty state description
 * @param {ReactNode} action - Optional action button
 * @param {string} className - Additional classes
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  ...props
}) {
  return (
    <div
      className={`text-center py-12 ${className}`}
      {...props}
    >
      {Icon && (
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
