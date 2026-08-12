import { useRef, useCallback } from 'react'
import { Columns3, Plus } from 'lucide-react'
import type { Column, Task } from '../../types'
import { ColumnView } from './ColumnView'
import { NeoButton } from '../ui/NeoButton'

interface KanbanBoardProps {
  columns: Column[]
  tasks: Task[]
  onAddTask: (columnId: string) => void
  onEditTask: (task: Task) => void
  onEditColumn: (column: Column) => void
  onDeleteColumn: (columnId: string) => void
  onMoveTask: (taskId: string, columnId: string) => void
  onAddColumn: () => void
  draggedTaskId: string | null
  dropColumnId: string | null
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  onDragOverColumn: (columnId: string | null) => void
}

export function KanbanBoard(props: KanbanBoardProps) {
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setColumnRef = useCallback((columnId: string) => (el: HTMLDivElement | null) => {
    if (el) columnRefs.current.set(columnId, el)
    else columnRefs.current.delete(columnId)
  }, [])

  const getColumnIdAtPoint = useCallback((x: number, y: number) => {
    for (const [id, el] of columnRefs.current) {
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return id
      }
    }
    return null
  }, [])

  if (props.columns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
        <Columns3 size={40} strokeWidth={2} className="text-neo-muted mb-3" />
        <p className="neo-display font-bold text-sm">Нет колонок</p>
        <NeoButton className="mt-4" onClick={props.onAddColumn}>
          <Plus size={16} strokeWidth={2.5} /> Добавить колонку
        </NeoButton>
      </div>
    )
  }

  return (
    <div className="flex gap-3 p-4 overflow-x-auto h-[calc(100vh-120px)] pb-24">
      {props.columns.map(column => (
        <ColumnView
          key={column.id}
          column={column}
          tasks={props.tasks}
          onAddTask={props.onAddTask}
          onEditTask={props.onEditTask}
          onEditColumn={props.onEditColumn}
          onDeleteColumn={props.onDeleteColumn}
          onMoveTask={props.onMoveTask}
          draggedTaskId={props.draggedTaskId}
          dropColumnId={props.dropColumnId}
          onDragStart={props.onDragStart}
          onDragEnd={props.onDragEnd}
          onDragOverColumn={props.onDragOverColumn}
          columnRef={setColumnRef(column.id)}
          getColumnIdAtPoint={getColumnIdAtPoint}
        />
      ))}
    </div>
  )
}
