import { Loader2 } from 'lucide-react';

/**
 * Standardized Button Component
 *
 * @param {string} variant - Button style: 'primary' | 'secondary' | 'danger' | 'icon'
 * @param {string} size - Button size: 'sm' | 'md' | 'lg'
 * @param {ReactNode} icon - Optional icon component (from lucide-react)
 * @param {boolean} loading - Show loading spinner
 * @param {boolean} disabled - Disable button
 * @param {function} onClick - Click handler
 * @param {string} className - Additional classes
 * @param {ReactNode} children - Button text/content
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  children,
  ...props
}) {
  // Base styles
  const baseStyles = 'font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant styles
  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105',
    secondary: 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-md hover:shadow-lg',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl',
    icon: 'p-2 hover:bg-gray-100 rounded-lg transition-colors',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  // Special handling for icon variant
  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : Icon && <Icon className="h-5 w-5" />}
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" />}
          {children}
        </>
      )}
    </button>
  );
}
