import { useState, useEffect } from 'react'
import { UserPlus, X, Crown } from 'lucide-react'
import { membersApi } from '../../lib/api'
import type { BoardMember, Profile } from '../../types'
import { Sheet } from '../ui/Sheet'
import { NeoButton } from '../ui/NeoButton'
import { NeoInput } from '../ui/NeoInput'

interface MembersSheetProps {
  open: boolean
  onClose: () => void
  boardId: string
}

export function MembersSheet({ open, onClose, boardId }: MembersSheetProps) {
  const [members, setMembers] = useState<(BoardMember & { profile: Profile })[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchMembers = async () => {
    try {
      const data = await membersApi.list(boardId)
      setMembers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить участников')
    }
  }

  useEffect(() => {
    if (open) {
      setError('')
      fetchMembers()
    }
  }, [open, boardId])

  const addMember = async () => {
    if (!query.trim()) return
    setError('')
    setLoading(true)
    try {
      await membersApi.add(boardId, query.trim())
      await fetchMembers()
      setQuery('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить участника')
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (memberId === 'owner') return
    try {
      await membersApi.remove(boardId, memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить участника')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Участники">
      <div className="space-y-4">
        <div className="flex gap-2">
          <NeoInput
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="@username или ID"
            className="flex-1"
            onKeyDown={e => e.key === 'Enter' && addMember()}
          />
          <NeoButton onClick={addMember} disabled={loading || !query.trim()}>
            <UserPlus size={16} strokeWidth={2.5} />
          </NeoButton>
        </div>

        {error && <p className="text-sm font-bold text-neo-red">{error}</p>}

        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="neo-surface-flat flex items-center justify-between p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 neo-surface-flat flex items-center justify-center bg-neo-accent text-white text-sm font-bold shrink-0">
                  {(member.profile?.username ?? '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">
                    @{member.profile?.username}
                    {member.role === 'owner' && <Crown size={12} className="inline ml-1 text-neo-yellow" fill="currentColor" />}
                  </p>
                  <p className="text-xs font-mono text-neo-muted">{member.profile?.id?.slice(0, 8)}...</p>
                </div>
              </div>
              {member.role !== 'owner' && (
                <NeoButton variant="ghost" icon onClick={() => removeMember(member.id)}>
                  <X size={16} strokeWidth={2.5} />
                </NeoButton>
              )}
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
