import { Plus } from 'lucide-react'

interface FABProps {
  onClick: () => void
  label?: string
}

export function FAB({ onClick, label = 'Новая задача' }: FABProps) {
  return (
    <button onClick={onClick} aria-label={label} className="neo-fab">
      <Plus size={20} strokeWidth={3} />
      <span>{label}</span>
    </button>
  )
}
