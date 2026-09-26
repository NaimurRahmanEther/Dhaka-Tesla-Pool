export default function RouteSummary({ pickup, destination, className = '' }) {
  return (
    <div className={'flex gap-4 ' + className}>
      <div className="flex w-4 shrink-0 flex-col items-center py-1.5" aria-hidden="true">
        <span className="h-3 w-3 rounded-full border-[3px] border-brand-600" />
        <span className="my-1 min-h-6 w-px flex-1 border-l border-dashed border-slate-300" />
        <span className="h-3 w-3 rounded-sm bg-brand-800" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="pb-5">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Pickup</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {pickup || 'Choose your pickup'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Destination
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {destination || 'Choose your destination'}
          </p>
        </div>
      </div>
    </div>
  )
}
