const TONES = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

// Inline feedback box. error carries role="alert" so screen readers announce
// it; info and success are presentational context, not interruptions.
export default function Alert({ tone = 'info', className = '', children }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={`rounded-lg border px-4 py-3 text-sm ${TONES[tone]} ${className}`}
    >
      {children}
    </div>
  )
}