import { Navigate } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { AppLogoMark } from '@/components/app-logo-mark'
import { LoginForm } from '@/components/login-form'
import { ThemeToggle } from '@/components/theme-toggle'
import { APP_NAME, APP_TAGLINE } from '@/config/app'
import { PAGE_EDGE_PADDING_CLASS } from '@/config/layout'
import { SEO, pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const { isAuthenticated } = useAuth()

  usePageMeta({
    title: pageTitle('Kirish'),
    description: `${SEO.description} Tizimga kirish.`,
    noIndex: true,
  })

  if (isAuthenticated) {
    return <Navigate to="/kassir/buyurtmalar" replace />
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className={cn('flex flex-col gap-4', PAGE_EDGE_PADDING_CLASS)}>
        <div className="flex items-center justify-between gap-2">
          <BrandLogo size="sm" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-muted to-primary/10" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <AppLogoMark className="mx-auto mb-6 size-16 text-3xl rounded-2xl" />
            <h2 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{APP_TAGLINE}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
