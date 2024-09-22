/*
  This webhook route is used to sync user subscription data from RevenueCat.
  The webhook only uses the user's ID to find the user and sync their subscription data.
*/

import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getLogger } from '../../../lib/log'
import { webhookAuthMiddleware } from '../../middlewares/webhook-auth'
import { findUserById, syncUserSubscription } from '../../services/user.service'

const zPayload = z.object({
  api_version: z.literal('1.0'),
  event: z.object({
    app_user_id: z.string(),
    environment: z.enum(['SANDBOX', 'PRODUCTION']),
    original_app_user_id: z.string(),
  }),
})

const router = new Hono()
  .use(webhookAuthMiddleware)
  .post('/', zValidator('json', zPayload), async (c) => {
    const logger = getLogger('webhooks:revenuecat')
    const payload = c.req.valid('json')
    const { event } = payload

    logger.debug('Received payload %o', payload)

    const userId = event.original_app_user_id || event.app_user_id
    const user = userId ? await findUserById(userId) : null

    if (!user) {
      logger.warn('User not found for id %s', userId)
      return c.json({ success: false, message: 'user not found' }, 404)
    }

    const syncedUser = await syncUserSubscription(user)

    logger.debug('Synced user %o', syncedUser)

    return c.json({ success: true })
  })

export default router
