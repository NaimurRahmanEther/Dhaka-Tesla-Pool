import { useState } from 'react'
import Input from '@/components/ui/Input'
import Icon from '@/components/ui/Icon'

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <Input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
        className="mt-1 flex min-h-10 items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-700"
      >
        <Icon name="eye" className="h-4 w-4" />
        {visible ? 'Hide password' : 'Show password'}
      </button>
    </div>
  )
}
