import type { ComponentType, SVGProps } from 'react'

import type { IconLibrary } from '@/features/appearance/appearance.types'

export type AppIconName =
  | 'arrow-left'
  | 'arrow-left-right'
  | 'bell'
  | 'check'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-right'
  | 'chevrons-up-down'
  | 'circle'
  | 'clipboard-list'
  | 'eye'
  | 'eye-off'
  | 'grip-vertical'
  | 'hand-coins'
  | 'loader'
  | 'log-out'
  | 'more-horizontal'
  | 'package'
  | 'panel-left'
  | 'pencil'
  | 'plus'
  | 'rotate-ccw'
  | 'search'
  | 'settings'
  | 'settings-2'
  | 'store'
  | 'trash-2'
  | 'truck'
  | 'users'
  | 'warehouse'
  | 'x'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export type IconRegistry = Record<AppIconName, IconComponent>

export type IconRegistryMap = Record<IconLibrary, IconRegistry>
