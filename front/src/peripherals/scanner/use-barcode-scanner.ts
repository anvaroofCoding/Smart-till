import { useCallback, useEffect, useRef } from 'react'
import { env } from '@/config/env'
import { CLIENT_EVENTS } from '@/socket/socket-events'
import { useSocket } from '@/socket/hooks/use-socket'
import { barcodeScannerService } from './barcode-scanner.service'
import type { BarcodeScanResult, ScannerConfig } from './scanner.types'

interface UseBarcodeScannerOptions extends Partial<ScannerConfig> {
  enabled?: boolean
  emitToServer?: boolean
  onScan?: (result: BarcodeScanResult) => void
}

export function useBarcodeScanner(options: UseBarcodeScannerOptions = {}) {
  const {
    enabled = true,
    emitToServer = true,
    onScan,
    deviceId = env.scanner.deviceId,
    debounceMs = env.scanner.debounceMs,
    minLength = env.scanner.minLength,
    mode = 'hybrid',
  } = options

  const { socket, isConnected } = useSocket()
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const handleScan = useCallback(
    (result: BarcodeScanResult) => {
      onScanRef.current?.(result)

      if (emitToServer && isConnected) {
        socket.emit(CLIENT_EVENTS.SCANNER_SCAN, {
          barcode: result.barcode,
          timestamp: result.timestamp,
        })
      }
    },
    [emitToServer, isConnected, socket],
  )

  useEffect(() => {
    if (!enabled) return

    barcodeScannerService.start({ onScan: handleScan })

    return () => {
      barcodeScannerService.stop()
    }
  }, [enabled, handleScan, debounceMs, minLength, mode, deviceId])

  useEffect(() => {
    if (!enabled || !isConnected) return

    socket.emit(CLIENT_EVENTS.SCANNER_REGISTER, { deviceId })
  }, [enabled, isConnected, socket, deviceId])

  return {
    isConnected,
    deviceId,
    emitManualScan: (barcode: string) => {
      barcodeScannerService.emitScan(barcode, 'socket')
    },
  }
}
