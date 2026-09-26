export default function HistoryTable({ rides, columns }) {
  if (!rides?.length) return null
  return (
    <>
      <div className="space-y-4 lg:hidden">
        {rides.map((ride) => (
          <dl
            key={String(ride.pool_id ?? '') + '-' + ride.ride_id}
            className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-slate-200 bg-white p-5"
          >
            {columns.map((col) => (
              <div key={col.key} className="min-w-0">
                <dt className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  {col.label}
                </dt>
                <dd className="mt-1.5 break-words text-sm text-slate-700">
                  {col.render ? col.render(ride) : ride[col.key]}
                </dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
      <div
        role="region"
        aria-label="Ride history table"
        tabIndex={0}
        className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white lg:block"
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-brand-50/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={
                    'whitespace-nowrap px-5 py-4 text-[10px] font-bold tracking-widest text-brand-600 uppercase ' +
                    (col.align || '')
                  }
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rides.map((ride) => (
              <tr
                key={String(ride.pool_id ?? '') + '-' + ride.ride_id}
                className="transition hover:bg-brand-50/40"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={'px-5 py-5 text-xs leading-5 text-slate-600 ' + (col.align || '')}
                  >
                    {col.render ? col.render(ride) : ride[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
