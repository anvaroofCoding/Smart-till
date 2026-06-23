import { env } from '@/config/env'
import type {
  BarcodeScanResult,
  ScannerCallbacks,
  ScannerConfig,
} from './scanner.types'

const DEFAULT_SUFFIX_KEYS = ['Enter', 'Tab']

export class BarcodeScannerService {
  private buffer = ''
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private isListening = false
  private config: ScannerConfig
  private callbacks: ScannerCallbacks | null = null

  constructor(config?: Partial<ScannerConfig>) {
    this.config = {
      deviceId: config?.deviceId ?? env.scanner.deviceId,
      debounceMs: config?.debounceMs ?? env.scanner.debounceMs,
      minLength: config?.minLength ?? env.scanner.minLength,
      suffixKeys: config?.suffixKeys ?? DEFAULT_SUFFIX_KEYS,
      mode: config?.mode ?? 'hybrid',
    }
  }

  start(callbacks: ScannerCallbacks) {
    if (this.isListening) return
    this.callbacks = callbacks
    this.isListening = true
    window.addEventListener('keydown', this.handleKeyDown)
  }

  stop() {
    if (!this.isListening) return
    this.isListening = false
    this.callbacks = null
    this.buffer = ''
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  emitScan(barcode: string, source: BarcodeScanResult['source'] = 'socket') {
    const trimmed = barcode.trim()
    if (trimmed.length < this.config.minLength) return

    this.callbacks?.onScan({
      barcode: trimmed,
      timestamp: new Date().toISOString(),
      source,
      deviceId: this.config.deviceId,
    })
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.callbacks) return
    if (this.config.mode === 'socket') return

    const target = event.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }

    if (this.config.suffixKeys.includes(event.key)) {
      if (this.buffer.length >= this.config.minLength) {
        this.emitScan(this.buffer, 'keyboard-wedge')
      }
      this.buffer = ''
      event.preventDefault()
      return
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.buffer += event.key

      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        if (this.buffer.length >= this.config.minLength) {
          this.emitScan(this.buffer, 'keyboard-wedge')
        }
        this.buffer = ''
      }, this.config.debounceMs)
    }
  }
}

export const barcodeScannerService = new BarcodeScannerService()
