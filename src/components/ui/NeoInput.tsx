import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function NeoInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`neo-input ${className}`} {...props} />
}

export function NeoTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`neo-input neo-textarea ${className}`} {...props} />
}

export function NeoLabel({ children }: { children: React.ReactNode }) {
  return <label className="neo-label block mb-1.5">{children}</label>
}
