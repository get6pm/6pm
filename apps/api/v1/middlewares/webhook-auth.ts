import { createMiddleware } from 'hono/factory'
import { Webhook } from 'svix'
import { getLogger } from '../../lib/log'

export const webhookAuthMiddleware = createMiddleware(async (c, next) => {
  const { CLERK_WEBHOOK_SECRET_KEY } = process.env

  if (!CLERK_WEBHOOK_SECRET_KEY) {
    return c.json({ message: 'CLERK_WEBHOOK_SECRET_KEY is not set' }, 500)
  }

  const bodyText = await c.req.text()
  const svix = new Webhook(CLERK_WEBHOOK_SECRET_KEY)

  try {
    svix.verify(bodyText, {
      'svix-id': c.req.header('svix-id')!,
      'svix-timestamp': c.req.header('svix-timestamp')!,
      'svix-signature': c.req.header('svix-signature')!,
    })
  } catch (error) {
    const logger = getLogger('webhookAuthMiddleware')
    logger.error(error)

    return c.json({ message: `svix validation failed` }, 400)
  }

  await next()
})
