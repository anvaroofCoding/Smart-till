import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { defaultAppearance } from '@/features/appearance/appearance.defaults'
import { STORAGE_KEY } from '@/features/appearance/appearance-options'
import { applyAppearance } from '@/features/appearance/apply-appearance'
import type { AppearanceSettings } from '@/features/appearance/appearance.types'

interface AppearanceContextValue {
  settings: AppearanceSettings
  updateSettings: (patch: Partial<AppearanceSettings>) => void
  resetSettings: () => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function loadSettings(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAppearance
    return { ...defaultAppearance, ...JSON.parse(raw) }
  } catch {
    return defaultAppearance
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(() => loadSettings())

  useEffect(() => {
    applyAppearance(settings)
  }, [settings])

  const persist = useCallback((next: AppearanceSettings) => {
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<AppearanceSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    [],
  )

  const resetSettings = useCallback(() => {
    persist(defaultAppearance)
  }, [persist])

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  )

  return (
    <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
  )
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error('useAppearance must be used within AppearanceProvider')
  }
  return ctx
}

export function useNotificationsEnabled(): boolean {
  return useAppearance().settings.notificationsEnabled
}

export function useIconLibrary() {
  return useAppearance().settings.iconLibrary
}
