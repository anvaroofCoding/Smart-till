import { QueryClient } from '@tanstack/react-query'
import { env } from '@/config/env'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        const status = (error as { statusCode?: number })?.statusCode
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
})

export const inventoryPollingDefaults = {
  refetchInterval: env.inventoryPollIntervalMs,
  refetchIntervalInBackground: true,
} as const
