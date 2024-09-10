import type { User } from '@prisma/client'
import type { RequestIdVariables } from 'hono/request-id'

declare module 'hono' {
  interface ContextVariableMap {
    user: User | null
    userId: string | null
    requestId: RequestIdVariables['requestId']
  }
}
