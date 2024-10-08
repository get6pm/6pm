import { Hono } from 'hono'
import { except } from 'hono/combine'
import { compress } from 'hono/compress'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { trimTrailingSlash } from 'hono/trailing-slash'

import { log } from './lib/log'
import { hono as appV1 } from './v1'

const IS_VERCEL = process.env.VERCEL === '1'

const app = new Hono({ strict: true })

  // * Global middlewares
  .use(compress())
  .use(requestId())
  .use(trimTrailingSlash())
  .use(prettyJSON({ space: 2 }))
  .use(except(() => IS_VERCEL, logger(log.info.bind(log))))

  // * Mounting versioned APIs
  .route('/v1', appV1)

export { app }
export type AppType = typeof app
