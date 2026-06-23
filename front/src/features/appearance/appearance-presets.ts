import type { AccentTheme, BaseColor, ColorMode, UiStyle } from '@/features/appearance/appearance.types'

type ThemeVars = Record<string, string>

const ACCENT_HUE: Record<AccentTheme, number> = {
  amber: 75,
  blue: 255,
  cyan: 200,
  emerald: 155,
  fuchsia: 320,
  green: 145,
  indigo: 275,
  lime: 125,
  orange: 55,
  pink: 350,
  stone: 95,
  purple: 300,
  red: 25,
  rose: 15,
}

export function getAccentVars(theme: AccentTheme, mode: ColorMode): ThemeVars {
  const hue = ACCENT_HUE[theme]
  if (mode === 'dark') {
    return {
      '--primary': `oklch(0.72 0.17 ${hue})`,
      '--primary-foreground': `oklch(0.15 0.02 ${hue})`,
      '--ring': `oklch(0.62 0.14 ${hue})`,
      '--sidebar-primary': `oklch(0.68 0.18 ${hue})`,
      '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
      '--sidebar-ring': `oklch(0.62 0.14 ${hue})`,
      '--chart-1': `oklch(0.65 0.18 ${hue})`,
      '--chart-2': `oklch(0.6 0.14 ${hue + 30})`,
      '--chart-3': `oklch(0.55 0.12 ${hue - 20})`,
    }
  }
  return {
    '--primary': `oklch(0.45 0.18 ${hue})`,
    '--primary-foreground': 'oklch(0.985 0 0)',
    '--ring': `oklch(0.55 0.14 ${hue})`,
    '--sidebar-primary': `oklch(0.42 0.18 ${hue})`,
    '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
    '--sidebar-ring': `oklch(0.55 0.14 ${hue})`,
    '--chart-1': `oklch(0.55 0.18 ${hue})`,
    '--chart-2': `oklch(0.5 0.14 ${hue + 30})`,
    '--chart-3': `oklch(0.45 0.12 ${hue - 20})`,
  }
}

/** Sidebar, popover, secondary — base ranglardan hosil qilinadi */
export function deriveSurfaceVars(base: ThemeVars): ThemeVars {
  const fg = base['--foreground'] ?? 'oklch(0.145 0 0)'
  const card = base['--card'] ?? base['--background'] ?? 'oklch(1 0 0)'
  const muted = base['--muted'] ?? 'oklch(0.97 0 0)'
  const border = base['--border'] ?? 'oklch(0.922 0 0)'

  return {
    '--card-foreground': fg,
    '--popover': card,
    '--popover-foreground': fg,
    '--secondary': muted,
    '--secondary-foreground': fg,
    '--accent': muted,
    '--accent-foreground': fg,
    '--sidebar': card,
    '--sidebar-foreground': fg,
    '--sidebar-accent': muted,
    '--sidebar-accent-foreground': fg,
    '--sidebar-border': border,
  }
}

const BASE_LIGHT: Record<BaseColor, ThemeVars> = {
  neutral: {
    '--background': 'oklch(1 0 0)',
    '--foreground': 'oklch(0.145 0 0)',
    '--card': 'oklch(1 0 0)',
    '--muted': 'oklch(0.97 0 0)',
    '--muted-foreground': 'oklch(0.556 0 0)',
    '--border': 'oklch(0.922 0 0)',
    '--input': 'oklch(0.922 0 0)',
  },
  stone: {
    '--background': 'oklch(0.99 0.002 106)',
    '--foreground': 'oklch(0.147 0.004 49)',
    '--card': 'oklch(0.99 0.002 106)',
    '--muted': 'oklch(0.97 0.003 106)',
    '--muted-foreground': 'oklch(0.553 0.013 58)',
    '--border': 'oklch(0.923 0.003 48)',
    '--input': 'oklch(0.923 0.003 48)',
  },
  zinc: {
    '--background': 'oklch(1 0 0)',
    '--foreground': 'oklch(0.141 0.005 285)',
    '--card': 'oklch(1 0 0)',
    '--muted': 'oklch(0.967 0.001 286)',
    '--muted-foreground': 'oklch(0.552 0.016 285)',
    '--border': 'oklch(0.92 0.004 286)',
    '--input': 'oklch(0.92 0.004 286)',
  },
  mauve: {
    '--background': 'oklch(0.99 0.003 300)',
    '--foreground': 'oklch(0.16 0.02 300)',
    '--card': 'oklch(0.99 0.003 300)',
    '--muted': 'oklch(0.96 0.01 300)',
    '--muted-foreground': 'oklch(0.52 0.03 300)',
    '--border': 'oklch(0.91 0.015 300)',
    '--input': 'oklch(0.91 0.015 300)',
  },
  olive: {
    '--background': 'oklch(0.99 0.004 120)',
    '--foreground': 'oklch(0.16 0.02 120)',
    '--card': 'oklch(0.99 0.004 120)',
    '--muted': 'oklch(0.96 0.01 120)',
    '--muted-foreground': 'oklch(0.5 0.03 120)',
    '--border': 'oklch(0.91 0.012 120)',
    '--input': 'oklch(0.91 0.012 120)',
  },
  mist: {
    '--background': 'oklch(0.99 0.004 220)',
    '--foreground': 'oklch(0.16 0.02 220)',
    '--card': 'oklch(0.99 0.004 220)',
    '--muted': 'oklch(0.96 0.01 220)',
    '--muted-foreground': 'oklch(0.5 0.03 220)',
    '--border': 'oklch(0.91 0.012 220)',
    '--input': 'oklch(0.91 0.012 220)',
  },
  taupe: {
    '--background': 'oklch(0.99 0.004 50)',
    '--foreground': 'oklch(0.17 0.02 50)',
    '--card': 'oklch(0.99 0.004 50)',
    '--muted': 'oklch(0.96 0.01 50)',
    '--muted-foreground': 'oklch(0.5 0.03 50)',
    '--border': 'oklch(0.91 0.012 50)',
    '--input': 'oklch(0.91 0.012 50)',
  },
}

