const API_BASE = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'taskflow_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(body.error || 'Ошибка запроса', res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const authApi = {
  register: (data: { email: string; password: string; username: string; display_name?: string }) =>
    api<{ token: string; user: import('../types').Profile & { email: string } }>('/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    api<{ token: string; user: import('../types').Profile & { email: string } }>('/auth/login', {
      method: 'POST', body: JSON.stringify(data),
    }),
  me: () => api<{ user: import('../types').Profile & { email: string } }>('/auth/me'),
}

export const profileApi = {
  update: (data: { display_name?: string; username?: string; avatar_url?: string | null }) =>
    api<{ user: import('../types').Profile & { email: string } }>('/profile', {
      method: 'PUT', body: JSON.stringify(data),
    }),
}

export const boardsApi = {
  list: () => api<import('../types').Board[]>('/boards'),
  get: (id: string) => api<import('../types').Board>(`/boards/${id}`),
  create: (title: string, board_type: import('../types').BoardType) =>
    api<import('../types').Board>('/boards', { method: 'POST', body: JSON.stringify({ title, board_type }) }),
  update: (id: string, data: { title?: string; board_type?: import('../types').BoardType }) =>
    api<import('../types').Board>(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api<{ ok: boolean }>(`/boards/${id}`, { method: 'DELETE' }),
}

export const columnsApi = {
  list: (boardId: string) => api<import('../types').Column[]>(`/boards/${boardId}/columns`),
  create: (boardId: string, title: string) =>
    api<import('../types').Column>(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify({ title }) }),
  update: (boardId: string, columnId: string, title: string) =>
    api<import('../types').Column>(`/boards/${boardId}/columns/${columnId}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  delete: (boardId: string, columnId: string) =>
    api<{ ok: boolean }>(`/boards/${boardId}/columns/${columnId}`, { method: 'DELETE' }),
}

export const tasksApi = {
  list: (boardId: string) => api<import('../types').Task[]>(`/boards/${boardId}/tasks`),
  create: (boardId: string, data: Record<string, unknown>) =>
    api<import('../types').Task>(`/boards/${boardId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  update: (boardId: string, taskId: string, data: Record<string, unknown>) =>
    api<import('../types').Task>(`/boards/${boardId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (boardId: string, taskId: string) =>
    api<{ ok: boolean }>(`/boards/${boardId}/tasks/${taskId}`, { method: 'DELETE' }),
}

export const membersApi = {
  list: (boardId: string) => api<(import('../types').BoardMember & { profile: import('../types').Profile })[]>('/boards/' + boardId + '/members'),
  add: (boardId: string, query: string) =>
    api<import('../types').BoardMember>('/boards/' + boardId + '/members', { method: 'POST', body: JSON.stringify({ query }) }),
  remove: (boardId: string, memberId: string) =>
    api<{ ok: boolean }>(`/boards/${boardId}/members/${memberId}`, { method: 'DELETE' }),
}

export const notificationsApi = {
  list: () => api<import('../types').AppNotification[]>('/notifications'),
  markRead: (id: string) => api<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api<{ ok: boolean }>('/notifications/read-all', { method: 'POST' }),
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
