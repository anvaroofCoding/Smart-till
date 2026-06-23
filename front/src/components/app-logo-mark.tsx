import { cn } from '@/lib/utils'

interface AppLogoMarkProps {
  className?: string
  variant?: 'filled' | 'plain'
}

export function AppLogoMark({
  className,
  variant = 'filled',
}: AppLogoMarkProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-bold',
        variant === 'filled' &&
          'rounded-lg bg-primary text-primary-foreground',
        variant === 'plain' && 'text-current',
        className,
      )}
      aria-hidden
    >
      S
    </div>
  )
}
