import { useRef, useState, useCallback, useEffect } from 'react'
import { Plus } from 'lucide-react'
import type { Task } from '../../types'
import { sortListTasks } from '../../types'
import { ShoppingListRow } from './ShoppingListRow'

interface ShoppingListViewProps {
  tasks: Task[]
  onAdd: (title: string) => Promise<void>
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
}

export function ShoppingListView({ tasks, onAdd, onToggle, onDelete }: ShoppingListViewProps) {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sorted = sortListTasks(tasks)
  const active = sorted.filter(t => !t.is_completed)
  const completed = sorted.filter(t => t.is_completed)

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  useEffect(() => {
    focusInput()
  }, [focusInput])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const title = input.trim()
    if (!title || adding) return

    setAdding(true)
    try {
      await onAdd(title)
      setInput('')
      focusInput()
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="shopping-list flex flex-col flex-1 min-h-0">
      <div className="shopping-list-body flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="shopping-empty">Список пуст — добавьте первый товар ниже</p>
        ) : (
          <>
            {active.map(task => (
              <ShoppingListRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
            {completed.length > 0 && active.length > 0 && (
              <div className="shopping-divider-label">Куплено</div>
            )}
            {completed.map(task => (
              <ShoppingListRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </>
        )}
      </div>

      <form className="shopping-input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Молоко, хлеб, яйца..."
          className="shopping-input"
          autoComplete="off"
          enterKeyHint="done"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={!input.trim() || adding}
          className="shopping-add-btn"
          aria-label="Добавить"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}
