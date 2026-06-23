import type { ApiErrorBody } from '@/types/api.types'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

type RtkError = FetchBaseQueryError | SerializedError | undefined

const API_MESSAGE_UZ: Record<string, string> = {
  'Invalid credentials': 'Login yoki parol noto\'g\'ri',
  'So\'rov hajmi juda katta (rasm 2 MB dan oshmasligi kerak)': 'So\'rov hajmi juda katta (rasm 2 MB dan oshmasligi kerak)',
  'Internal server error': 'Server xatosi. Keyinroq qayta urinib ko\'ring',
  'Account is deactivated': 'Hisob nofaol. Administrator bilan bog\'laning',
  'Authentication required': 'Avtorizatsiya talab qilinadi',
  'Kategoriya maxsulotlarda ishlatilgan, o\'chirib bo\'lmaydi':
    'Bu kategoriya maxsulotlarda ishlatilgan. Avval maxsulotlarni boshqa kategoriyaga o\'tkazing yoki o\'chiring.',
  'Brend maxsulotlarda ishlatilgan, o\'chirib bo\'lmaydi':
    'Bu brend maxsulotlarda ishlatilgan. Avval maxsulotlarni boshqa brendga o\'tkazing yoki o\'chiring.',
  'Kategoriya topilmadi': 'Kategoriya topilmadi',
  'Brend topilmadi': 'Brend topilmadi',
}

const HTTP_STATUS_UZ: Record<number, string> = {
  400: 'So\'rov noto\'g\'ri. Ma\'lumotlarni tekshirib qayta urinib ko\'ring.',
  401: 'Avtorizatsiya talab qilinadi. Qayta tizimga kiring.',
  403: 'Bu amal uchun ruxsatingiz yo\'q.',
  404: 'So\'ralgan ma\'lumot topilmadi.',
  409: 'Bu amalni bajarib bo\'lmaydi. Ma\'lumot boshqa joyda ishlatilmoqda.',
  413: 'So\'rov hajmi juda katta (rasm 2 MB dan oshmasligi kerak).',
  422: 'Kiritilgan ma\'lumotlar noto\'g\'ri.',
  500: 'Server xatosi. Keyinroq qayta urinib ko\'ring.',
}

function translateApiMessage(message: string): string {
  return API_MESSAGE_UZ[message] ?? message
}

function extractMessage(body: ApiErrorBody): string | null {
  if (Array.isArray(body.message)) return body.message.join(', ')
  if (typeof body.message === 'string') return body.message
  return null
}

function extractStatus(error: unknown, body?: ApiErrorBody | null): number | undefined {
  if (body?.statusCode) return body.statusCode
  if (body?.status) return body.status

  const rtkError = error as RtkError
  if (rtkError && 'status' in rtkError && typeof rtkError.status === 'number') {
    return rtkError.status
  }

  return undefined
}

function isTechnicalMessage(message: string): boolean {
  return (
    /^Cannot (GET|POST|PUT|PATCH|DELETE) /i.test(message) ||
    /^Request failed with status code \d+$/i.test(message) ||
    /^Network Error$/i.test(message) ||
    message.includes('/api/')
  )
}

function humanizeTechnicalMessage(
  message: string,
  status?: number,
  fallback = 'Xatolik yuz berdi',
): string {
  if (/Cannot DELETE.*product-categories/i.test(message)) {
    return 'Kategoriyani o\'chirib bo\'lmadi. Server yangilanmagan bo\'lishi mumkin — backendni qayta ishga tushiring.'
  }

  if (/Cannot DELETE.*product-brands/i.test(message)) {
    return 'Brendni o\'chirib bo\'lmadi. Server yangilanmagan bo\'lishi mumkin — backendni qayta ishga tushiring.'
  }

  if (/Cannot (GET|POST|PUT|PATCH|DELETE) .*\/suppliers\/.*\/ledger/i.test(message)) {
    return 'Yetkazib beruvchi hisoboti hozircha mavjud emas. Backend serverni qayta ishga tushiring.'
  }

  if (/Cannot (GET|POST|PUT|PATCH|DELETE) /i.test(message)) {
    return status && HTTP_STATUS_UZ[status]
      ? HTTP_STATUS_UZ[status]
      : fallback
  }

  if (/^Network Error$/i.test(message)) {
    return 'Internet yoki server bilan bog\'lanish yo\'q. Qayta urinib ko\'ring.'
  }

  if (status && HTTP_STATUS_UZ[status]) {
    return HTTP_STATUS_UZ[status]
  }

  return fallback
}

function normalizeMessage(
  message: string,
  status: number | undefined,
  fallback: string,
): string {
  const translated = translateApiMessage(message.trim())
  if (isTechnicalMessage(translated)) {
    return humanizeTechnicalMessage(translated, status, fallback)
  }
  return translated
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Xatolik yuz berdi',
): string {
  if (!error) return fallback

  if (typeof error === 'string') {
    return normalizeMessage(error, undefined, fallback)
  }

  const directBody = error as ApiErrorBody
  const directMessage = extractMessage(directBody)
  if (directMessage) {
    return normalizeMessage(
      directMessage,
      extractStatus(error, directBody),
      fallback,
    )
  }

  const rtkError = error as RtkError
  if (rtkError && 'data' in rtkError && rtkError.data) {
    const body = rtkError.data as ApiErrorBody
    const message = extractMessage(body)
    if (message) {
      return normalizeMessage(message, extractStatus(error, body), fallback)
    }
  }

  if (error instanceof Error) {
    return normalizeMessage(error.message, undefined, fallback)
  }

  return fallback
}
