import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { MobileLayout } from '../components/layout/MobileLayout'
import { NeoButton } from '../components/ui/NeoButton'
import { NeoInput, NeoLabel } from '../components/ui/NeoInput'
import { useAuth } from '../contexts/AuthContext'

export function SignUpPage() {
  const navigate = useNavigate()
  const { signUp, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanUsername = username.replace(/^@/, '').toLowerCase()
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      setError('Никнейм: 3–20 символов, только буквы, цифры и _')
      return
    }

    setLoading(true)
    const { error: err } = await signUp(email, password, cleanUsername, displayName || cleanUsername)
    if (err) setError(err)
    else navigate('/')
    setLoading(false)
  }

  return (
    <MobileLayout hideNav>
      <div className="px-5 pt-16 pb-8">
        <div className="mb-8">
          <h1 className="neo-display text-3xl font-bold tracking-tight">Регистрация</h1>
          <p className="text-sm font-medium text-neo-muted mt-1">Создайте аккаунт TaskFlow</p>
        </div>

        {!isConfigured && (
          <div className="mb-6 neo-surface-flat p-3 bg-neo-yellow text-sm font-medium">
            Сервер недоступен. Запустите <code className="font-mono text-xs">npm run dev:all</code>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <NeoLabel>Никнейм *</NeoLabel>
            <NeoInput
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              required
            />
            <p className="text-xs font-medium text-neo-muted mt-1.5">Уникальный @username для совместных досок</p>
          </div>

          <div>
            <NeoLabel>Имя</NeoLabel>
            <NeoInput
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Как вас зовут"
            />
          </div>

          <div>
            <NeoLabel>Email</NeoLabel>
            <NeoInput
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <NeoLabel>Пароль</NeoLabel>
            <NeoInput
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm font-bold text-neo-red">{error}</p>}

          <NeoButton type="submit" className="w-full" disabled={loading}>
            <UserPlus size={18} strokeWidth={2.5} />
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </NeoButton>
        </form>

        <p className="text-center text-sm font-medium text-neo-muted mt-8">
          Уже есть аккаунт?{' '}
          <Link to="/auth/signin" className="text-neo-accent font-bold underline underline-offset-2">
            Войти
          </Link>
        </p>
      </div>
    </MobileLayout>
  )
}
