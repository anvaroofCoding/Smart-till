import type { ApiErrorBody } from '@/types/api.types'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

type RtkError = FetchBaseQueryError | SerializedError | undefined

const API_MESSAGE_UZ: Record<string, string> = {
  'Invalid credentials': 'Login yoki parol noto\'g\'ri',
  'Account is deactivated': 'Hisob nofaol. Administrator bilan bog\'laning',
  'Authentication required': 'Avtorizatsiya talab qilinadi',
}

function translateApiMessage(message: string): string {
  return API_MESSAGE_UZ[message] ?? message
}

function extractMessage(body: ApiErrorBody): string | null {
  if (Array.isArray(body.message)) return body.message.join(', ')
  if (typeof body.message === 'string') return body.message
  return null
}

export function getApiErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (!error) return fallback

  if (typeof error === 'string') return translateApiMessage(error)

  const directBody = error as ApiErrorBody
  const directMessage = extractMessage(directBody)
  if (directMessage) return translateApiMessage(directMessage)

  const rtkError = error as RtkError
  if (rtkError && 'data' in rtkError && rtkError.data) {
    const body = rtkError.data as ApiErrorBody
    const message = extractMessage(body)
    if (message) return translateApiMessage(message)
  }

  if (error instanceof Error) return translateApiMessage(error.message)

  return fallback
}
