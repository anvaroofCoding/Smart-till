import type { ApiErrorBody } from '@/types/api.types'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

type RtkError = FetchBaseQueryError | SerializedError | undefined

const FIELD_LABELS: Record<string, string> = {
  password: 'Parol',
  login: 'Login',
  email: 'Email',
  phone: 'Telefon',
  firstName: 'Ism',
  lastName: 'Familiya',
  fullName: 'To\'liq ism',
  name: 'Nom',
  code: 'Kod',
  notes: 'Izoh',
  quantity: 'Miqdor',
  unitPrice: 'Narx',
  exchangeRate: 'Valyuta kursi',
  warehouseId: 'Ombor',
  fromWarehouseId: 'Yuboruvchi ombor',
  toWarehouseId: 'Qabul qiluvchi ombor',
  productId: 'Maxsulot',
  supplierId: 'Yetkazib beruvchi',
  categoryId: 'Kategoriya',
  brandId: 'Brend',
  transferDate: 'Sana',
  role: 'Rol',
  position: 'Lavozim',
  barcode: 'Shtrix-kod',
  cardNumber: 'Karta raqami',
  customerPhone: 'Mijoz telefoni',
  customerName: 'Mijoz ismi',
}

const API_MESSAGE_UZ: Record<string, string> = {
  'Invalid credentials': 'Login yoki parol noto\'g\'ri',
  'Invalid or expired token': 'Token yaroqsiz yoki muddati tugagan',
  'Account is deactivated': 'Hisob nofaol. Administrator bilan bog\'laning',
  'Access denied': 'Kirish taqiqlangan',
  'Insufficient permissions': 'Bu amal uchun ruxsat yetarli emas',
  'Internal server error': 'Server xatosi. Keyinroq qayta urinib ko\'ring',
  'User not found': 'Foydalanuvchi topilmadi',
  'Login or email already registered': 'Login yoki email allaqachon ro\'yxatdan o\'tgan',
  'Login already in use': 'Bu login allaqachon band',
  'Email already in use': 'Bu email allaqachon band',
  'Authentication required': 'Avtorizatsiya talab qilinadi',
  'So\'rov hajmi juda katta (rasm 2 MB dan oshmasligi kerak)':
    'So\'rov hajmi juda katta (rasm 2 MB dan oshmasligi kerak)',
  'Kategoriya maxsulotlarda ishlatilgan, o\'chirib bo\'lmaydi':
    'Bu kategoriya maxsulotlarda ishlatilgan. Avval maxsulotlarni boshqa kategoriyaga o\'tkazing yoki o\'chiring.',
  'Brend maxsulotlarda ishlatilgan, o\'chirib bo\'lmaydi':
    'Bu brend maxsulotlarda ishlatilgan. Avval maxsulotlarni boshqa brendga o\'tkazing yoki o\'chiring.',
  'Kategoriya topilmadi': 'Kategoriya topilmadi',
  'Brend topilmadi': 'Brend topilmadi',
}

const HTTP_STATUS_UZ: Record<number, string> = {
  400: 'So\'rov noto\'g\'ri. Ma\'lumotlarni tekshirib qayta urinib ko\'ring.',
  401: 'Login yoki parol noto\'g\'ri',
  403: 'Bu amal uchun ruxsatingiz yo\'q.',
  404: 'So\'ralgan ma\'lumot topilmadi.',
  409: 'Bu amalni bajarib bo\'lmaydi. Ma\'lumot boshqa joyda ishlatilmoqda.',
  413: 'So\'rov hajmi juda katta (rasm 2 MB dan oshmasligi kerak).',
  422: 'Kiritilgan ma\'lumotlar noto\'g\'ri.',
  429: 'Juda ko\'p urinish. Biroz kutib qayta urinib ko\'ring.',
  500: 'Server xatosi. Keyinroq qayta urinib ko\'ring.',
}

function labelField(property: string): string {
  const key = property.split('.').pop() ?? property
  return FIELD_LABELS[key] ?? key
}

