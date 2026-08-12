import { X } from 'lucide-react'
import type { ReactNode, MouseEvent } from 'react'
import { NeoButton } from './NeoButton'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

function stopPropagation(e: MouseEvent) {
  e.stopPropagation()
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="neo-sheet-overlay animate-fade-in" aria-hidden />
      <div className="neo-sheet animate-slide-up" onClick={stopPropagation}>
        <div className="neo-sheet-header">
          {title && <h2 className="neo-sheet-title">{title}</h2>}
          <NeoButton variant="ghost" icon onClick={onClose} aria-label="Закрыть">
            <X size={20} strokeWidth={2.5} />
          </NeoButton>
        </div>
        <div className="neo-sheet-body">{children}</div>
      </div>
    </div>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="neo-sheet-overlay animate-fade-in" aria-hidden />
      <div
        className="neo-surface relative z-[1] w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={stopPropagation}
      >
        <div className="neo-sheet-header">
          {title && <h2 className="neo-sheet-title">{title}</h2>}
          <NeoButton variant="ghost" icon onClick={onClose} aria-label="Закрыть">
            <X size={20} strokeWidth={2.5} />
          </NeoButton>
        </div>
        <div className="neo-sheet-body">{children}</div>
      </div>
    </div>
  )
}
