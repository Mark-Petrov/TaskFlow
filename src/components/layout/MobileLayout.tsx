import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface MobileLayoutProps {
  children: ReactNode
  hideNav?: boolean
  className?: string
}

export function MobileLayout({ children, hideNav, className }: MobileLayoutProps) {
  return (
    <div className={`min-h-full flex flex-col max-w-lg mx-auto bg-neo-bg neo-dot-bg ${className ?? ''}`}>
      <main className={`flex-1 flex flex-col min-h-0 ${hideNav ? 'pb-4' : 'pb-[4.5rem]'}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
