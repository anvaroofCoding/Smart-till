export type ColorMode = 'light' | 'dark'

export type UiStyle =
  | 'vega'
  | 'nova'
  | 'maia'
  | 'lyra'
  | 'mira'
  | 'luma'
  | 'sera'
  | 'rhea'

export type BaseColor =
  | 'neutral'
  | 'stone'
  | 'zinc'
  | 'mauve'
  | 'olive'
  | 'mist'
  | 'taupe'

export type AccentTheme =
  | 'amber'
  | 'blue'
  | 'cyan'
  | 'emerald'
  | 'fuchsia'
  | 'green'
  | 'indigo'
  | 'lime'
  | 'orange'
  | 'pink'
  | 'stone'
  | 'purple'
  | 'red'
  | 'rose'

export type FontFamily =
  | 'inter'
  | 'geist'
  | 'noto-sans'
  | 'figtree'
  | 'roboto'
  | 'raleway'
  | 'dm-sans'
  | 'public-sans'
  | 'outfit'
  | 'oxanium'
  | 'manrope'

export type IconLibrary =
  | 'lucide'
  | 'tabler'
  | 'hugeicons'
  | 'phosphor'
  | 'remix'

export type RadiusSize = 'none' | 'sm' | 'md' | 'lg'

export interface AppearanceSettings {
  notificationsEnabled: boolean
  mode: ColorMode
  style: UiStyle
  baseColor: BaseColor
  theme: AccentTheme
  headingFont: FontFamily
  bodyFont: FontFamily
  iconLibrary: IconLibrary
  radius: RadiusSize
}
