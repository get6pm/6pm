export enum RevenueCatStore {
  /** The product was purchased through Apple App Store. */
  AppStore = 'app_store',
  /** The product was purchased through the Mac App Store. */
  MacAppStore = 'mac_app_store',
  /** The product was purchased through the Google Play Store. */
  PlayStore = 'play_store',
  /** The product was purchased through the Amazon Appstore. */
  Amazon = 'amazon',
  /** The product was purchased through Stripe. */
  Stripe = 'stripe',
  /** The product was [granted via RevenueCat](https://www.revenuecat.com/docs/api-v1#tag/entitlements/operation/grant-a-promotional-entitlement). */
  Promotional = 'promotional',
}

/** How the Customer received access to this subscription */
export enum OwnershipType {
  /** The Customer purchased the product. */
  Purchased = 'PURCHASED',
  /** The Customer purchased the product. */
  FamilyShared = 'FAMILY_SHARED',
}

/** Type of the current subscription period_type */
export enum PeriodType {
  /** The product is in a normal period (default) */
  Normal = 'normal',
  /** The product is in a free trial period */
  Trial = 'trial',
  /** The product is in an introductory pricing period */
  Intro = 'intro',
}

export interface CustomerInfo {
  /** Date of the request in ISO 8601 format. */
  // biome-ignore lint/style/useNamingConvention: <explanation>
  request_date: string

  /** Date of the request in milliseconds since Epoch. */
  // biome-ignore lint/style/useNamingConvention: <explanation>
  request_date_ms: number

  /** Information about the Customer. */
  subscriber: {
    /** Dictionary of the entitlements of this Customer (including any expired entitlements). */
    entitlements: Record<
      string,
      {
        /** Date when the entitlement expires / expired (in ISO 8601 format, may be in the past). */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        expires_date: string

        /** Date when any potential grace period of the entitlement expires / expired (in ISO 8601 format, may be in the past). `null` if the Customer has never been in a grace period. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        grace_period_expires_date: string

        /**
         * The identifier of the product that is responsible for this entitlement being granted.
         *
         * Please note: in some cases, if there are problems with validating the purchase with the store, the correct product identifier might temporarily be unavailable.
         */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        product_identifier: string

        /** Time of the last purchase or renewal of the product that grants this entitlement (in ISO 8601 format). */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        purchase_date: string
      }
    >

    /** The ISO 8601 datetime string corresponding to when the Customer was first seen by RevenueCat. */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    first_seen: string

    /** The ISO 8601 datetime string corresponding to when the Customer was last seen by RevenueCat. */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    last_seen: string

    /**
     * URL to manage the active subscription of the Customer. If the Customer has an active iOS subscription, this will point to the App Store, if the Customer has an active Play Store subscription it will point there.
     *
     * If there are no active subscriptions it will be null.
     *
     * If the Customer has multiple active subscriptions for different platforms, this will take the value of the OS in the `X-Platform` header into consideration:
     *
     * - If the request was made on an OS for which there are active subscriptions, this will return the URL for the store that matches the header.
     * - If the request was made on a different OS or the OS was not included in the X-Platform header, this will return the URL for the store of the subscription with the farthest future expiration date.
     */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    management_url: string

    /** Non-subscription purchases of the Customer, keyed by the product identifier. */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    non_subscriptions: Record<
      string,
      {
        /** A unique ID of the purchase. */
        id: string

        /** Whether or not the purchase was made in sandbox mode. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        is_sandbox: boolean

        /** Date of the purchase (in ISO 8601 format). */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        purchase_date: string

        store: RevenueCatStore
      }
    >

    /** The App User ID under which this Customer was first known to RevenueCat. */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    original_app_user_id: string

    /** _Only available on iOS_. This will be `null` until an iOS receipt is sent for the Customer. After a receipt has been sent, it will indicate the first App Store version of your app that the Customer installed. */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    original_application_version: string

    /** _Only available on iOS_. The date that the app was first purchased/downloaded by the Customer. Will be `null` if no receipt is recorded for the Customer. Useful for [Migrating Subscriptions](https://www.revenuecat.com/docs/migrating-to-revenuecat/migrating-existing-subscriptions). */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    original_purchase_date: string

    /** @deprecated */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    other_purchases: undefined

    /** A dictionary of any Attributes set on this Customer. **Only included in responses to requests made with a secret API key**. */
    // biome-ignore lint/style/useNamingConvention: <explanation>
    subscriber_attributes: Record<
      string,
      {
        /** The value of the attribute. */
        value: string

        /** The time that the Attribut was last updated, in milliseconds since Epoch. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        updated_at_ms: number
      }
    >

    /** Subscription purchases of the Customer, keyed by the product identifier. */
    subscriptions: Record<
      string,
      {
        /** Date when the subscription will automatically resume after being paused (in ISO 8601 format). Google Play only. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        auto_resume_date: string

        /** Date when RevenueCat detected any billing issues with this subscription (in ISO 8601 format). If and when the billing issue gets resolved, this field is set to `null`. Note the subscription may still be active, check the `expires_date` attribute. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        billing_issues_detected_at: string

        /** Date when the subscription expires/expired (in ISO 8601 format). */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        expires_date: string

        /** Date when any grace period for this subscription expires/expired (in ISO 8601 format). `null` if the Customer has never been in a grace period. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        grace_period_expires_date: string

        /** Whether or not the purchase was made in sandbox mode. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        is_sandbox: boolean

        /** Date when this subscription first started (in ISO 8601 format). This property does not update with renewals. On iOS, this property also does not update for product changes within a subscription group or resubscriptions by lapsed subscribers. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        original_purchase_date: string

        /** How the Customer received access to this subscription */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        ownership_type: OwnershipType

        /** Type of the current subscription period_type */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        period_type: PeriodType

        /** Date when the last subscription period started (in ISO 8601 format). */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        purchase_date: string

        /** Date when RevenueCat detected a refund of this subscription. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        refunded_at: string

        /** Identifier of the store of the purchase */
        store: RevenueCatStore

        /** Date when RevenueCat detected that auto-renewal was turned off for this subsription (in ISO 8601 format). Note the subscription may still be active, check the `expires_date` attribute. */
        // biome-ignore lint/style/useNamingConvention: <explanation>
        unsubscribe_detected_at: string
      }
    >
  }
}
