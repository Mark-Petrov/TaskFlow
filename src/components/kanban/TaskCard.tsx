import { useRef, useCallback } from 'react'
import type { Task, BorderStyle } from '../../types'
import { BORDER_STYLES } from '../../types'

interface TaskCardProps {
  task: Task
  onClick: () => void
  draggable?: boolean
  isDragging?: boolean
  onDragStart?: (taskId: string) => void
  onDragEnd?: () => void
  onTouchDrop?: (taskId: string, columnId: string) => void
  getColumnIdAtPoint?: (x: number, y: number) => string | null
}

function getBorderWidth(style: string): string {
  const found = BORDER_STYLES.find(s => s.value === style)
  return found?.width ?? '2px'
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  if (c.length < 6) return true
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

export function TaskCard({
  task, onClick, draggable, isDragging,
  onDragStart, onDragEnd, onTouchDrop, getColumnIdAtPoint,
}: TaskCardProps) {
  const borderStyle = task.border_style as BorderStyle
  const hasBorder = borderStyle !== 'none'
  const textDark = isLightColor(task.bg_color)
  const movedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })

  const handleClick = () => {
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    onClick()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable || e.pointerType === 'mouse') return
    startRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggable || e.pointerType === 'mouse') return
    const dx = Math.abs(e.clientX - startRef.current.x)
    const dy = Math.abs(e.clientY - startRef.current.y)
    if (dx > 6 || dy > 6) {
      movedRef.current = true
      onDragStart?.(task.id)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggable || e.pointerType === 'mouse') return
    if (movedRef.current && onTouchDrop && getColumnIdAtPoint) {
      const colId = getColumnIdAtPoint(e.clientX, e.clientY)
      if (colId) onTouchDrop(task.id, colId)
    }
    onDragEnd?.()
    movedRef.current = false
  }

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/task-id', task.id)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(task.id)
  }, [task.id, onDragStart])

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`neo-task-card touch-none select-none ${isDragging ? 'neo-task-card-dragging' : ''} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        backgroundColor: task.bg_color,
        borderColor: hasBorder ? (task.border_color || '#111') : 'transparent',
        borderStyle: hasBorder ? borderStyle : 'none',
        borderWidth: getBorderWidth(borderStyle),
        boxShadow: hasBorder ? 'none' : '2px 2px 0 0 #111',
      }}
    >
      <p className={`text-sm font-bold leading-snug ${textDark ? 'text-neo-ink' : 'text-white'}`}>
        {task.title}
      </p>
      {task.description && (
        <p className={`text-xs mt-1 line-clamp-2 ${textDark ? 'text-neo-muted' : 'text-white/70'}`}>
          {task.description}
        </p>
      )}
      {task.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.badges.map((badge, i) => (
            <span key={i} className="neo-badge" style={{ backgroundColor: badge.bg_color }}>
              {badge.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
