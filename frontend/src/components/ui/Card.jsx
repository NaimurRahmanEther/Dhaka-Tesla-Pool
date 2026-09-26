// Plain container: white, rounded, bordered, padded. Everything else is passed
// through className, so this stays a box rather than a layout system - pages
// compose it as they like.
export default function Card({ className = '', children }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  )
}