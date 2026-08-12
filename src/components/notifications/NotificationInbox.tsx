import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../contexts/NotificationContext'
import { NeoButton } from '../ui/NeoButton'
import { Sheet } from '../ui/Sheet'

export function NotificationInbox() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()

  const handleOpen = (boardId: string, notificationId: string) => {
    markRead(notificationId)
    setOpen(false)
    navigate(`/board/${boardId}`)
  }

  return (
    <>
      <NeoButton variant="ghost" icon onClick={() => setOpen(true)} title="Уведомления" className="relative">
        <Bell size={18} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="neo-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </NeoButton>

      <Sheet open={open} onClose={() => setOpen(false)} title="Inbox">
        <div className="space-y-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-bold text-neo-accent underline"
            >
              Отметить все прочитанными
            </button>
          )}

          {notifications.length === 0 ? (
            <p className="text-sm text-neo-muted font-medium text-center py-8">Нет уведомлений</p>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleOpen(n.board_id, n.id)}
                className={`neo-notif-item w-full text-left ${!n.read ? 'neo-notif-unread' : ''}`}
              >
                <p className="text-sm font-medium leading-snug">{n.message}</p>
                <p className="text-[10px] text-neo-muted mt-1 font-bold uppercase tracking-wide">
                  {new Date(n.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </p>
              </button>
            ))
          )}
        </div>
      </Sheet>
    </>
  )
}

export function NotificationToast() {
  const { toast, dismissToast, markRead } = useNotifications()
  const navigate = useNavigate()

  if (!toast) return null

  const handleClick = () => {
    markRead(toast.id)
    dismissToast()
    navigate(`/board/${toast.board_id}`)
  }

  return (
    <div className="neo-toast animate-slide-up">
      <button type="button" onClick={handleClick} className="flex-1 text-left min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-neo-accent mb-0.5">Новая активность</p>
        <p className="text-sm font-medium leading-snug">{toast.message}</p>
      </button>
      <NeoButton variant="ghost" icon onClick={dismissToast}>
        <X size={16} strokeWidth={2.5} />
      </NeoButton>
    </div>
  )
}
