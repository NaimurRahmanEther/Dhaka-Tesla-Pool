// Centred "there is nothing to show yet" block. Every list page uses this when
// the API returns an empty array, so an empty result never reads as a bug or a
// broken screen. children is the optional action (a link or button).
export default function EmptyState({ title, description, children }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}