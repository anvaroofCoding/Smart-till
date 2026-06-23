import { APP_NAME, APP_TAGLINE } from '@/config/app'

export const SITE_URL =
  import.meta.env.VITE_SITE_URL ?? 'https://smarttill.uz'

export const SEO = {
  siteName: APP_NAME,
  tagline: APP_TAGLINE,
  defaultTitle: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    'Smart Till — ombor, kassa va savdo boshqaruv tizimi. Buyurtmalar, mahsulotlar, inventarizatsiya, transfer va hisobotlar bir platformada.',
  keywords: [
    'kassa tizimi',
    'ombor boshqaruvi',
    'POS tizimi',
    'savdo dasturi',
    'inventarizatsiya',
    'Smart Till',
    'O\'zbekiston',
  ].join(', '),
  locale: 'uz_UZ',
  themeColor: '#0f172a',
  author: APP_NAME,
  twitterCard: 'summary' as const,
}

export function pageTitle(page?: string, section?: string): string {
  if (page && section) {
    return `${page} — ${section} | ${APP_NAME}`
  }
  if (page) {
    return `${page} | ${APP_NAME}`
  }
  return SEO.defaultTitle
}
