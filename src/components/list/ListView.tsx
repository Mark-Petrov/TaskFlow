import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { Task } from '../../types'
import { sortListTasks } from '../../types'
import { ListTaskRow } from './ListTaskRow'
import { NeoButton } from '../ui/NeoButton'

interface ListViewProps {
  tasks: Task[]
  onToggle: (taskId: string) => void
  onEdit: (task: Task) => void
}

export function ListView({ tasks, onToggle, onEdit }: ListViewProps) {
  const [showCompleted, setShowCompleted] = useState(true)

  const sorted = sortListTasks(tasks)
  const active = sorted.filter(t => !t.is_completed)
  const completed = sorted.filter(t => t.is_completed)
  const visible = showCompleted ? sorted : active

  return (
    <div className="px-4 pb-28 pt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="neo-label">
          {active.length} активных{completed.length > 0 && ` · ${completed.length} готово`}
        </p>
        {completed.length > 0 && (
          <NeoButton
            variant="ghost"
            onClick={() => setShowCompleted(v => !v)}
            className="!min-h-[36px] !py-1 !px-2 !text-xs"
          >
            {showCompleted ? <EyeOff size={14} /> : <Eye size={14} />}
            {showCompleted ? 'Скрыть' : 'Показать'} выполненные
          </NeoButton>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="neo-surface p-8 text-center">
          <p className="neo-display font-bold text-sm">Список пуст</p>
          <p className="text-xs text-neo-muted mt-1">Добавьте первую задачу</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(task => (
            <ListTaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
