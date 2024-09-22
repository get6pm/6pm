import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { webhookAuthMiddleware } from '../../middlewares/webhook-auth'
import { deleteUser } from '../../services/user.service'

const zClerkUserData = z.object({ id: z.string() }) // Define more fields if needed

const zPayload = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user.deleted'),
    data: zClerkUserData,
  }),
])

const router = new Hono()
  .use(webhookAuthMiddleware)
  .post('/', zValidator('json', zPayload), async (c) => {
    const payload = c.req.valid('json')

    switch (payload.type) {
      case 'user.deleted':
        await deleteUser(payload.data.id)
        return c.json({ success: true, message: 'user deleted' })

      default:
        return c.json(
          { success: false, message: `${payload.type} is not supported` },
          400,
        )
    }
  })

export default router
