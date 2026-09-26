import Icon from '@/components/ui/Icon'
const tones = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-brand-100 bg-brand-50 text-brand-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}
export default function Alert({ tone = 'info', className = '', children }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-6 ${tones[tone]} ${className}`}
    >
      <Icon name={tone === 'success' ? 'check' : 'info'} className="mt-0.5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
