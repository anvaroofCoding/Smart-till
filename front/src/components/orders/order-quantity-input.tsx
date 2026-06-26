import { useEffect, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { clampOrderQuantity } from '@/lib/warehouse-stock-catalog'
import { cn } from '@/lib/utils'

interface OrderQuantityInputProps {
  value: number
  maxQuantity: number
  minQuantity?: number
  disabled?: boolean
  allowDirectInput?: boolean
  onChange: (quantity: number) => void
  onLimitExceeded?: (maxQuantity: number) => void
  className?: string
}

export function OrderQuantityInput({
  value,
  maxQuantity,
  minQuantity = 1,
  disabled = false,
  allowDirectInput = true,
  onChange,
  onLimitExceeded,
  className,
}: OrderQuantityInputProps) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  function commitQuantity(raw: number) {
    if (maxQuantity <= 0) {
      onLimitExceeded?.(maxQuantity)
      return
    }

    const floored = Math.floor(raw)

    if (!Number.isFinite(raw) || floored < minQuantity) {
      onChange(minQuantity)
      setDraft(String(minQuantity))
      return
    }

    if (floored > maxQuantity) {
      onLimitExceeded?.(maxQuantity)
      if (floored >= 1000) {
        setDraft(String(value))
        return
      }
    }

    const nextQuantity = clampOrderQuantity(raw, maxQuantity)
    onChange(nextQuantity)
    setDraft(String(nextQuantity))
  }

  function handleDecrement() {
    if (disabled || value <= minQuantity) return
    commitQuantity(value - 1)
  }

  function handleIncrement() {
    if (disabled) return
    if (value >= maxQuantity) {
      onLimitExceeded?.(maxQuantity)
      return
    }
    commitQuantity(value + 1)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 shrink-0"
        disabled={disabled || value <= minQuantity}
        onClick={handleDecrement}
        aria-label="Soni kamaytirish"
      >
        <span className="text-sm leading-none font-medium">−</span>
      </Button>
      <Input
        type="number"
        min={minQuantity}
        max={maxQuantity}
        step={1}
        inputMode="numeric"
        className="h-8 w-16 px-1 text-center tabular-nums"
        value={draft}
        disabled={disabled}
        readOnly={!allowDirectInput}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commitQuantity(Number(draft))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 shrink-0"
        disabled={disabled || value >= maxQuantity}
        onClick={handleIncrement}
        aria-label="Soni oshirish"
      >
        <AppIcon name="plus" className="size-3.5" />
      </Button>
    </div>
  )
}
