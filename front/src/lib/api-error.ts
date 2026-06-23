import type { ApiErrorBody } from '@/types/api.types'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

type RtkError = FetchBaseQueryError | SerializedError | undefined

export function getApiErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (!error) return fallback

  if (typeof error === 'string') return error

  const rtkError = error as RtkError
  if (rtkError && 'data' in rtkError && rtkError.data) {
    const body = rtkError.data as ApiErrorBody
    if (Array.isArray(body.message)) return body.message.join(', ')
    if (typeof body.message === 'string') return body.message
  }

  if (error instanceof Error) return error.message

  return fallback
}
