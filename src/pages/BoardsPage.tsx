import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, Kanban, AlertCircle, List, LayoutGrid, ShoppingCart } from 'lucide-react'
import { MobileLayout } from '../components/layout/MobileLayout'
import { Sheet } from '../components/ui/Sheet'
import { NeoButton } from '../components/ui/NeoButton'
import { NeoInput, NeoLabel } from '../components/ui/NeoInput'
import { SetupBanner } from '../components/ui/SetupBanner'
import { OfflineBanner } from '../components/ui/OfflineBanner'
import { BoardModeSwitcher } from '../components/board/BoardModeSwitcher'
import { NotificationInbox } from '../components/notifications/NotificationInbox'
import { useAuth } from '../contexts/AuthContext'
import { useBoards } from '../hooks/useBoards'
import type { BoardType } from '../types'
import { getBoardType } from '../types'

export function BoardsPage() {
  const navigate = useNavigate()
  const { user, isConfigured, loading: authLoading } = useAuth()
  const { boards, loading, error, isOffline, createBoard, deleteBoard } = useBoards(user?.id)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<BoardType>('kanban')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const openCreate = () => {
    if (!isConfigured) return
    if (!user) {
      navigate('/auth/signin')
      return
    }
    setCreateError('')
    setShowCreate(true)
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const board = await createBoard(newTitle.trim(), newType)
      setNewTitle('')
      setNewType('kanban')
      setShowCreate(false)
      navigate(`/board/${board.id}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Не удалось создать доску')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (boardId: string) => {
    try {
      await deleteBoard(boardId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось удалить доску')
    }
  }

  return (
    <MobileLayout>
      <header className="px-5 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 neo-surface flex items-center justify-center bg-neo-yellow">
              <Kanban size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="neo-display text-2xl font-bold tracking-tight">TaskFlow</h1>
              <p className="text-xs font-semibold text-neo-muted uppercase tracking-wider mt-0.5">Канбан-доски</p>
            </div>
          </div>
          {isConfigured && user && <NotificationInbox />}
        </div>
      </header>

      <div className="px-5 space-y-4">
        {!isConfigured && <SetupBanner />}
        <OfflineBanner show={isOffline && isConfigured} />

        {isConfigured && !authLoading && !user && (
          <div className="neo-surface-flat p-4 bg-neo-yellow">
            <p className="neo-display text-sm font-bold">Войдите в аккаунт</p>
            <p className="text-xs font-medium mt-1 mb-3">Доски сохраняются на сервере и привязаны к вашему профилю</p>
            <Link to="/auth/signin">
              <NeoButton>Войти</NeoButton>
            </Link>
          </div>
        )}

        {error && (
          <div className="neo-surface-flat p-4 border-neo-red flex gap-3">
            <AlertCircle size={20} className="text-neo-red shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading || authLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-[72px] neo-surface-flat animate-pulse bg-neo-bg" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="neo-surface p-8 text-center">
            <Kanban size={40} strokeWidth={2} className="mx-auto text-neo-muted mb-3" />
            <p className="neo-display font-bold">Пока нет досок</p>
            <p className="text-xs text-neo-muted mt-1">
              {user ? 'Создайте первую доску' : 'Войдите и создайте первую доску'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {boards.map(board => (
              <div key={board.id} className="neo-board-item group">
                <button
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="flex-1 flex items-center gap-3 p-4 text-left min-h-[72px]"
                >
                  <div className="w-11 h-11 neo-surface-flat flex items-center justify-center bg-neo-accent text-white text-sm font-bold shrink-0">
                    {board.title[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="neo-display text-sm font-bold truncate">{board.title}</p>
                    <p className="text-xs text-neo-muted font-medium mt-0.5 flex items-center gap-1.5">
                      {(() => {
                        const t = getBoardType(board)
                        if (t === 'shopping') return <><ShoppingCart size={10} /> Покупки</>
                        if (t === 'simple') return <><List size={10} /> Список</>
                        return <><LayoutGrid size={10} /> Kanban</>
                      })()}
                      · {new Date(board.updated_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <ChevronRight size={18} strokeWidth={2.5} className="text-neo-muted shrink-0" />
                </button>
                <button
                  onClick={() => handleDelete(board.id)}
                  className="p-3 mr-2 text-neo-muted hover:text-neo-red transition-colors"
                  aria-label="Удалить доску"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={openCreate}
          disabled={!isConfigured}
          className="w-full flex items-center justify-center gap-2 min-h-[52px] border-2 border-dashed border-neo-ink rounded-[10px] text-sm font-bold text-neo-muted hover:text-neo-ink hover:bg-neo-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={18} strokeWidth={2.5} />
          Новая доска
        </button>
      </div>

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Новая доска">
        <div className="space-y-4">
          <div>
            <NeoLabel>Название</NeoLabel>
            <NeoInput
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Моя доска"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <NeoLabel>Тип</NeoLabel>
            <BoardModeSwitcher type={newType} onChange={setNewType} />
          </div>
          {createError && (
            <p className="text-sm font-bold text-neo-red">{createError}</p>
          )}
          <NeoButton className="w-full" onClick={handleCreate} disabled={!newTitle.trim() || creating}>
            {creating ? 'Создание...' : 'Создать'}
          </NeoButton>
        </div>
      </Sheet>
    </MobileLayout>
  )
}
