import { Trash2 } from 'lucide-react'
import type { Task } from '../../types'
import { NeoCheckbox } from '../ui/NeoCheckbox'

interface ShoppingListRowProps {
  task: Task
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
}

export function ShoppingListRow({ task, onToggle, onDelete }: ShoppingListRowProps) {
  return (
    <div className={`shopping-row ${task.is_completed ? 'shopping-row-done' : ''}`}>
      <NeoCheckbox
        checked={task.is_completed}
        onChange={() => onToggle(task.id)}
        label={task.title}
      />
      <span className={`shopping-row-title ${task.is_completed ? 'line-through text-neo-muted' : ''}`}>
        {task.title}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="shopping-row-delete"
        aria-label={`Удалить ${task.title}`}
      >
        <Trash2 size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
