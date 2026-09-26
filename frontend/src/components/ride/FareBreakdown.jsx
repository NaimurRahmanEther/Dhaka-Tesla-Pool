import { fareRows, formatTaka } from '@/lib/format'

// The one component that turns the server's rides.fare_breakdown JSONB into
// screen rows. It reads the line items - base fare, distance charge, pool
// discount, total - and renders them exactly as the backend wrote them. It
// never adds, subtracts or recomputes a number; the breakdown IS the source of
// truth (there is no fare endpoint in this backend).
//
// A ride that has not been matched yet has no breakdown (fare_breakdown is
// NULL), so this renders nothing and the page shows its own "fare comes after
// matching" note.
export default function FareBreakdown({ breakdown }) {
  const rows = fareRows(breakdown)
  if (!rows.length) return null

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {rows.map((row) =>
        row.total ? (
          <div
            key={row.label}
            className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3"
          >
            <span className="text-sm font-semibold text-slate-900">{row.label}</span>
            <span className="text-sm font-bold text-slate-900">{formatTaka(row.amount)} BDT</span>
          </div>
        ) : (
          <div key={row.label} className="flex items-center justify-between bg-white px-4 py-2.5">
            <span className="text-sm text-slate-600">{row.label}</span>
            <span className="text-sm font-medium text-slate-900">{formatTaka(row.amount)} BDT</span>
          </div>
        ),
      )}
    </div>
  )
}