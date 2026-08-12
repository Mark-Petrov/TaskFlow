interface OfflineBannerProps {
  show: boolean
}

export function OfflineBanner({ show }: OfflineBannerProps) {
  if (!show) return null

  return (
    <div className="mx-4 mt-2 neo-surface-flat px-3 py-2 bg-neo-yellow text-xs font-bold text-center">
      Офлайн — показаны сохранённые данные
    </div>
  )
}
