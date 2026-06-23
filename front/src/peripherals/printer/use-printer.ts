import { useCallback, useState } from 'react'
import { printerService } from './printer.service'
import type { PrintLabelData, PrintOptions, PrintResult } from './printer.types'

export function usePrinter() {
  const [isPrinting, setIsPrinting] = useState(false)
  const [lastResult, setLastResult] = useState<PrintResult | null>(null)

  const printLabel = useCallback(
    async (data: PrintLabelData, options?: PrintOptions) => {
      setIsPrinting(true)
      try {
        const result = await printerService.printLabel(data, options)
        setLastResult(result)
        return result
      } finally {
        setIsPrinting(false)
      }
    },
    [],
  )

  return {
    printLabel,
    isPrinting,
    lastResult,
  }
}
