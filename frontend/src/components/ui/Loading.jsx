import { useEffect, useState } from 'react'

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
}

export default function Loading({ size = 'md', label = 'Loading…', fullScreen = false, className = '' }) {
  const [slow, setSlow] = useState(false)
  const compact = size === 'sm'

  useEffect(() => {
    if (compact) return
    const timer = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(timer)
  }, [compact])

  return (
    <span role="status" aria-live="polite" className={`flex items-center justify-center ${fullScreen ? 'min-h-screen px-6' : ''} ${compact ? '' : 'flex-col gap-3 text-center text-brand-700'} ${className}`}>
      <span
        aria-hidden="true"
        className={`inline-block animate-spin motion-reduce:animate-none rounded-full border-current border-t-transparent opacity-70 ${SIZES[size]}`}
      />
      <span className={compact ? 'sr-only' : 'text-sm font-semibold'}>{label}</span>
      {!compact && slow && (
        <span className="max-w-xs text-sm leading-relaxed text-slate-500">
          This is taking a little longer than usual. Please keep this page open while we connect.
        </span>
      )}
    </span>
  )
}
