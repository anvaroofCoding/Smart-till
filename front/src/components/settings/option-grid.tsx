import { cn } from '@/lib/utils'

interface OptionGridProps<T extends string> {
  options: { id: T; label: string; swatch?: string }[]
  value: T
  onChange: (value: T) => void
  columns?: 2 | 3 | 4 | 5 | 7
}

export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 4,
}: OptionGridProps<T>) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    7: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7',
  }[columns]

  return (
    <div className={cn('grid gap-2', gridClass)}>
      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              selected
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : 'border-border bg-background hover:bg-accent',
            )}
          >
            {option.swatch && (
              <span
                className="size-4 shrink-0 rounded-full border border-border"
                style={{ background: option.swatch }}
              />
            )}
            <span className="truncate font-medium">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
