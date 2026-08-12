import { LayoutGrid, Settings, LogIn } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="neo-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto px-3 py-1.5">
        <NavLink to="/" end className={({ isActive }) => `neo-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutGrid size={22} strokeWidth={2.5} />
          <span>Доски</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `neo-nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={22} strokeWidth={2.5} />
          <span>Профиль</span>
        </NavLink>
        <NavLink to="/auth/signin" className={({ isActive }) => `neo-nav-link ${isActive ? 'active' : ''}`}>
          <LogIn size={22} strokeWidth={2.5} />
          <span>Вход</span>
        </NavLink>
      </div>
    </nav>
  )
}
