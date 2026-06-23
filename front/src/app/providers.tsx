import { lazy, Suspense, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Provider as ReduxProvider } from 'react-redux'
import { Toaster } from '@/components/ui/toaster'
import { AppearanceProvider } from '@/features/appearance/appearance-context'
import { queryClient } from '@/query/query-client'
import { store } from '@/store'
import { SocketProvider } from '@/socket/socket-provider'
import { AuthProfileSync } from '@/app/auth-profile-sync'
import { env } from '@/config/env'

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  })),
)

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
          <AuthProfileSync />
          <SocketProvider>
            {children}
            <Toaster />
            {env.isDev && (
              <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
              </Suspense>
            )}
          </SocketProvider>
        </AppearanceProvider>
      </QueryClientProvider>
    </ReduxProvider>
  )
}
