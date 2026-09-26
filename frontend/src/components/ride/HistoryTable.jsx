// One table component for both roles. Columns are passed in, so the same
// layout renders passenger history (rides) and driver history (pool rides).
// A ride with null completed_at is still in progress — formatDateTime handles it.
export default function HistoryTable({ rides, columns }) {
  if (!rides || rides.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-slate-500 uppercase bg-slate-50">
            {columns.map((col) => (
              <th key={col.key} className={`pb-2 px-3 ${col.align || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rides.map((ride) => (
            <tr key={ride.ride_id || ride.id} className="hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col.key} className={`py-3 px-3 ${col.align || ''}`}>
                  {col.render ? col.render(ride) : ride[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}