import { io, type Socket } from 'socket.io-client'
import { getToken } from './api'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const url = import.meta.env.VITE_WS_URL || undefined
    socket = io(url, {
      autoConnect: false,
      auth: { token: getToken() },
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  s.auth = { token: getToken() }
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect()
}

export function joinBoard(boardId: string) {
  const s = connectSocket()
  s.emit('join-board', boardId)
}

export function leaveBoard(boardId: string) {
  socket?.emit('leave-board', boardId)
}
