import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { notificationsApi } from '../lib/api'
import { connectSocket } from '../lib/socket'
import { useAuth } from './AuthContext'
import type { AppNotification } from '../types'

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  toast: AppNotification | null
  markRead: (id: string) => void
  markAllRead: () => void
  dismissToast: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [toast, setToast] = useState<AppNotification | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user || !isConfigured) {
      setNotifications([])
      return
    }
    try {
      const data = await notificationsApi.list()
      setNotifications(data)
    } catch {
      setNotifications([])
    }
  }, [user, isConfigured])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  useEffect(() => {
    if (!user || !isConfigured) return

    const socket = connectSocket()

    const onNotification = (notification: AppNotification) => {
      setNotifications(prev => [notification, ...prev])
      setToast(notification)
    }

    socket.on('notification', onNotification)
    return () => { socket.off('notification', onNotification) }
  }, [user, isConfigured])

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try { await notificationsApi.markRead(id) } catch { /* noop */ }
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try { await notificationsApi.markAllRead() } catch { /* noop */ }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, toast,
      markRead, markAllRead, dismissToast: () => setToast(null),
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
