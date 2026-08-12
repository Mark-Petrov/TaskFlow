import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'neo-btn-primary',
  secondary: 'neo-btn-secondary',
  danger: 'neo-btn-danger',
  ghost: 'neo-btn-ghost',
}

export function NeoButton({ variant = 'primary', icon, className = '', children, ...props }: NeoButtonProps) {
  return (
    <button
      className={`neo-btn ${variants[variant]} ${icon ? 'neo-btn-icon' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
