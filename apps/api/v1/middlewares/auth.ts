import { clerkMiddleware, getAuth } from '@hono/clerk-auth'

export const authMiddleware = clerkMiddleware
export { getAuth }
