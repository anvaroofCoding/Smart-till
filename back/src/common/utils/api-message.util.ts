import type { ValidationError } from 'class-validator';

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
};

const API_MESSAGE_UZ: Record<string, string> = {
  'Invalid credentials': 'Login yoki parol noto\'g\'ri',
  'Invalid or expired token': 'Token yaroqsiz yoki muddati tugagan',
  'Account is deactivated': 'Hisob nofaol. Administrator bilan bog\'laning',
  'Access denied': 'Kirish taqiqlangan',
  'Insufficient permissions': 'Bu amal uchun ruxsat yetarli emas',
  'Internal server error': 'Ichki server xatosi. Keyinroq qayta urinib ko\'ring',
  'User not found': 'Foydalanuvchi topilmadi',
  'Login or email already registered': 'Login yoki email allaqachon ro\'yxatdan o\'tgan',
  'Login already in use': 'Bu login allaqachon band',
  'Email already in use': 'Bu email allaqachon band',
  'Authentication required': 'Avtorizatsiya talab qilinadi',
};

function labelField(property: string): string {
  const key = property.split('.').pop() ?? property;
  return FIELD_LABELS[key] ?? key;
}

export function translateValidationMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  const known = API_MESSAGE_UZ[trimmed];
  if (known) return known;

  let match = trimmed.match(/^property (.+) should not exist$/i);
  if (match) {
    return `'${labelField(match[1])}' maydoni ruxsat etilmagan`;
  }

  match = trimmed.match(/^(.+) must be longer than or equal to (\d+) characters?$/i);
  if (match) {
    return `${labelField(match[1])} kamida ${match[2]} ta belgidan iborat bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must be shorter than or equal to (\d+) characters?$/i);
  if (match) {
    return `${labelField(match[1])} ko'pi bilan ${match[2]} ta belgidan iborat bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must be a string$/i);
  if (match) {
    return `${labelField(match[1])} matn bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must be a number( conforming to the specified constraints)?$/i);
  if (match) {
    return `${labelField(match[1])} raqam bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must be an integer number$/i);
  if (match) {
    return `${labelField(match[1])} butun son bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must be a positive number$/i);
  if (match) {
    return `${labelField(match[1])} musbat son bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must not be less than ([\d.]+)$/i);
  if (match) {
    return `${labelField(match[1])} ${match[2]} dan kichik bo'lmasligi kerak`;
  }

  match = trimmed.match(/^(.+) must not be greater than ([\d.]+)$/i);
  if (match) {
    return `${labelField(match[1])} ${match[2]} dan katta bo'lmasligi kerak`;
  }

  match = trimmed.match(/^(.+) must be an email$/i);
  if (match) {
    return `${labelField(match[1])} to'g'ri email manzili bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must be a mongodb id$/i);
  if (match) {
    return `${labelField(match[1])} identifikatori noto'g'ri`;
  }

  match = trimmed.match(/^(.+) must be a UUID$/i);
  if (match) {
    return `${labelField(match[1])} identifikatori noto'g'ri`;
  }

  match = trimmed.match(/^(.+) should not be empty$/i);
  if (match) {
    return `${labelField(match[1])} bo'sh bo'lmasligi kerak`;
  }

  match = trimmed.match(/^(.+) must be a boolean value$/i);
  if (match) {
    return `${labelField(match[1])} ha/yo'q qiymati bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must be one of the following values: (.+)$/i);
  if (match) {
    return `${labelField(match[1])} quyidagi qiymatlardan biri bo'lishi kerak: ${match[2]}`;
  }

  match = trimmed.match(/^(.+) must be a valid ISO 8601 date string$/i);
  if (match) {
    return `${labelField(match[1])} to'g'ri sana formatida bo'lishi kerak`;
  }

  match = trimmed.match(/^each value in (.+) must be a mongodb id$/i);
  if (match) {
    return `${labelField(match[1])} ro'yxatidagi identifikatorlar noto'g'ri`;
  }

  match = trimmed.match(/^nested property (.+) must be either object or array$/i);
  if (match) {
    return `${labelField(match[1])} obyekt yoki ro'yxat bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must contain at least (\d+) elements?$/i);
  if (match) {
    return `${labelField(match[1])} kamida ${match[2]} ta elementdan iborat bo'lishi kerak`;
  }

  match = trimmed.match(/^(.+) must contain no more than (\d+) elements?$/i);
  if (match) {
    return `${labelField(match[1])} ko'pi bilan ${match[2]} ta elementdan iborat bo'lishi kerak`;
  }

  return trimmed;
}

export function translateApiMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  const known = API_MESSAGE_UZ[trimmed];
  if (known) return known;

  return translateValidationMessage(trimmed);
}

export function translateApiMessages(
  message: string | string[] | undefined,
): string | string[] | undefined {
  if (!message) return message;

  if (Array.isArray(message)) {
    return [...new Set(message.map((entry) => translateApiMessage(entry)))];
  }

  return translateApiMessage(message);
}

export function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }

    if (error.children?.length) {
      messages.push(...flattenValidationErrors(error.children));
    }
  }

  return messages;
}
