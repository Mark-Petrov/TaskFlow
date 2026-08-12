import { useState, useEffect } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import type { Task, Badge, BorderStyle } from '../../types'
import { PRESET_COLORS, BADGE_COLORS, BORDER_STYLES } from '../../types'
import { Sheet } from '../ui/Sheet'
import { NeoButton } from '../ui/NeoButton'
import { NeoInput, NeoTextarea, NeoLabel } from '../ui/NeoInput'
import { ColorSwatch, SegmentControl } from '../ui/NeoControls'

const QUICK_BADGES = [
  { text: 'Срочно', bg_color: '#ff4757' },
  { text: 'Важно', bg_color: '#0066ff' },
  { text: 'Позже', bg_color: '#6b6b6b' },
]

interface TaskEditorProps {
  open: boolean
  onClose: () => void
  task?: Task | null
  columnId?: string
  onSave: (data: {
    title: string
    description: string
    bg_color: string
    border_color: string
    border_style: string
    badges: Badge[]
  }) => void
  onDelete?: () => void
}

export function TaskEditor({ open, onClose, task, onSave, onDelete }: TaskEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [borderColor, setBorderColor] = useState('#111111')
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('solid')
  const [badges, setBadges] = useState<Badge[]>([])
  const [newBadgeText, setNewBadgeText] = useState('')
  const [newBadgeColor, setNewBadgeColor] = useState(BADGE_COLORS[0])

  const resetForm = () => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setBgColor(task.bg_color)
      setBorderColor(task.border_color)
      setBorderStyle(task.border_style as BorderStyle)
      setBadges(task.badges ?? [])
    } else {
      setTitle('')
      setDescription('')
      setBgColor('#ffffff')
      setBorderColor('#111111')
      setBorderStyle('solid')
      setBadges([])
    }
    setNewBadgeText('')
  }

  useEffect(() => {
    if (open) resetForm()
  }, [open, task])

  const addBadge = () => {
    if (!newBadgeText.trim()) return
    setBadges(prev => [...prev, { text: newBadgeText.trim(), bg_color: newBadgeColor }])
    setNewBadgeText('')
  }

  const addQuickBadge = (badge: Badge) => {
    if (badges.some(b => b.text === badge.text)) return
    setBadges(prev => [...prev, badge])
  }

  const removeBadge = (index: number) => {
    setBadges(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description, bg_color: bgColor, border_color: borderColor, border_style: borderStyle, badges })
    onClose()
  }

  const borderWidth = BORDER_STYLES.find(s => s.value === borderStyle)?.width ?? '2px'

  return (
    <Sheet open={open} onClose={onClose} title={task ? 'Редактировать' : 'Новая задача'}>
      <div className="space-y-5 pb-6">
        <div>
          <NeoLabel>Название</NeoLabel>
          <NeoInput
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Что нужно сделать?"
            autoFocus
          />
        </div>

        <div>
          <NeoLabel>Описание</NeoLabel>
          <NeoTextarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Подробности..."
            rows={3}
          />
        </div>

        <div>
          <NeoLabel>Цвет фона</NeoLabel>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <ColorSwatch key={color} color={color} selected={bgColor === color} onClick={() => setBgColor(color)} />
            ))}
          </div>
        </div>

        <div>
          <NeoLabel>Рамка</NeoLabel>
          <div className="flex flex-wrap gap-2 mb-3">
            {['#111111', '#0066ff', '#ff4757', '#2ed573', '#ffe566', '#6b6b6b'].map(color => (
              <ColorSwatch key={color} color={color} selected={borderColor === color} onClick={() => setBorderColor(color)} small />
            ))}
          </div>
          <SegmentControl
            options={BORDER_STYLES.map(s => ({ value: s.value, label: s.label }))}
            value={borderStyle}
            onChange={setBorderStyle}
          />
        </div>

        <div>
          <NeoLabel>Метки</NeoLabel>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_BADGES.map(qb => (
              <button
                key={qb.text}
                type="button"
                onClick={() => addQuickBadge(qb)}
                className="neo-badge opacity-80 hover:opacity-100 active:scale-95 transition-all"
                style={{ backgroundColor: qb.bg_color }}
              >
                + {qb.text}
              </button>
            ))}
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className="neo-badge inline-flex items-center gap-1"
                  style={{ backgroundColor: badge.bg_color }}
                >
                  {badge.text}
                  <button type="button" onClick={() => removeBadge(i)} className="hover:opacity-70">
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <NeoInput
              value={newBadgeText}
              onChange={e => setNewBadgeText(e.target.value)}
              placeholder="Своя метка"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && addBadge()}
            />
            <NeoButton variant="secondary" icon onClick={addBadge}>
              <Plus size={18} strokeWidth={2.5} />
            </NeoButton>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {BADGE_COLORS.map(color => (
              <ColorSwatch
                key={color}
                color={color}
                selected={newBadgeColor === color}
                onClick={() => setNewBadgeColor(color)}
                small
              />
            ))}
          </div>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: bgColor,
            borderColor: borderStyle === 'none' ? 'transparent' : borderColor,
            borderStyle: borderStyle === 'none' ? 'none' : borderStyle,
            borderWidth,
            boxShadow: borderStyle === 'none' ? '3px 3px 0 0 #111' : 'none',
          }}
        >
          <p className="neo-label mb-2">Предпросмотр</p>
          <p className="text-sm font-bold text-neo-ink">{title || 'Название задачи'}</p>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {badges.map((b, i) => (
                <span key={i} className="neo-badge" style={{ backgroundColor: b.bg_color }}>{b.text}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {onDelete && (
            <NeoButton variant="danger" onClick={() => { onDelete(); onClose() }}>
              <Trash2 size={16} strokeWidth={2.5} />
            </NeoButton>
          )}
          <NeoButton className="flex-1" onClick={handleSave} disabled={!title.trim()}>
            {task ? 'Сохранить' : 'Создать'}
          </NeoButton>
        </div>
      </div>
    </Sheet>
  )
}
