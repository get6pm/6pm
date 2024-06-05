import { Hono } from 'hono'

import { trimTrailingSlash } from 'hono/trailing-slash'
import { prettyJSON } from 'hono/pretty-json'
import { logger } from 'hono/logger'

import { hono as appV1 } from '@/v1'

const app = new Hono({ strict: true })

// * Global middlewares
app.use(trimTrailingSlash())
app.use(prettyJSON({ space: 2 }))
app.use(logger())

// * Mounting versioned APIs
app.route('/api/v1', appV1)

export * from './prisma/generated/zod'
export * from '@/v1/validation'
export type AppType = typeof app
export { app }
