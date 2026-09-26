const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
}

// A border-circle spinner. The wrapper centres it wherever it lands, and the
// visible ring has a real height in every size, so a default <Spinner /> never
// collapses to zero height. Decoration is aria-hidden; the label is sr-only.
export default function Spinner({ size = 'md', label = 'Loading…', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center ${className}`}>
      <span
        aria-hidden="true"
        className={`inline-block animate-spin rounded-full border-current border-t-transparent opacity-70 ${SIZES[size]}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
