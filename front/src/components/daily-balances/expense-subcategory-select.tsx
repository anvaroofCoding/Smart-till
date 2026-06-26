import { useMemo, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ExpenseCategoryRecord } from '@/types/daily-balance.types'

interface ExpenseSubcategorySelectProps {
  options: ExpenseCategoryRecord[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ExpenseSubcategorySelect({
  options,
  value,
  onChange,
  disabled,
}: ExpenseSubcategorySelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedOption = options.find((option) => option.id === value)

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return options
    return options.filter((option) =>
      option.name.toLowerCase().includes(query),
    )
  }, [options, search])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || options.length === 0}
          className={cn(
            'h-9 w-full justify-between font-normal',
            !selectedOption && 'text-muted-foreground',
          )}
        >
          <span className="truncate">
            {selectedOption?.name ?? 'Xarajat turini tanlang'}
          </span>
          <AppIcon name="chevron-down" className="size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="space-y-2">
          <div className="relative">
            <AppIcon
              name="search"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Xarajat turini tanlang"
              className="h-8 pl-8"
              disabled={disabled}
            />
          </div>

          <div className="max-h-56 overflow-auto rounded-md border">
            {filteredOptions.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                Natija topilmadi
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'hover:bg-accent w-full px-3 py-2 text-left text-sm transition-colors',
                    option.id === value && 'bg-accent font-medium',
                  )}
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  {option.name}
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
