import { LogOut, User, AtSign, Hash, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MobileLayout } from '../components/layout/MobileLayout'
import { NeoButton } from '../components/ui/NeoButton'
import { useAuth } from '../contexts/AuthContext'

export function SettingsPage() {
  const { user, profile, signOut, isConfigured, loading } = useAuth()

  return (
    <MobileLayout>
      <header className="px-5 pt-8 pb-5">
        <h1 className="neo-display text-2xl font-bold tracking-tight">Профиль</h1>
        <p className="text-xs font-semibold text-neo-muted uppercase tracking-wider mt-0.5">Настройки</p>
      </header>

      <div className="px-5 space-y-4">
        {loading ? (
          <div className="h-36 neo-surface-flat animate-pulse bg-neo-bg" />
        ) : user && profile ? (
          <div className="neo-surface overflow-hidden">
            <div className="p-5 flex items-center gap-4 border-b-2 border-neo-ink">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-14 h-14 rounded-full border-2 border-neo-ink object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 neo-surface-flat flex items-center justify-center bg-neo-yellow text-xl font-bold shrink-0">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="neo-display font-bold">{profile.display_name ?? profile.username}</p>
                <p className="text-sm font-bold text-neo-accent">@{profile.username}</p>
              </div>
              <Link to="/settings/profile">
                <NeoButton variant="secondary" icon title="Редактировать">
                  <Pencil size={16} strokeWidth={2.5} />
                </NeoButton>
              </Link>
            </div>

            <div className="divide-y-2 divide-neo-ink">
              <div className="flex items-center gap-3 px-5 py-3.5">
                <AtSign size={16} strokeWidth={2.5} className="text-neo-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="neo-label">Никнейм</p>
                  <p className="text-sm font-bold truncate">@{profile.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Hash size={16} strokeWidth={2.5} className="text-neo-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="neo-label">ID профиля</p>
                  <p className="text-xs font-mono font-medium break-all">{profile.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <User size={16} strokeWidth={2.5} className="text-neo-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="neo-label">Email</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="neo-surface p-8 text-center">
            <User size={40} strokeWidth={2} className="mx-auto text-neo-muted mb-3" />
            <p className="neo-display font-bold text-sm mb-4">Вы не авторизованы</p>
            <div className="flex gap-3 justify-center">
              <Link to="/auth/signin">
                <NeoButton>Войти</NeoButton>
              </Link>
              <Link to="/auth/signup">
                <NeoButton variant="secondary">Регистрация</NeoButton>
              </Link>
            </div>
          </div>
        )}

        {!isConfigured && (
          <div className="neo-surface-flat p-4 bg-neo-yellow">
            <p className="neo-display text-sm font-bold">Сервер не запущен</p>
            <p className="text-xs font-medium mt-1">
              Запустите бэкенд: <code className="font-mono">npm run dev:all</code>
            </p>
          </div>
        )}

        {user && (
          <NeoButton variant="danger" className="w-full" onClick={signOut}>
            <LogOut size={18} strokeWidth={2.5} />
            Выйти
          </NeoButton>
        )}

        <p className="text-center text-xs font-bold text-neo-muted uppercase tracking-wider pt-2 pb-4">
          TaskFlow · PWA
        </p>
      </div>
    </MobileLayout>
  )
}
