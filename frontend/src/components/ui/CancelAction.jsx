import { useId } from 'react'
import Button from './Button'
import Icon from './Icon'

export default function CancelAction({
  confirming, onOpen, onKeep, onConfirm, busy = false, disabled = false,
  label = 'Cancel ride', title = 'Cancel this ride?', description,
  keepLabel = 'Keep ride', confirmLabel = 'Yes, cancel ride',
}) {
  const titleId = useId()
  if (!confirming) {
    return <Button variant="dangerOutline" size="sm" disabled={disabled} onClick={onOpen}><Icon name="close" className="h-4 w-4" />{label}</Button>
  }
  return (
    <div role="group" aria-labelledby={titleId} className="w-full rounded-xl border border-red-200 bg-red-50/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-red-700"><Icon name="info" className="h-4 w-4" /></span>
        <div>
          <p id={titleId} className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button variant="secondary" size="sm" disabled={disabled || busy} onClick={onKeep}>{keepLabel}</Button>
        <Button variant="danger" size="sm" disabled={disabled} loading={busy} onClick={onConfirm}>{busy ? 'Cancelling…' : confirmLabel}</Button>
      </div>
    </div>
  )
}
