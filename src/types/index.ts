export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at?: string
}

export interface Badge {
  text: string
  bg_color: string
}

export type BoardType = 'kanban' | 'simple' | 'shopping'

export interface Board {
  id: string
  title: string
  owner_id: string
  board_type: BoardType
  created_at: string
  updated_at: string
}

export interface Column {
  id: string
  board_id: string
  title: string
  position: number
  created_at?: string
}

export interface Task {
  id: string
  column_id: string
  board_id: string
  title: string
  description: string | null
  position: number
  bg_color: string
  border_color: string
  border_style: string
  badges: Badge[]
  is_completed: boolean
  completed_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at?: string
  updated_at?: string
}

export interface BoardMember {
  id: string
  board_id: string
  user_id: string
  role: string
  created_at?: string
  profile?: Profile
}

export interface AppNotification {
  id: string
  user_id: string
  board_id: string
  task_id: string | null
  actor_id: string | null
  type: 'task_created' | 'task_completed' | 'task_updated'
  message: string
  read: boolean
  created_at: string
}

export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double'

export const BORDER_STYLES: { value: BorderStyle; label: string; width: string }[] = [
  { value: 'none', label: 'Без рамки', width: '0' },
  { value: 'solid', label: 'Сплошная', width: '2px' },
  { value: 'dashed', label: 'Пунктир', width: '2px' },
  { value: 'dotted', label: 'Точки', width: '2px' },
  { value: 'double', label: 'Двойная', width: '4px' },
]

export const PRESET_COLORS = [
  '#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3',
  '#ede9fe', '#ffedd5', '#fee2e2', '#f0fdf4', '#ecfdf5',
]

export const BADGE_COLORS = [
  '#ff4757', '#0066ff', '#ffe566', '#2ed573', '#111111',
  '#ff6b35', '#8b5cf6', '#6b6b6b',
]

export function normalizeBoardType(raw?: string | null): BoardType {
  if (raw === 'list' || raw === 'simple') return 'simple'
  if (raw === 'shopping') return 'shopping'
  return 'kanban'
}

export function getBoardType(board: { board_type?: string; type?: string } | null | undefined): BoardType {
  if (!board) return 'kanban'
  return normalizeBoardType(board.board_type ?? (board as { type?: string }).type)
}

export function isListLikeBoard(type: BoardType): boolean {
  return type === 'simple' || type === 'shopping'
}

export function sortListTasks(tasks: Task[]): Task[] {
  const active = tasks.filter(t => !t.is_completed).sort((a, b) => a.position - b.position)
  const done = tasks.filter(t => t.is_completed).sort((a, b) =>
    (a.completed_at ?? '').localeCompare(b.completed_at ?? '')
  )
  return [...active, ...done]
}

export function normalizeTask(raw: Task): Task {
  return {
    ...raw,
    badges: raw.badges ?? [],
    is_completed: Boolean(raw.is_completed),
    completed_at: raw.completed_at ?? null,
    created_by: raw.created_by ?? null,
    updated_by: raw.updated_by ?? null,
  }
}

export function normalizeBoard(raw: Board & { type?: string }): Board {
  return {
    ...raw,
    board_type: getBoardType(raw),
  }
}
