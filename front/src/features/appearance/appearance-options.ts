import type {
  AccentTheme,
  BaseColor,
  FontFamily,
  IconLibrary,
  RadiusSize,
  UiStyle,
} from '@/features/appearance/appearance.types'

export const STORAGE_KEY = 'smart-till-appearance'

export const UI_STYLES: { id: UiStyle; label: string }[] = [
  { id: 'vega', label: 'Vega uslubi' },
  { id: 'nova', label: 'Nova uslubi' },
  { id: 'maia', label: 'Maia uslubi' },
  { id: 'lyra', label: 'Lyra uslubi' },
  { id: 'mira', label: 'Mira uslubi' },
  { id: 'luma', label: 'Luma uslubi' },
  { id: 'sera', label: 'Sera uslubi' },
  { id: 'rhea', label: 'Rhea uslubi' },
]

export const BASE_COLORS: { id: BaseColor; label: string }[] = [
  { id: 'neutral', label: 'Neytral' },
  { id: 'stone', label: 'Tosh' },
  { id: 'zinc', label: 'Rux' },
  { id: 'mauve', label: 'Moviy-binafsha' },
  { id: 'olive', label: 'Zaytun' },
  { id: 'mist', label: 'Tuman' },
  { id: 'taupe', label: 'Kulrang' },
]

export const ACCENT_THEMES: { id: AccentTheme; label: string; swatch: string }[] = [
  { id: 'amber', label: 'Kehribar', swatch: 'oklch(0.75 0.18 75)' },
  { id: 'blue', label: "Ko'k", swatch: 'oklch(0.55 0.22 255)' },
  { id: 'cyan', label: 'Moviy', swatch: 'oklch(0.65 0.14 200)' },
  { id: 'emerald', label: 'Zumrad', swatch: 'oklch(0.6 0.15 155)' },
  { id: 'fuchsia', label: 'Fuksiya', swatch: 'oklch(0.6 0.25 320)' },
  { id: 'green', label: 'Yashil', swatch: 'oklch(0.58 0.17 145)' },
  { id: 'indigo', label: 'Indigo', swatch: 'oklch(0.52 0.22 275)' },
  { id: 'lime', label: 'Laym', swatch: 'oklch(0.72 0.19 125)' },
  { id: 'orange', label: "To'q sariq", swatch: 'oklch(0.68 0.19 55)' },
  { id: 'pink', label: 'Pushti', swatch: 'oklch(0.62 0.22 350)' },
  { id: 'stone', label: 'Tosh', swatch: 'oklch(0.55 0.02 95)' },
  { id: 'purple', label: 'Binafsha', swatch: 'oklch(0.55 0.24 300)' },
  { id: 'red', label: 'Qizil', swatch: 'oklch(0.55 0.22 25)' },
  { id: 'rose', label: 'Atirgul', swatch: 'oklch(0.58 0.22 15)' },
]

export const FONT_OPTIONS: { id: FontFamily; label: string; family: string }[] = [
  { id: 'inter', label: 'Inter', family: 'Inter' },
  { id: 'geist', label: 'Geist', family: 'Geist' },
  { id: 'noto-sans', label: 'Noto Sans', family: 'Noto Sans' },
  { id: 'figtree', label: 'Figtree', family: 'Figtree' },
  { id: 'roboto', label: 'Roboto', family: 'Roboto' },
  { id: 'raleway', label: 'Raleway', family: 'Raleway' },
  { id: 'dm-sans', label: 'DM Sans', family: 'DM Sans' },
  { id: 'public-sans', label: 'Public Sans', family: 'Public Sans' },
  { id: 'outfit', label: 'Outfit', family: 'Outfit' },
  { id: 'oxanium', label: 'Oxanium', family: 'Oxanium' },
  { id: 'manrope', label: 'Manrope', family: 'Manrope' },
]

export const ICON_LIBRARIES: { id: IconLibrary; label: string }[] = [
  { id: 'lucide', label: 'Lucide kutubxonasi' },
  { id: 'tabler', label: 'Tabler ikonkalari' },
  { id: 'hugeicons', label: 'Hugeicons kutubxonasi' },
  { id: 'phosphor', label: 'Phosphor ikonkalari' },
  { id: 'remix', label: 'Remix ikonkalari' },
]

export const RADIUS_OPTIONS: { id: RadiusSize; label: string }[] = [
  { id: 'none', label: 'Yo\'q' },
  { id: 'sm', label: 'Kichik' },
  { id: 'md', label: 'O\'rta' },
  { id: 'lg', label: 'Katta' },
]
