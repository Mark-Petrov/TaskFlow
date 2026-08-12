interface ColorSwatchProps {
  color: string
  selected: boolean
  onClick: () => void
  small?: boolean
}

export function ColorSwatch({ color, selected, onClick, small }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`neo-swatch ${small ? 'neo-swatch-sm' : ''} ${selected ? 'selected' : ''}`}
      style={{ backgroundColor: color }}
      aria-label={`Цвет ${color}`}
    />
  )
}

interface SegmentControlProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function SegmentControl<T extends string>({ options, value, onChange }: SegmentControlProps<T>) {
  return (
    <div className="neo-segment">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`neo-segment-btn ${value === opt.value ? 'selected' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
