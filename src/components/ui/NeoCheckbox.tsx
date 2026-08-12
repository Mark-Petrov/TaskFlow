import { Check } from 'lucide-react'

interface NeoCheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
}

export function NeoCheckbox({ checked, onChange, label }: NeoCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={`neo-checkbox ${checked ? 'neo-checkbox-checked' : ''}`}
    >
      {checked && <Check size={14} strokeWidth={3} className="text-white" />}
    </button>
  )
}
