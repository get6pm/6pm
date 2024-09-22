import type { NextApiRequest, NextApiResponse } from 'next'
import { syncAllUsersSubscription } from '../../../../v1/services/user.service'

export const dynamic = 'force-dynamic' // static by default, unless reading the request

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const authHeader = req.headers.authorization

  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ success: false, message: 'unauthorized' })
  }

  res.status(200).json(await syncAllUsersSubscription())
}
