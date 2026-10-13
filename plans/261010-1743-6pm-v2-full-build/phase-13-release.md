# Phase 13: Release

status: in progress

## Done

- Signed builds on `ai.sixpm.app` through `native-build.yml`; TestFlight 2.0.0-14 and -15 (13 Oct); -16 adds Budget together.
- App Store Connect, app 6504689878: version 2.0.0 created 13 Oct, set to **manual release**. Name, subtitle (App Information, both go live with 2.0.0), promotional text, description, keywords, What's New, support and marketing URLs, copyright and review notes filled in English and Vietnamese. "Sign-in required" is off: the app has no account.
  - en: "6pm: Safe to Spend Today" · "One money number, every day"
  - vi: "6pm: Hôm nay tiêu bao nhiêu" · "Một con số tiền, mỗi ngày"
- 9 look IAPs and the two Max subscriptions: prices, en + vi names, review screenshots and notes in place. They go to review with 2.0.0 (the first non-consumable must ride with a version).
- v1's Growth and Wealth subscriptions share the subscription group; RevenueCat grants `max` for them, so v1 subscribers keep Max.
- Screenshots uploaded 13 Oct, en + vi: iPhone 6.3" (1206×2622, the required slot), iPhone 6.9" (1320×2868) and iPad 13" (2064×2752). v1's screenshots were removed from every size, so smaller sizes scale from these. The iPad shots show the phone layout stretched; an iPad layout pass would improve them.
- Budget together server side, 13 Oct: D1 migration applied and the API deployed to dev and prd; Sign in with Apple key `44XFXJMB8T` (primary App ID ai.sixpm.app) set as `APPLE_SIGN_IN_KEY` / `APPLE_SIGN_IN_KEY_ID` on both Workers; server-to-server notifications on ai.sixpm.app point at `https://6pm.oddeggs.studio/api/v1/together/apple-events`. Saving that endpoint invalidated the App Store profile for ai.sixpm.app; it was regenerated in the portal with the same name and certificate T53KZ2Z6H4.

## Todo

1. Device check of Budget together on TestFlight: sign in, invite, join, add money, leave, delete account. The 6pm Dev app (ai.sixpm.app.dev) has no notification endpoint and is not grouped with the primary, so Apple events and token revocation only work for the store app.
2. Attach the build that ships (2.0.0-16 or later) once the device check passes.
3. Add the 9 IAPs and the 2 Max subscriptions to the 2.0.0 submission.
4. **On submission day, not before** (publishing changes the live 1.0.2 page at once):
   - App Privacy → Privacy Policy URL: `https://6pm.oddeggs.studio/privacy`.
   - App Privacy → Data Types, replacing v1's answers (no tracking anywhere):

     | Data type | Why it leaves the phone | Purpose | Linked to the user |
     |---|---|---|---|
     | Other Financial Info | Receipt email results held until the phone collects them; Budget together shared pots | App Functionality | Yes (Budget together is tied to the Apple ID) |
     | Emails or Text Messages | Receipt emails read on the server | App Functionality | No |
     | Other User Content | Ask 6pm questions and number-free receipt lines sent to DeepSeek | App Functionality | No |
     | User ID | Sign in with Apple for Budget together | App Functionality | Yes |
     | Device ID | Anonymous device token (hashed on the server) | App Functionality | No |
     | Purchase History | RevenueCat purchase status | App Functionality | No |
     | Crash Data | Sentry | App Functionality | No |

     Remove v1's Name, Email Address, Payment Info, Photos or Videos, Product Interaction, Performance Data and Other Diagnostic Data. Add Email Address only if Budget together asks Apple for the email scope.
5. Founder checks: Apple Developer membership renews **28 Oct 2026**, before launch; export compliance (`usesNonExemptEncryption: false` with SQLCipher on-device encryption); whether to reset the v1 summary rating on release.
6. Submit for review with time to spare before Fri 6 Nov 18:00 ICT, then release manually at launch.
