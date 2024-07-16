import type { AppType } from '@6pm/api'
import { getClerkInstance } from '@clerk/clerk-expo'
import { QueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { tokenCache } from './cache'

export const clerk = getClerkInstance({
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  tokenCache,
})

export const getHonoClient = async () => {
  const token = await clerk.session?.getToken()
  return hc<AppType>(process.env.EXPO_PUBLIC_API_URL!, {
    headers: {
      // biome-ignore lint/style/useNamingConvention: <explanation>
      Authorization: `Bearer ${token}`,
    },
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
      staleTime: 1000 * 60 * 60 * 24, // 1 day
    },
  },
})
