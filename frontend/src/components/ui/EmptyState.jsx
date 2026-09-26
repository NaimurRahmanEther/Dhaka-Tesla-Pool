import Icon from '@/components/ui/Icon'
export default function EmptyState({
  title = 'Nothing here yet',
  description,
  children,
  className = '',
  icon = 'route',
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-5 py-12 text-center ${className}`}
    >
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      )}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  )
}
