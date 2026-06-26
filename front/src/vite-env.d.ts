/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_PUBLIC_APP_URL?: string
  readonly VITE_INVENTORY_POLL_INTERVAL_MS: string
  readonly VITE_SCANNER_DEVICE_ID: string
  readonly VITE_SCANNER_DEBOUNCE_MS: string
  readonly VITE_SCANNER_MIN_LENGTH: string
  readonly VITE_PRINTER_DEFAULT_LABEL_WIDTH_MM: string
  readonly VITE_PRINTER_DEFAULT_LABEL_HEIGHT_MM: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}