const BASE_DARK: Record<BaseColor, ThemeVars> = {
  neutral: {
    '--background': 'oklch(0.145 0 0)',
    '--foreground': 'oklch(0.985 0 0)',
    '--card': 'oklch(0.205 0 0)',
    '--muted': 'oklch(0.269 0 0)',
    '--muted-foreground': 'oklch(0.708 0 0)',
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
  },
  stone: {
    '--background': 'oklch(0.147 0.004 49)',
    '--foreground': 'oklch(0.985 0.001 106)',
    '--card': 'oklch(0.216 0.006 56)',
    '--muted': 'oklch(0.268 0.007 34)',
    '--muted-foreground': 'oklch(0.709 0.01 56)',
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
  },
  zinc: {
    '--background': 'oklch(0.141 0.005 285)',
    '--foreground': 'oklch(0.985 0 0)',
    '--card': 'oklch(0.21 0.006 285)',
    '--muted': 'oklch(0.274 0.006 286)',
    '--muted-foreground': 'oklch(0.705 0.015 286)',
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
  },
  mauve: {
    '--background': 'oklch(0.16 0.02 300)',
    '--foreground': 'oklch(0.98 0.005 300)',
    '--card': 'oklch(0.22 0.025 300)',
    '--muted': 'oklch(0.28 0.03 300)',
    '--muted-foreground': 'oklch(0.72 0.03 300)',
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
  },
  olive: {
    '--background': 'oklch(0.16 0.02 120)',
    '--foreground': 'oklch(0.98 0.005 120)',
    '--card': 'oklch(0.22 0.025 120)',
    '--muted': 'oklch(0.28 0.03 120)',
    '--muted-foreground': 'oklch(0.72 0.03 120)',
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
  },
  mist: {
    '--background': 'oklch(0.16 0.02 220)',
    '--foreground': 'oklch(0.98 0.005 220)',
    '--card': 'oklch(0.22 0.025 220)',
    '--muted': 'oklch(0.28 0.03 220)',
    '--muted-foreground': 'oklch(0.72 0.03 220)',
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
  },
  taupe: {
    '--background': 'oklch(0.17 0.02 50)',
    '--foreground': 'oklch(0.98 0.005 50)',
    '--card': 'oklch(0.23 0.025 50)',
    '--muted': 'oklch(0.29 0.03 50)',
    '--muted-foreground': 'oklch(0.72 0.03 50)',
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
  },
}

export function getBaseVars(base: BaseColor, mode: ColorMode): ThemeVars {
  const raw = mode === 'dark' ? BASE_DARK[base] : BASE_LIGHT[base]
  return { ...raw, ...deriveSurfaceVars(raw) }
}

export const STYLE_VARS: Record<UiStyle, ThemeVars> = {
  vega: { '--shadow-soft': '0 1px 2px oklch(0 0 0 / 6%)' },
  nova: { '--shadow-soft': '0 2px 8px oklch(0 0 0 / 8%)' },
  maia: { '--shadow-soft': '0 1px 3px oklch(0 0 0 / 5%)' },
  lyra: { '--shadow-soft': '0 4px 12px oklch(0 0 0 / 10%)' },
  mira: { '--shadow-soft': '0 2px 6px oklch(0 0 0 / 7%)' },
  luma: { '--shadow-soft': '0 1px 4px oklch(0 0 0 / 4%)' },
  sera: { '--shadow-soft': '0 3px 10px oklch(0 0 0 / 9%)' },
  rhea: { '--shadow-soft': '0 2px 10px oklch(0 0 0 / 11%)' },
}
