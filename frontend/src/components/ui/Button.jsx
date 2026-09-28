import Loading from '@/components/ui/Loading'
const variants = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  danger: 'button-danger',
  dangerOutline: 'button-danger-outline',
  light: 'button-light',
}
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  full = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`button ${variants[variant]} ${size === 'sm' ? 'px-3 py-2 text-xs' : ''} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Loading size="sm" />}
      {children}
    </button>
  )
}
