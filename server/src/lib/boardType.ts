export type BoardTypeValue = 'kanban' | 'simple' | 'shopping'

export function normalizeBoardType(raw?: string | null): BoardTypeValue {
  if (raw === 'list' || raw === 'simple') return 'simple'
  if (raw === 'shopping') return 'shopping'
  return 'kanban'
}

export function isListLikeType(type: BoardTypeValue): boolean {
  return type === 'simple' || type === 'shopping'
}
