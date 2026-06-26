import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import { renderBarcodeSvg } from '@/lib/barcode'

interface ProductBarcodeProps {
  value?: string | null
  height?: number
  className?: string
  showValue?: boolean
}

function normalizeBarcodeValue(value?: string | null): string {
  return value?.trim() ?? ''
}

export function ProductBarcode({
  value,
  height = 48,
  className,
  showValue = true,
}: ProductBarcodeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const normalizedValue = normalizeBarcodeValue(value)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (!normalizedValue) {
      container.innerHTML = ''
      return
    }

    container.innerHTML = renderBarcodeSvg(normalizedValue, {
      height,
      displayValue: showValue,
    })
  }, [normalizedValue, height, showValue])

  if (!normalizedValue) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  return (
    <div
      ref={containerRef}
      className={cn('inline-flex max-w-full overflow-hidden', className)}
      aria-label={`Barkod: ${normalizedValue}`}
    />
  )
}
