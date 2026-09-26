import { useId } from 'react'

// Labelled text field. The id, hint and error wiring are generated here so every
// form in the app gets accessible labels and announcements without each page
// hand-rolling the htmlFor / aria-describedby plumbing.
export default function Input({ label, hint, error, id, className = '', ...rest }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={`field mt-2 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
