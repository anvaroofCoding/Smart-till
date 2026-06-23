import { FONT_OPTIONS } from '@/features/appearance/appearance-options'
import {
  getAccentVars,
  getBaseVars,
  STYLE_VARS,
} from '@/features/appearance/appearance-presets'
import type {
  AppearanceSettings,
  FontFamily,
  RadiusSize,
} from '@/features/appearance/appearance.types'

const RADIUS_MAP: Record<RadiusSize, string> = {
  none: '0rem',
  sm: '0.375rem',
  md: '0.625rem',
  lg: '1rem',
}

const FONT_LINK_ID = 'appearance-fonts'

const GOOGLE_FONTS = new Set<FontFamily>([
  'inter',
  'noto-sans',
  'figtree',
  'roboto',
  'raleway',
  'dm-sans',
  'public-sans',
  'outfit',
  'oxanium',
  'manrope',
])

function getFontFamily(id: FontFamily): string {
  const found = FONT_OPTIONS.find((f) => f.id === id)
  if (!found) return 'system-ui, sans-serif'
  if (id === 'geist') {
    return '"Geist", "Inter", system-ui, sans-serif'
  }
  return `"${found.family}", system-ui, sans-serif`
}

function loadFonts(heading: FontFamily, body: FontFamily): void {
  const families = new Set([heading, body])
  const google = [...families].filter((f) => GOOGLE_FONTS.has(f))

  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (google.length === 0) {
    link?.remove()
    return
  }

  const params = google
    .map((id) => {
      const family = FONT_OPTIONS.find((f) => f.id === id)?.family ?? 'Inter'
      return `family=${family.replace(/ /g, '+')}:wght@400;500;600;700`
    })
    .join('&')

  const href = `https://fonts.googleapis.com/css2?${params}&display=swap`

  if (!link) {
    link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = href

  if (heading === 'geist' || body === 'geist') {
    let geist = document.getElementById('geist-font') as HTMLLinkElement | null
    if (!geist) {
      geist = document.createElement('link')
      geist.id = 'geist-font'
      geist.rel = 'stylesheet'
      geist.href = 'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.css'
      document.head.appendChild(geist)
    }
  }
}

function applyVars(vars: Record<string, string>): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}

export function applyAppearance(settings: AppearanceSettings): void {
  const root = document.documentElement

  root.classList.toggle('dark', settings.mode === 'dark')
  root.style.colorScheme = settings.mode

  root.dataset.style = settings.style
  root.dataset.base = settings.baseColor
  root.dataset.theme = settings.theme
  root.dataset.radius = settings.radius
  root.dataset.fontSans = settings.bodyFont
  root.dataset.fontHeading = settings.headingFont
  root.dataset.iconLibrary = settings.iconLibrary

  root.style.setProperty('--radius', RADIUS_MAP[settings.radius])
  root.style.setProperty('--font-sans', getFontFamily(settings.bodyFont))
  root.style.setProperty('--font-heading', getFontFamily(settings.headingFont))

  const base = getBaseVars(settings.baseColor, settings.mode)
  const accent = getAccentVars(settings.theme, settings.mode)

  applyVars({ ...base, ...accent })
  applyVars(STYLE_VARS[settings.style])

  loadFonts(settings.headingFont, settings.bodyFont)
}
