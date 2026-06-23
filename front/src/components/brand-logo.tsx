import { AppLogoMark } from '@/components/app-logo-mark'
import { APP_NAME, APP_TAGLINE } from '@/config/app'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'size-8 text-sm',
  md: 'size-9 text-base',
  lg: 'size-10 text-lg',
} as const

const titleSizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const

export function BrandLogo({
  showText = true,
  size = 'md',
  className,
}: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <AppLogoMark className={sizeMap[size]} />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-semibold tracking-tight', titleSizeMap[size])}>
            {APP_NAME}
          </span>
          <span className="text-muted-foreground text-xs">{APP_TAGLINE}</span>
        </div>
      )}
    </div>
  )
}
