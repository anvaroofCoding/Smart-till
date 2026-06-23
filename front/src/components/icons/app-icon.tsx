import type { SVGProps } from 'react'

import { getIconComponent } from '@/components/icons/icon-libraries'
import type { AppIconName } from '@/components/icons/icon.types'
import { useIconLibrary } from '@/features/appearance/appearance-context'
import { cn } from '@/lib/utils'

export interface AppIconProps extends SVGProps<SVGSVGElement> {
  name: AppIconName
}

export function AppIcon({ name, className, ...props }: AppIconProps) {
  const library = useIconLibrary()
  const Icon = getIconComponent(library, name)

  return (
    <Icon
      className={cn('size-4 shrink-0', className)}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  )
}
