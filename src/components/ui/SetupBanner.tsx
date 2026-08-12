import { Link } from 'react-router-dom'
import { Server } from 'lucide-react'

export function SetupBanner() {
  return (
    <div className="neo-surface p-4">
      <div className="flex gap-3">
        <Server size={22} strokeWidth={2.5} className="shrink-0 mt-0.5" />
        <div>
          <p className="neo-display text-sm font-bold">Запустите бэкенд</p>
          <ol className="text-xs font-medium text-neo-muted mt-2 space-y-1.5 list-decimal list-inside">
            <li><code className="font-mono bg-neo-bg px-1 rounded">cd server && npm install</code></li>
            <li><code className="font-mono bg-neo-bg px-1 rounded">cp .env.example .env</code></li>
            <li><code className="font-mono bg-neo-bg px-1 rounded">npm run db:push</code></li>
            <li>Из корня: <code className="font-mono bg-neo-bg px-1 rounded">npm run dev:all</code></li>
          </ol>
          <Link to="/auth/signup" className="inline-block mt-3 text-xs font-bold text-neo-accent underline">
            Зарегистрироваться после запуска →
          </Link>
        </div>
      </div>
    </div>
  )
}
