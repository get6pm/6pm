import { type Got, got } from 'got'
import { getLogger } from './log'
import type { CustomerInfo } from './revenuecat-v1.types'

class RevenueCatV1 {
  client: Got<{
    prefixUrl: string
    headers: {
      // biome-ignore lint/style/useNamingConvention: <explanation>
      Authorization: string
    }
  }>

  constructor(
    apiKey = process.env.REVENUECAT_API_V1_KEY,
    prefixUrl = 'https://api.revenuecat.com/v1/',
  ) {
    if (!apiKey) {
      throw new Error(
        `[${RevenueCatV1.name}] REVENUECAT_API_V1_KEY is required`,
      )
    }

    if (!prefixUrl) {
      throw new Error(`[${RevenueCatV1.name}] prefixUrl is required`)
    }

    this.client = got.extend({
      prefixUrl,
      headers: {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }

  /**
   * Gets the latest Customer Info for the customer with the given App User ID,
   * or creates a new customer if it doesn't exist.
   */
  async getOrCreateCustomer(
    /** The App User ID used with the mobile SDK. */
    appUserId: string,
    headers?: {
      /**
       * Optionally set the X-Platform header to update the Customer's `last_seen` field. Set to either `ios`, `android`, `amazon`, `macos`, `uikitformac`. Don't set this if you are calling the getter for informational purposes or using a secret API key to fetch the customer's attributes.
       * @example "ios"
       */
      'X-Platform'?: 'ios' | 'android' | 'amazon' | 'macos' | 'uikitformac'
      /**
       * Optionally set the X-Is-Sandbox header to `true` to include Apple StoreKit test transactions of this Customer. Don't set this in production. The SDK will automatically set this for your based on the environment of the app.
       * @defaults false
       */
      'X-Is-Sandbox'?: 'true' | 'false'
    },
  ): Promise<CustomerInfo> {
    const logger = getLogger(
      `${RevenueCatV1.name}:${this.getOrCreateCustomer.name}:${appUserId}`,
    )
    const url = `subscribers/${appUserId}`

    logger.debug('Getting or creating customer %o', { appUserId, headers, url })

    const response = await this.client
      .get(url, { headers })
      .json<CustomerInfo>()

    logger.debug(response)

    return response
  }
}

export default RevenueCatV1
