import { Link } from 'react-router-dom'
import Icon from '@/components/ui/Icon'

export default function Brand({ to = '/', light = false }) {
  return (
    <Link
      to={to}
      className={'inline-flex items-center gap-3 ' + (light ? 'text-white' : 'text-brand-900')}
      aria-label="Dhaka Tesla Pool home"
    >
      <span
        className={
          'flex h-10 w-10 items-center justify-center rounded-xl ' +
          (light ? 'bg-lime-300 text-brand-900' : 'bg-brand-800 text-lime-300')
        }
      >
        <Icon name="route" className="h-6 w-6" />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight">
          Dhaka Tesla<span className={light ? 'text-lime-300' : 'text-brand-500'}> Pool</span>
        </span>
        <span
          className={
            'mt-0.5 block text-[10px] font-semibold tracking-[0.17em] uppercase ' +
            (light ? 'text-white/50' : 'text-slate-500')
          }
        >
          A better way together
        </span>
      </span>
    </Link>
  )
}
