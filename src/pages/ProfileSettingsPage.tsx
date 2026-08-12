import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User } from 'lucide-react'
import { MobileLayout } from '../components/layout/MobileLayout'
import { NeoButton } from '../components/ui/NeoButton'
import { NeoInput, NeoLabel } from '../components/ui/NeoInput'
import { useAuth } from '../contexts/AuthContext'
import { profileApi } from '../lib/api'

export function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile, isConfigured } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setUsername(profile.username ?? '')
      setAvatarUrl(profile.avatar_url ?? '')
    }
  }, [profile])

  if (!user || !profile) {
    return (
      <MobileLayout>
        <div className="px-5 pt-8 text-center">
          <User size={40} className="mx-auto text-neo-muted mb-3" />
          <p className="neo-display font-bold text-sm mb-4">Войдите, чтобы редактировать профиль</p>
          <Link to="/auth/signin"><NeoButton>Войти</NeoButton></Link>
        </div>
      </MobileLayout>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await profileApi.update({
        display_name: displayName.trim(),
        username: username.trim(),
        avatar_url: avatarUrl.trim() || null,
      })
      await refreshProfile()
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const avatarPreview = avatarUrl.trim() || null
  const initial = (displayName || username)[0]?.toUpperCase() ?? '?'

  return (
    <MobileLayout>
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <NeoButton variant="ghost" icon onClick={() => navigate('/settings')}>
            <ArrowLeft size={20} strokeWidth={2.5} />
          </NeoButton>
          <div>
            <h1 className="neo-display text-xl font-bold tracking-tight">Настройки профиля</h1>
            <p className="text-xs font-semibold text-neo-muted uppercase tracking-wider mt-0.5">Редактирование</p>
          </div>
        </div>
      </header>

      <div className="px-5 pb-8 space-y-5">
        <div className="flex flex-col items-center gap-3 py-2">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt=""
              className="w-20 h-20 rounded-full border border-neo-ink object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-neo-yellow border border-neo-ink text-2xl font-bold">
              {initial}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <NeoLabel>Отображаемое имя</NeoLabel>
            <NeoInput
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <NeoLabel>Никнейм</NeoLabel>
            <NeoInput
              value={username}
              onChange={e => setUsername(e.target.value.replace(/^@/, ''))}
              placeholder="username"
            />
            <p className="text-xs text-neo-muted mt-1">3–20 символов: буквы, цифры, _</p>
          </div>

          <div>
            <NeoLabel>Аватар (URL)</NeoLabel>
            <NeoInput
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {error && (
          <p className="text-sm font-bold text-neo-red">{error}</p>
        )}
        {success && (
          <p className="text-sm font-bold text-green-700">Профиль сохранён</p>
        )}

        <NeoButton
          className="w-full"
          onClick={handleSave}
          disabled={saving || !isConfigured || !displayName.trim() || !username.trim()}
        >
          <Save size={18} strokeWidth={2.5} />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </NeoButton>
      </div>
    </MobileLayout>
  )
}
