import { useState, useEffect, useCallback } from 'react'
import { boardsApi } from '../lib/api'
import { saveBoardListCache, loadBoardListCache, isOnline } from '../lib/offlineStore'
import type { Board, BoardType } from '../types'
import { normalizeBoard } from '../types'

export function useBoards(userId: string | undefined) {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const fetchBoards = useCallback(async () => {
    setError(null)

    if (!userId) {
      setBoards([])
      setLoading(false)
      return
    }

    if (!isOnline()) {
      const cached = await loadBoardListCache(userId)
      if (cached) {
        setBoards(cached.map(b => normalizeBoard(b as Board & { type?: string })))
        setIsOffline(true)
      } else {
        setError('Нет подключения')
        setBoards([])
      }
      setLoading(false)
      return
    }

    try {
      const data = await boardsApi.list()
      const normalized = data.map(b => normalizeBoard(b))
      setBoards(normalized)
      setIsOffline(false)
      await saveBoardListCache(userId, normalized)
    } catch (e) {
      const cached = await loadBoardListCache(userId)
      if (cached) {
        setBoards(cached.map(b => normalizeBoard(b as Board & { type?: string })))
        setIsOffline(true)
        setError(null)
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить доски')
        setBoards([])
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchBoards() }, [fetchBoards])

  useEffect(() => {
    const onOnline = () => { setIsOffline(false); fetchBoards() }
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [fetchBoards])

  const createBoard = async (title: string, board_type: BoardType = 'kanban') => {
    if (!userId) throw new Error('Войдите в аккаунт, чтобы создать доску')
    const board = await boardsApi.create(title, board_type)
    const next = [normalizeBoard(board), ...boards]
    setBoards(next)
    saveBoardListCache(userId, next).catch(() => {})
    return board
  }

  const deleteBoard = async (boardId: string) => {
    await boardsApi.delete(boardId)
    const next = boards.filter(b => b.id !== boardId)
    setBoards(next)
    if (userId) saveBoardListCache(userId, next).catch(() => {})
  }

  return { boards, loading, error, isOffline, createBoard, deleteBoard, refetch: fetchBoards }
}
