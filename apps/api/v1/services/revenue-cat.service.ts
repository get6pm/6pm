import RevenueCatV1 from '../../lib/revenuecat-v1'
import type { CustomerInfo } from '../../lib/revenuecat-v1.types'

const { REVENUECAT_API_V1_KEY } = process.env

const IS_PROD = process.env.VERCEL_ENV === 'production'
const rc = new RevenueCatV1(REVENUECAT_API_V1_KEY)

export async function getOrCreateCustomer({
  userId,
}: {
  userId: string
}): Promise<CustomerInfo> {
  const customer = await rc.getOrCreateCustomer(userId, {
    'X-Is-Sandbox': IS_PROD ? 'false' : 'true',
  })

  return customer
}

export function getCustomerActiveSubscription(customer: CustomerInfo) {
  const active = Object.entries(customer.subscriber.entitlements).find(
    ([, entitlement]) => new Date(entitlement.expires_date) > new Date(),
  )

  if (!active) {
    return null
  }

  return {
    entitlement: active[0],
    subscription: active[1],
  }
}
