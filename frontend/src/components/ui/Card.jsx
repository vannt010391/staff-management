/**
 * Standardized Card Component
 *
 * @param {boolean} hover - Enable hover effects
 * @param {boolean} glass - Use glass morphism effect
 * @param {string} className - Additional classes
 * @param {ReactNode} children - Card content
 */
export default function Card({
  hover = false,
  glass = false,
  className = '',
  children,
  ...props
}) {
  // Base styles
  const baseStyles = 'rounded-2xl p-6 border border-white/20 transition-all';

  // Background styles
  const backgroundStyles = glass
    ? 'bg-white/80 backdrop-blur-sm'
    : 'bg-white';

  // Shadow styles
  const shadowStyles = hover
    ? 'shadow-lg hover:shadow-xl'
    : 'shadow-lg';

  return (
    <div
      className={`${baseStyles} ${backgroundStyles} ${shadowStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
