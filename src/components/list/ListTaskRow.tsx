import type { Task } from '../../types'
import { NeoCheckbox } from '../ui/NeoCheckbox'

interface ListTaskRowProps {
  task: Task
  onToggle: (taskId: string) => void
  onEdit: (task: Task) => void
}

export function ListTaskRow({ task, onToggle, onEdit }: ListTaskRowProps) {
  return (
    <div
      className={`neo-list-row ${task.is_completed ? 'neo-list-row-done' : ''}`}
      style={{
        backgroundColor: task.bg_color,
        borderColor: task.border_color,
      }}
    >
      <NeoCheckbox
        checked={task.is_completed}
        onChange={() => onToggle(task.id)}
        label={task.title}
      />
      <button
        type="button"
        onClick={() => onEdit(task)}
        className="flex-1 min-w-0 text-left py-1"
      >
        <p className={`text-sm font-bold leading-snug ${task.is_completed ? 'line-through' : ''}`}>
          {task.title}
        </p>
        {task.description && !task.is_completed && (
          <p className="text-xs text-neo-muted mt-0.5 line-clamp-1">{task.description}</p>
        )}
        {task.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.badges.map((badge, i) => (
              <span key={i} className="neo-badge" style={{ backgroundColor: badge.bg_color }}>
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </button>
    </div>
  )
}
