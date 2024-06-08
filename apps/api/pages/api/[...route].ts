import { handle } from '@hono/node-server/vercel'
import type { PageConfig } from 'next'
import { app } from '../..'

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
}

export default handle(app)
