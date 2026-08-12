import { useState } from 'react'
import { MoreHorizontal, Plus, Trash2, Pencil } from 'lucide-react'
import type { Column, Task } from '../../types'
import { TaskCard } from './TaskCard'
import { NeoButton } from '../ui/NeoButton'

interface ColumnViewProps {
  column: Column
  tasks: Task[]
  onAddTask: (columnId: string) => void
  onEditTask: (task: Task) => void
  onEditColumn: (column: Column) => void
  onDeleteColumn: (columnId: string) => void
  onMoveTask: (taskId: string, columnId: string) => void
  draggedTaskId?: string | null
  dropColumnId?: string | null
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  onDragOverColumn: (columnId: string | null) => void
  columnRef?: (el: HTMLDivElement | null) => void
  getColumnIdAtPoint?: (x: number, y: number) => string | null
}

export function ColumnView({
  column, tasks, onAddTask, onEditTask, onEditColumn, onDeleteColumn,
  onMoveTask, draggedTaskId, dropColumnId,
  onDragStart, onDragEnd, onDragOverColumn, columnRef, getColumnIdAtPoint,
}: ColumnViewProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const columnTasks = tasks
    .filter(t => t.column_id === column.id)
    .sort((a, b) => a.position - b.position)

  const isDropTarget = dropColumnId === column.id && draggedTaskId && draggedTaskId !== columnTasks.find(t => t.id === draggedTaskId)?.id

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOverColumn(column.id)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/task-id')
    if (taskId) onMoveTask(taskId, column.id)
    onDragEnd()
  }

  return (
    <div
      ref={columnRef}
      data-column-id={column.id}
      className={`neo-column transition-colors ${isDropTarget ? 'neo-column-drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => onDragOverColumn(null)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="neo-display text-sm font-bold text-neo-ink truncate">{column.title}</h3>
          <span className="neo-column-count">{columnTasks.length}</span>
        </div>
        <div className="relative">
          <NeoButton variant="ghost" icon onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={18} strokeWidth={2.5} />
          </NeoButton>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-20 neo-surface py-1 min-w-[160px]">
                <button
                  onClick={() => { onEditColumn(column); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold hover:bg-neo-bg transition-colors"
                >
                  <Pencil size={14} strokeWidth={2.5} /> Переименовать
                </button>
                <button
                  onClick={() => { onDeleteColumn(column.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold text-neo-red hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} strokeWidth={2.5} /> Удалить
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-[60px]">
        {columnTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            draggable
            isDragging={draggedTaskId === task.id}
            onClick={() => onEditTask(task)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTouchDrop={onMoveTask}
            getColumnIdAtPoint={getColumnIdAtPoint}
          />
        ))}
      </div>

      <button
        onClick={() => onAddTask(column.id)}
        className="flex items-center justify-center gap-1.5 mt-2 w-full min-h-[44px] text-sm font-bold text-neo-muted hover:text-neo-ink border-2 border-dashed border-neo-ink/20 hover:border-neo-ink rounded-lg transition-colors"
      >
        <Plus size={16} strokeWidth={2.5} />
        Добавить
      </button>
    </div>
  )
}
