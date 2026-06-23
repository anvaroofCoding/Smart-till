export type ScannerMode = 'keyboard-wedge' | 'socket' | 'hybrid'

export interface BarcodeScanResult {
  barcode: string
  timestamp: string
  source: ScannerMode
  deviceId?: string
}

export interface ScannerConfig {
  deviceId: string
  debounceMs: number
  minLength: number
  suffixKeys: string[]
  mode: ScannerMode
}

export interface ScannerCallbacks {
  onScan: (result: BarcodeScanResult) => void
  onError?: (error: Error) => void
}
