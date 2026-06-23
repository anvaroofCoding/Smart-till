import { HugeiconsIcon } from '@hugeicons/react'
import type { RemixiconComponentType } from '@remixicon/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import type { ComponentProps, ComponentType, SVGProps } from 'react'

import type { IconComponent } from '@/components/icons/icon.types'

type IconSvgObject = Parameters<typeof HugeiconsIcon>[0]['icon']

export function phosphorIcon(IconComponent: PhosphorIcon, name: string): IconComponent {
  const Wrapped = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
    <IconComponent className={className} weight="regular" {...props} />
  )
  Wrapped.displayName = name
  return Wrapped
}

export function hugeicon(icon: IconSvgObject, name: string): IconComponent {
  const Wrapped = ({ className, strokeWidth: _strokeWidth, ...props }: SVGProps<SVGSVGElement>) => (
    <HugeiconsIcon icon={icon} className={className} strokeWidth={1.5} {...props} />
  )
  Wrapped.displayName = name
  return Wrapped as IconComponent
}

export function remixIcon(IconComponent: RemixiconComponentType, name: string): IconComponent {
  const Wrapped = (props: SVGProps<SVGSVGElement>) => (
    <IconComponent
      {...(props as ComponentProps<typeof IconComponent>)}
    />
  )
  Wrapped.displayName = name
  return Wrapped as IconComponent
}

export function asIcon(Component: ComponentType<SVGProps<SVGSVGElement>>): IconComponent {
  return Component
}
