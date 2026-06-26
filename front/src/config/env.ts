function readEnv(key: keyof ImportMetaEnv, fallback?: string): string {
  const value = import.meta.env[key]
  if (value !== undefined && value !== '') return value
  if (fallback !== undefined) return fallback
  throw new Error(`Missing required environment variable: ${key}`)
}

function readNumberEnv(key: keyof ImportMetaEnv, fallback: number): number {
  const raw = import.meta.env[key]
  if (raw === undefined || raw === '') return fallback
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`)
  }
  return parsed
}

export function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured && configured !== '/api') {
    return configured
  }
  return '/api'
}

function resolveWsUrl(): string {
  const configured = import.meta.env.VITE_WS_URL
  if (configured !== undefined && configured.trim() !== '') {
    return configured
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://localhost:3000'
}

export const env = {
  apiUrl: resolveApiUrl(),
  wsUrl: resolveWsUrl(),
  inventoryPollIntervalMs: readNumberEnv('VITE_INVENTORY_POLL_INTERVAL_MS', 5000),
  scanner: {
    deviceId: readEnv('VITE_SCANNER_DEVICE_ID', 'scanner-01'),
    debounceMs: readNumberEnv('VITE_SCANNER_DEBOUNCE_MS', 100),
    minLength: readNumberEnv('VITE_SCANNER_MIN_LENGTH', 4),
  },
  printer: {
    labelWidthMm: readNumberEnv('VITE_PRINTER_DEFAULT_LABEL_WIDTH_MM', 50),
    labelHeightMm: readNumberEnv('VITE_PRINTER_DEFAULT_LABEL_HEIGHT_MM', 30),
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
