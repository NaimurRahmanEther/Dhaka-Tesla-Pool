import { fareRows, formatTaka } from '@/lib/format'
import { Icon } from '@/components/ui'

// All line items come from the server; the browser never recalculates fares.
export default function FareBreakdown({ breakdown }) {
  const rows = fareRows(breakdown)
  if (!rows.length) return null
  return (
    <div className="overflow-hidden rounded-xl border border-brand-100">
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className={
              'flex items-center justify-between gap-4 px-5 ' +
              (row.total ? 'bg-brand-900 py-4 text-white' : 'bg-white py-3 text-sm')
            }
          >
            <dt className={row.total ? 'text-sm font-medium text-white/70' : 'text-slate-500'}>
              {row.label}
            </dt>
            <dd className={row.total ? 'text-xl font-bold' : 'font-semibold text-slate-800'}>
              {row.label === 'Pool discount' ? '−' : ''}
              {formatTaka(row.amount)}{' '}
              <span
                className={
                  row.total
                    ? 'text-xs font-normal text-white/50'
                    : 'text-[10px] font-normal text-slate-500'
                }
              >
                BDT
              </span>
            </dd>
          </div>
        ))}
      </dl>
      {breakdown.isPool && (
        <p className="flex items-center gap-2 bg-brand-50 px-5 py-3 text-xs font-medium text-brand-700">
          <Icon name="users" className="h-4 w-4" />
          Your shared-trip discount is included.
        </p>
      )}
    </div>
  )
}
