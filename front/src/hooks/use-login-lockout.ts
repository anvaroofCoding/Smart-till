import { useCallback, useEffect, useState } from 'react'

const LOCKOUT_STORAGE_KEY = 'login-lockout-until'
const FAIL_COUNT_PREFIX = 'login-fail-count:'
const MAX_FAILED_ATTEMPTS = 3
const LOCKOUT_SECONDS = 20

function readStoredLockoutUntil(): number | null {
  const raw = sessionStorage.getItem(LOCKOUT_STORAGE_KEY)
  if (!raw) return null

  const until = Number.parseInt(raw, 10)
  if (Number.isNaN(until) || until <= Date.now()) {
    sessionStorage.removeItem(LOCKOUT_STORAGE_KEY)
    return null
  }

  return until
}

function storeLockoutUntil(until: number) {
  sessionStorage.setItem(LOCKOUT_STORAGE_KEY, String(until))
}

function clearStoredLockout() {
  sessionStorage.removeItem(LOCKOUT_STORAGE_KEY)
}

export function useLoginLockout() {
  const [lockedUntil, setLockedUntil] = useState<number | null>(() =>
    readStoredLockoutUntil(),
  )
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const until = readStoredLockoutUntil()
    return until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0
  })

  const isLockedOut = lockedUntil !== null && lockedUntil > Date.now()

  const startLockout = useCallback((retryAfterSeconds: number) => {
    const until = Date.now() + Math.max(1, retryAfterSeconds) * 1000
    storeLockoutUntil(until)
    setLockedUntil(until)
    setSecondsLeft(Math.max(1, retryAfterSeconds))
  }, [])

  useEffect(() => {
    if (!lockedUntil) return

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
      setSecondsLeft(remaining)

      if (remaining <= 0) {
        clearStoredLockout()
        setLockedUntil(null)
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [lockedUntil])

  return {
    isLockedOut,
    secondsLeft,
    startLockout,
  }
}

function failureCountKey(login: string): string {
  return `${FAIL_COUNT_PREFIX}${login.trim().toLowerCase()}`
}

export function recordLoginFailure(login: string): number | null {
  const key = failureCountKey(login)
  const nextCount = (Number.parseInt(sessionStorage.getItem(key) ?? '0', 10) || 0) + 1
  sessionStorage.setItem(key, String(nextCount))

  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    sessionStorage.removeItem(key)
    return LOCKOUT_SECONDS
  }

  return null
}

export function clearLoginFailures(login: string) {
  sessionStorage.removeItem(failureCountKey(login))
}

export function getLoginRetryAfterSeconds(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null

  const readRetry = (value: unknown): number | null => {
    if (!value || typeof value !== 'object') return null
    const retryAfterSeconds = (value as { retryAfterSeconds?: unknown })
      .retryAfterSeconds
    if (typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
      return Math.ceil(retryAfterSeconds)
    }
    return null
  }

  const fromData = readRetry('data' in error ? error.data : null)
  if (fromData) return fromData

  const fromBody = readRetry(error)
  if (fromBody) return fromBody

  if ('status' in error && error.status === 429) {
    return 20
  }

  return null
}
