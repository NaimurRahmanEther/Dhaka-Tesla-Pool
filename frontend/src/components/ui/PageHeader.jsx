export default function PageHeader({
  title,
  description,
  children,
  className = '',
  eyebrow = 'YOUR EVERYDAY, SHARED',
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-5 ${className}`}>
      <div className="min-w-0">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
