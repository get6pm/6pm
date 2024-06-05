import { handle } from 'hono/vercel'
import { app } from '@/index'

export const config = {
  runtime: 'edge',
}

export default handle(app)
