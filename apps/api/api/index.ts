import { handle } from 'hono/vercel'
import { app } from '..'

export const config = {
  runtime: 'edge',
}

export default handle(app)
