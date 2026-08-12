import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Columns3 } from 'lucide-react'
import { MobileLayout } from '../components/layout/MobileLayout'
import { FAB } from '../components/ui/FAB'
import { Sheet } from '../components/ui/Sheet'
import { NeoButton } from '../components/ui/NeoButton'
import { NeoInput, NeoLabel } from '../components/ui/NeoInput'
import { OfflineBanner } from '../components/ui/OfflineBanner'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { TaskEditor } from '../components/kanban/TaskEditor'
import { ListView } from '../components/list/ListView'
import { ShoppingListView } from '../components/shopping/ShoppingListView'
import { BoardModeSwitcher } from '../components/board/BoardModeSwitcher'
import { MembersSheet } from '../components/members/MembersSheet'
import { NotificationInbox } from '../components/notifications/NotificationInbox'
import { useAuth } from '../contexts/AuthContext'
import { useBoard } from '../hooks/useBoard'
import { getBoardType, isListLikeBoard } from '../types'
import type { Task, Column, BoardType } from '../types'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    board, columns, tasks, loading, error, isOffline,
    updateBoardType, createColumn, updateColumn, deleteColumn,
    createTask, updateTask, deleteTask, toggleTaskComplete, moveTask,
    getDefaultColumnId,
  } = useBoard(boardId, user?.id)

  const [taskEditorOpen, setTaskEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>()
  const [membersOpen, setMembersOpen] = useState(false)
  const [columnSheetOpen, setColumnSheetOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [columnTitle, setColumnTitle] = useState('')
  const [switchingMode, setSwitchingMode] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dropColumnId, setDropColumnId] = useState<string | null>(null)

  const boardType: BoardType = getBoardType(board)
  const isKanban = boardType === 'kanban'
  const isSimple = boardType === 'simple'
  const isShopping = boardType === 'shopping'
  const isListLike = isListLikeBoard(boardType)

  const openCreateTask = (columnId?: string) => {
    setEditingTask(null)
    setTargetColumnId(columnId ?? getDefaultColumnId())
    setTaskEditorOpen(true)
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setTargetColumnId(task.column_id)
    setTaskEditorOpen(true)
  }

  const handleSaveTask = async (data: {
    title: string
    description: string
    bg_color: string
    border_color: string
    border_style: string
    badges: Task['badges']
  }) => {
    const colId = targetColumnId ?? getDefaultColumnId()
    if (!colId) return

    if (editingTask) {
      await updateTask(editingTask.id, data)
    } else {
      await createTask(colId, data.title, data)
    }
  }

  const handleShoppingAdd = async (title: string) => {
    const colId = getDefaultColumnId()
    if (!colId) return
    await createTask(colId, title)
  }

  const handleToggle = (taskId: string) => {
    toggleTaskComplete(taskId).catch(() => {})
  }

  const handleDelete = (taskId: string) => {
    deleteTask(taskId).catch(() => {})
  }

  const handleMoveTask = (taskId: string, columnId: string) => {
    moveTask(taskId, columnId)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDropColumnId(null)
  }

  const handleModeChange = async (type: BoardType) => {
    if (type === boardType || !board) return
    setSwitchingMode(true)
    try {
      await updateBoardType(type)
    } finally {
      setSwitchingMode(false)
    }
  }

  const openColumnEditor = (column?: Column) => {
    setEditingColumn(column ?? null)
    setColumnTitle(column?.title ?? '')
    setColumnSheetOpen(true)
  }

  const handleSaveColumn = async () => {
    if (!columnTitle.trim()) return
    if (editingColumn) {
      await updateColumn(editingColumn.id, columnTitle.trim())
    } else {
      await createColumn(columnTitle.trim())
    }
    setColumnSheetOpen(false)
  }

  return (
    <MobileLayout hideNav className={isShopping ? 'shopping-board-layout' : undefined}>
      <header className={`neo-header ${isShopping ? 'shopping-header' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <NeoButton variant="ghost" icon onClick={() => navigate('/')}>
            <ArrowLeft size={20} strokeWidth={2.5} />
          </NeoButton>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="neo-display text-base font-bold truncate">{board?.title ?? 'Доска'}</h1>
          </div>
          <div className="flex items-center gap-0.5">
            <NotificationInbox />
            {isKanban && (
              <NeoButton variant="ghost" icon onClick={() => openColumnEditor()} title="Добавить колонку">
                <Columns3 size={18} strokeWidth={2.5} />
              </NeoButton>
            )}
            <NeoButton variant="ghost" icon onClick={() => setMembersOpen(true)} title="Участники">
              <Users size={18} strokeWidth={2.5} />
            </NeoButton>
          </div>
        </div>
        <div className="mt-3 flex justify-center">
          <BoardModeSwitcher
            type={boardType}
            onChange={handleModeChange}
            disabled={switchingMode || loading}
            compact={isShopping}
          />
        </div>
      </header>

      <OfflineBanner show={isOffline} />

      {error && (
        <div className="mx-4 mt-3 neo-surface-flat p-3 text-sm font-medium text-neo-red">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex gap-3 p-4 overflow-x-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-72 h-64 neo-surface-flat animate-pulse bg-neo-bg" />
          ))}
        </div>
      ) : isShopping ? (
        <ShoppingListView
          tasks={tasks}
          onAdd={handleShoppingAdd}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ) : isSimple ? (
        <ListView
          tasks={tasks}
          onToggle={handleToggle}
          onEdit={openEditTask}
        />
      ) : (
        <KanbanBoard
          columns={columns}
          tasks={tasks}
          onAddTask={openCreateTask}
          onEditTask={openEditTask}
          onEditColumn={openColumnEditor}
          onDeleteColumn={deleteColumn}
          onMoveTask={handleMoveTask}
          onAddColumn={() => openColumnEditor()}
          draggedTaskId={draggedTaskId}
          dropColumnId={dropColumnId}
          onDragStart={setDraggedTaskId}
          onDragEnd={handleDragEnd}
          onDragOverColumn={setDropColumnId}
        />
      )}

      {isSimple && <FAB onClick={() => openCreateTask()} label="Добавить" />}

      {!isShopping && (
        <TaskEditor
          open={taskEditorOpen}
          onClose={() => setTaskEditorOpen(false)}
          task={editingTask}
          columnId={targetColumnId}
          onSave={handleSaveTask}
          onDelete={editingTask ? () => deleteTask(editingTask.id) : undefined}
        />
      )}

      <MembersSheet
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        boardId={boardId!}
      />

      {!isListLike && (
        <Sheet open={columnSheetOpen} onClose={() => setColumnSheetOpen(false)} title={editingColumn ? 'Переименовать' : 'Новая колонка'}>
          <div className="space-y-4">
            <div>
              <NeoLabel>Название</NeoLabel>
              <NeoInput
                value={columnTitle}
                onChange={e => setColumnTitle(e.target.value)}
                placeholder="План, В работе..."
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveColumn()}
              />
            </div>
            <NeoButton className="w-full" onClick={handleSaveColumn} disabled={!columnTitle.trim()}>
              {editingColumn ? 'Сохранить' : 'Создать'}
            </NeoButton>
          </div>
        </Sheet>
      )}
    </MobileLayout>
  )
}
