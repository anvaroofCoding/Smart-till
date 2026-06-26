import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppearance } from '@/features/appearance/appearance-context'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { settings, updateSettings } = useAppearance()
  const isDark = settings.mode === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('shrink-0', className)}
      aria-label={isDark ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
      onClick={() => updateSettings({ mode: isDark ? 'light' : 'dark' })}
    >
      {isDark ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </Button>
  )
}
