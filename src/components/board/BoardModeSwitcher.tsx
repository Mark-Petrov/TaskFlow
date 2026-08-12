import { LayoutGrid, List, ShoppingCart } from 'lucide-react'
import type { BoardType } from '../../types'

interface BoardModeSwitcherProps {
  type: BoardType
  onChange: (type: BoardType) => void
  disabled?: boolean
  compact?: boolean
}

const MODES: { value: BoardType; label: string; short: string; Icon: typeof LayoutGrid }[] = [
  { value: 'kanban', label: 'Kanban', short: 'Kanban', Icon: LayoutGrid },
  { value: 'simple', label: 'Simple List', short: 'Список', Icon: List },
  { value: 'shopping', label: 'Shopping List', short: 'Покупки', Icon: ShoppingCart },
]

export function BoardModeSwitcher({ type, onChange, disabled, compact }: BoardModeSwitcherProps) {
  return (
    <div className={`neo-mode-switch ${compact ? 'neo-mode-switch-compact' : ''}`}>
      {MODES.map(({ value, label, short, Icon }) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value)}
          className={`neo-mode-btn ${type === value ? 'active' : ''}`}
          title={label}
        >
          <Icon size={16} strokeWidth={2.5} />
          <span>{compact ? short : label}</span>
        </button>
      ))}
    </div>
  )
}
