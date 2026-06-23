import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as ReduxProvider } from 'react-redux'
import { AppearanceProvider } from '@/features/appearance/appearance-context'
import { queryClient } from '@/query/query-client'
import { store } from '@/store'
import { SocketProvider } from '@/socket/socket-provider'
import { env } from '@/config/env'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
          <SocketProvider>
            {children}
            {env.isDev && <ReactQueryDevtools initialIsOpen={false} />}
          </SocketProvider>
        </AppearanceProvider>
      </QueryClientProvider>
    </ReduxProvider>
  )
}
