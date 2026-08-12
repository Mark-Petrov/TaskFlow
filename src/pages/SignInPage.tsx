import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { MobileLayout } from '../components/layout/MobileLayout'
import { NeoButton } from '../components/ui/NeoButton'
import { NeoInput, NeoLabel } from '../components/ui/NeoInput'
import { useAuth } from '../contexts/AuthContext'

export function SignInPage() {
  const navigate = useNavigate()
  const { signIn, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError(err)
    else navigate('/')
    setLoading(false)
  }

  return (
    <MobileLayout hideNav>
      <div className="px-5 pt-16 pb-8">
        <div className="mb-8">
          <h1 className="neo-display text-3xl font-bold tracking-tight">Вход</h1>
          <p className="text-sm font-medium text-neo-muted mt-1">Добро пожаловать в TaskFlow</p>
        </div>

        {!isConfigured && (
          <div className="mb-6 neo-surface-flat p-3 bg-neo-yellow text-sm font-medium">
            Сервер недоступен. Запустите <code className="font-mono text-xs">npm run dev:all</code>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm font-bold text-neo-red">{error}</p>}

          <NeoButton type="submit" className="w-full" disabled={loading}>
            <LogIn size={18} strokeWidth={2.5} />
            {loading ? 'Вход...' : 'Войти'}
          </NeoButton>
        </form>

        <p className="text-center text-sm font-medium text-neo-muted mt-8">
          Нет аккаунта?{' '}
          <Link to="/auth/signup" className="text-neo-accent font-bold underline underline-offset-2">
            Регистрация
          </Link>
        </p>
      </div>
    </MobileLayout>
  )
}
