import { useState, useEffect, useCallback } from 'react'
import { boardsApi, columnsApi, tasksApi } from '../lib/api'
import { joinBoard, leaveBoard, connectSocket } from '../lib/socket'
import { saveBoardCache, loadBoardCache, isOnline } from '../lib/offlineStore'
import type { Board, Column, Task, Badge, BoardType } from '../types'
import { normalizeTask, sortListTasks, getBoardType, normalizeBoard } from '../types'

function persistCache(boardId: string, board: Board | null, columns: Column[], tasks: Task[]) {
  if (!board) return
  saveBoardCache({ boardId, board, columns, tasks }).catch(() => {})
}

export function useBoard(boardId: string | undefined, userId: string | undefined) {
  const [board, setBoard] = useState<Board | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const applyCache = useCallback((cache: Awaited<ReturnType<typeof loadBoardCache>>) => {
    if (!cache) return false
    setBoard(normalizeBoard(cache.board as Board & { type?: string }))
    setColumns(cache.columns)
    setTasks(cache.tasks.map(normalizeTask))
    setIsOffline(true)
    setError(null)
    return true
  }, [])

  const fetchData = useCallback(async () => {
    if (!boardId) return
    setError(null)

    if (!isOnline()) {
      const cached = await loadBoardCache(boardId)
      if (applyCache(cached)) {
        setLoading(false)
        return
      }
      setError('Нет подключения и нет сохранённых данных')
      setLoading(false)
      return
    }

    try {
      const [b, cols, tks] = await Promise.all([
        boardsApi.get(boardId),
        columnsApi.list(boardId),
        tasksApi.list(boardId),
      ])
      const normalized = tks.map(normalizeTask)
      const boardData = normalizeBoard({ ...b, board_type: getBoardType(b) })

      setBoard(boardData)
      setColumns(cols)
      setTasks(normalized)
      setIsOffline(false)

      persistCache(boardId, boardData, cols, normalized)
    } catch (e) {
      const cached = await loadBoardCache(boardId)
      if (applyCache(cached)) {
        setLoading(false)
        return
      }
      setError(e instanceof Error ? e.message : 'Не удалось загрузить доску')
      setBoard(null)
      setColumns([])
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [boardId, applyCache])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const onOnline = () => { setIsOffline(false); fetchData() }
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [fetchData])

  useEffect(() => {
    if (!boardId || !userId || isOffline) return

    joinBoard(boardId)
    const socket = connectSocket()

    const onTaskCreated = (task: Task) => {
      if (task.created_by === userId) return
      setTasks(prev => {
        const next = sortListTasks([...prev.filter(t => t.id !== task.id), normalizeTask(task)])
        if (board) persistCache(boardId, board, columns, next)
        return next
      })
    }
    const onTaskUpdated = (task: Task) => {
      setTasks(prev => {
        const next = sortListTasks(prev.map(t => t.id === task.id ? normalizeTask(task) : t))
        if (board) persistCache(boardId, board, columns, next)
        return next
      })
    }
    const onTaskDeleted = ({ id }: { id: string }) => {
      setTasks(prev => {
        const next = prev.filter(t => t.id !== id)
        if (board) persistCache(boardId, board, columns, next)
        return next
      })
    }

    socket.on('task:created', onTaskCreated)
    socket.on('task:updated', onTaskUpdated)
    socket.on('task:deleted', onTaskDeleted)

    return () => {
      leaveBoard(boardId)
      socket.off('task:created', onTaskCreated)
      socket.off('task:updated', onTaskUpdated)
      socket.off('task:deleted', onTaskDeleted)
    }
  }, [boardId, userId, isOffline, board, columns])

  const cacheCurrent = useCallback((b: Board | null, cols: Column[], tks: Task[]) => {
    if (boardId && b) persistCache(boardId, b, cols, tks)
  }, [boardId])

  const updateBoardType = async (board_type: BoardType) => {
    if (!boardId) return
    if (isOffline) {
      const updated = board ? { ...board, board_type } : null
      setBoard(updated)
      if (updated) cacheCurrent(updated, columns, tasks)
      return
    }
    const updated = await boardsApi.update(boardId, { board_type })
    const boardData = normalizeBoard(updated)
    setBoard(boardData)
    cacheCurrent(boardData, columns, tasks)
  }

  const createColumn = async (title: string) => {
    if (!boardId) throw new Error('No board')
    const col = await columnsApi.create(boardId, title)
    const nextCols = [...columns, col]
    setColumns(nextCols)
    cacheCurrent(board, nextCols, tasks)
    return col
  }

  const updateColumn = async (id: string, title: string) => {
    if (!boardId) return
    const col = await columnsApi.update(boardId, id, title)
    const nextCols = columns.map(c => c.id === id ? col : c)
    setColumns(nextCols)
    cacheCurrent(board, nextCols, tasks)
  }

  const deleteColumn = async (id: string) => {
    if (!boardId) return
    await columnsApi.delete(boardId, id)
    const nextCols = columns.filter(c => c.id !== id)
    const nextTasks = tasks.filter(t => t.column_id !== id)
    setColumns(nextCols)
    setTasks(nextTasks)
    cacheCurrent(board, nextCols, nextTasks)
  }

  const getDefaultColumnId = () => columns[0]?.id

  const createTask = async (columnId: string, title: string, extras?: Partial<Task>) => {
    if (!boardId) throw new Error('No board')
    const task = await tasksApi.create(boardId, {
      column_id: columnId,
      title,
      description: extras?.description ?? null,
      bg_color: extras?.bg_color ?? '#ffffff',
      border_color: extras?.border_color ?? '#111111',
      border_style: extras?.border_style ?? 'solid',
      badges: extras?.badges ?? [],
    })
    const normalized = normalizeTask(task)
    const nextTasks = sortListTasks([...tasks, normalized])
    setTasks(nextTasks)
    cacheCurrent(board, columns, nextTasks)
    return normalized
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!boardId) return
    const nextTasks = sortListTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t))
    setTasks(nextTasks)
    cacheCurrent(board, columns, nextTasks)

    if (isOffline) return

    try {
      const task = await tasksApi.update(boardId, id, updates as Record<string, unknown>)
      const synced = sortListTasks(tasks.map(t => t.id === id ? normalizeTask(task) : t))
      setTasks(synced)
      cacheCurrent(board, columns, synced)
    } catch (e) {
      await fetchData()
      throw e
    }
  }

  const moveTask = async (taskId: string, columnId: string) => {
    if (!boardId) return
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.column_id === columnId) return

    const position = tasks.filter(t => t.column_id === columnId && !t.is_completed).length
    const nextTasks = tasks.map(t =>
      t.id === taskId ? { ...t, column_id: columnId, position } : t
    )
    setTasks(nextTasks)
    cacheCurrent(board, columns, nextTasks)

    if (isOffline) return

    try {
      await tasksApi.update(boardId, taskId, { column_id: columnId, position })
    } catch {
      await fetchData()
    }
  }

  const toggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || !boardId) return

    const isCompleted = !task.is_completed
    const completedAt = isCompleted ? new Date().toISOString() : null

    const nextTasks = sortListTasks(tasks.map(t =>
      t.id === taskId ? { ...t, is_completed: isCompleted, completed_at: completedAt } : t
    ))
    setTasks(nextTasks)
    cacheCurrent(board, columns, nextTasks)

    if (isOffline) return

    try {
      await tasksApi.update(boardId, taskId, { is_completed: isCompleted, completed_at: completedAt })
    } catch {
      setTasks(sortListTasks(tasks.map(t =>
        t.id === taskId ? { ...t, is_completed: task.is_completed, completed_at: task.completed_at } : t
      )))
    }
  }

  const deleteTask = async (id: string) => {
    if (!boardId) return
    if (!isOffline) await tasksApi.delete(boardId, id)
    const nextTasks = tasks.filter(t => t.id !== id)
    setTasks(nextTasks)
    cacheCurrent(board, columns, nextTasks)
  }

  return {
    board, columns, tasks, loading, error, isOffline,
    updateBoardType, createColumn, updateColumn, deleteColumn,
    createTask, updateTask, deleteTask, toggleTaskComplete, moveTask,
    getDefaultColumnId, refetch: fetchData,
  }
}

export type { Badge }
