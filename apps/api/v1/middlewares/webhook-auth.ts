import { createMiddleware } from 'hono/factory'
import { Webhook } from 'svix'
import { getLogger } from '../../lib/log'

export const webhookAuthMiddleware = createMiddleware(async (c, next) => {
  const { path } = c.req

  if (path.includes('clerk')) {
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

      return c.json({ success: false, message: `svix validation failed` }, 400)
    }

    return await next()
  }

  if (path.includes('revenuecat')) {
    const { REVENUECAT_WEBHOOK_SECRET } = process.env

    if (!REVENUECAT_WEBHOOK_SECRET) {
      return c.json({ message: 'REVENUECAT_WEBHOOK_SECRET is not set' }, 500)
    }

    const authorization = c.req.header('Authorization')

    if (
      !authorization ||
      authorization !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`
    ) {
      return c.json({ success: false, message: 'unauthorized' }, 401)
    }

    return await next()
  }

  return c.json({ success: false, message: 'Not found' }, 404)
})
