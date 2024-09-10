import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { Webhook } from 'svix'
import { z } from 'zod'
import { deleteUser } from '../services/user.service'

const webhookSecret: string = process.env.CLERK_WEBHOOK_SECRET_KEY ?? ''

const zDeletedUser = z.object({
  data: z.object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.string(),
  }),
  event_attributes: z.object({}),
  object: z.string(),
  type: z.string(),
})

const zDeleteUserHeader = () =>
  zValidator(
    'header',
    z.object({
      'svix-id': z.string(),
      'svix-timestamp': z.string(),
      'svix-signature': z.string(),
    }),
  )

const router = new Hono().post(
  '/clerk',
  zValidator('json', zDeletedUser),
  zDeleteUserHeader(),
  async (c) => {
    const bodyText = await c.req.text()
    const data = c.req.valid('json')

    const svix = new Webhook(webhookSecret)

    try {
      svix.verify(bodyText, {
        'svix-id': c.req.valid('header')['svix-id'],
        'svix-timestamp': c.req.valid('header')['svix-timestamp'],
        'svix-signature': c.req.valid('header')['svix-signature'],
      })
    } catch (error) {
      c.json({ message: `Can not verify secret key: ${error}` }, 400)
    }

    if (data.type !== 'user.deleted') {
      return c.json({ message: `${data.type} is not supported` }, 400)
    }

    console.log('Delete user:', data.data.id)
    await deleteUser(data.data.id)
    return c.json(data)
  },
)

export default router