function translateValidationMessage(message: string): string {
  const trimmed = message.trim()
  if (!trimmed) return trimmed

  const known = API_MESSAGE_UZ[trimmed]
  if (known) return known

  let match = trimmed.match(/^property (.+) should not exist$/i)
  if (match) {
    return `'${labelField(match[1])}' maydoni ruxsat etilmagan`
  }

  match = trimmed.match(/^(.+) must be longer than or equal to (\d+) characters?$/i)
  if (match) {
    return `${labelField(match[1])} kamida ${match[2]} ta belgidan iborat bo'lishi kerak`
  }

  match = trimmed.match(/^(.+) must be shorter than or equal to (\d+) characters?$/i)
  if (match) {
    return `${labelField(match[1])} ko'pi bilan ${match[2]} ta belgidan iborat bo'lishi kerak`
  }

  match = trimmed.match(/^(.+) must be a string$/i)
  if (match) {
    return `${labelField(match[1])} matn bo'lishi kerak`
  }

  match = trimmed.match(/^(.+) must be a number( conforming to the specified constraints)?$/i)
  if (match) {
    return `${labelField(match[1])} raqam bo'lishi kerak`
  }

  match = trimmed.match(/^(.+) must be an integer number$/i)
  if (match) {
    return `${labelField(match[1])} butun son bo'lishi kerak`
  }

  match = trimmed.match(/^(.+) must be a positive number$/i)
  if (match) {
    return `${labelField(match[1])} musbat son bo'lishi kerak`
  }

  match = trimmed.match(/^(.+) must not be less than ([\d.]+)$/i)
  if (match) {
    return `${labelField(match[1])} ${match[2]} dan kichik bo'lmasligi kerak`
  }

  match = trimmed.match(/^(.+) must not be greater than ([\d.]+)$/i)
  if (match) {
    return `${labelField(match[1])} ${match[2]} dan katta bo'lmasligi kerak`
  }

  match = trimmed.match(/^(.+) must be an email$/i)
  if (match) {
    return `${labelField(match[1])} to'g'ri email manzili bo'lishi kerak`
  }

  match = trimmed.match(/^(.+) must be a mongodb id$/i)
  if (match) {
    return `${labelField(match[1])} identifikatori noto'g'ri`
  }

  match = trimmed.match(/^(.+) should not be empty$/i)
  if (match) {
    return `${labelField(match[1])} bo'sh bo'lmasligi kerak`
  }

  match = trimmed.match(/^(.+) must be one of the following values: (.+)$/i)
  if (match) {
    return `${labelField(match[1])} quyidagi qiymatlardan biri bo'lishi kerak: ${match[2]}`
  }

  return trimmed
}

function translateApiMessage(message: string): string {
  return translateValidationMessage(message)
}

function extractMessage(body: ApiErrorBody): string | null {
  if (Array.isArray(body.message)) {
    const unique = [
      ...new Set(
        body.message
          .filter((entry): entry is string => typeof entry === 'string')
          .map(translateApiMessage),
      ),
    ]
    return unique.length > 0 ? unique.join('. ') : null
  }

  if (typeof body.message === 'string') return translateApiMessage(body.message)
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

function isAbortedMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase()
  return (
    normalized === 'aborted' ||
    normalized === 'canceled' ||
    normalized === 'cancelled' ||
    normalized.includes('bekor qilindi')
  )
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
  if (isAbortedMessage(message)) {
    return status === 401
      ? 'Login yoki parol noto\'g\'ri'
      : fallback
  }

  const translated = translateApiMessage(message.trim())
  if (isTechnicalMessage(translated)) {
    return humanizeTechnicalMessage(translated, status, fallback)
  }
  return translated
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return extractStatus(error, null)
}

export function isRequestAbortedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  if ('status' in error && error.status === 'FETCH_ERROR') return false

  if ('message' in error && typeof error.message === 'string') {
    if (isAbortedMessage(error.message)) return true
  }

  const rtkError = error as RtkError
  if (rtkError && 'data' in rtkError && rtkError.data) {
    const body = rtkError.data as ApiErrorBody
    if (typeof body.message === 'string' && isAbortedMessage(body.message)) {
      return true
    }
  }

  const directBody = error as ApiErrorBody
  if (typeof directBody.message === 'string' && isAbortedMessage(directBody.message)) {
    return true
  }

  return false
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
