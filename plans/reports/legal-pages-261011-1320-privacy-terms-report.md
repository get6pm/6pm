# Privacy Policy and Terms of Use pages

## Pages and URLs

| Page | URL | Source |
|---|---|---|
| Privacy (en) | `/privacy` | `apps/web/src/legal/privacy.en.md` |
| Terms (en) | `/terms` | `apps/web/src/legal/terms.en.md` |
| Privacy (vi) | `/vi/privacy` | `apps/web/src/legal/privacy.vi.md` |
| Terms (vi) | `/vi/terms` | `apps/web/src/legal/terms.vi.md` |

Scheme: index.astro has no i18n (English, `lang="en"`), so English sits at the root and Vietnamese under `/vi`. Each page has a language switch and `hreflang` alternates.

Files created/changed (all under `apps/web` plus one app line):
- new: `src/layouts/legal-layout.astro` (header, "last updated", contents list from the markdown h2s, 680 px measure, light/dark via `prefers-color-scheme`, site fonts and colours, footer nav), `src/data/legal.ts` (OWNER/CONTACT_EMAIL, paths, UI strings), `src/pages/{privacy,terms}.astro`, `src/pages/vi/{privacy,terms}.astro`, the four `src/legal/*.md`.
- changed: `src/layouts/page-layout.astro` (optional `lang`, `alternates`, `themeColors`; canonical now drops `.html`), `astro.config.mjs` (`build.format: 'file'` so `/privacy` is served as `privacy.html` with no trailing-slash redirect under `auto-trailing-slash`; index canonical verified unchanged `/`), `src/components/site-footer.astro` (Privacy -> `/privacy`, new Terms -> `/terms`).
- app: `apps/mobile/src/features/purchases/products.ts` `LEGAL_LINKS.terms` = `https://6pm.oddeggs.studio/terms` (was Apple's EULA; Terms page incorporates Apple's EULA by link).

## Facts each claim rests on

- Encrypted on-device DB, key in Keychain this device only: `apps/mobile/src/db/database-key.ts` (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`), `app.config.ts` (`expo-sqlite` `useSQLCipher: true`). "Data does not move to a new phone without a backup" follows from the this-device-only key.
- No account: tech-decisions §1 Auth; no sign-in code in mobile.
- Anonymous device ID, only SHA-256 hash + language + created/last-seen stored, used for daily counts: `apps/api/src/routes/devices.ts`, `device-auth.ts`, `migrations/20261010120000_devices_and_ai_usage.sql`.
- IP only as rate-limit counter key, not stored: `apps/api/src/rate-limit.ts`.
- Waitlist (email, language, optional leak figure, created time, ticket): `routes/waitlist.ts`, `migrations/20261010120210_waitlist.sql`, `apps/web/src/scripts/waitlist-forms.ts` (leak sent only on join). Website: no cookies/localStorage/analytics (grep of `apps/web/src`), fonts self-hosted (`public/fonts/README.txt`).
- Purchases: `react-native-purchases` configured with only an API key, no app user id, so RevenueCat's anonymous id (`revenuecat-port.ts`). Looks one-time, Max monthly/yearly, 7-day trial: product-decisions §5, `products.ts`; "Manage" and "Restore": `max-sheet.tsx`, `revenuecat-port.ts`.
- OTA updates: `expo-updates` with `https://u.expo.dev/...` in `app.config.ts`.
- Camera QR only, no audio: `app/scan.tsx` (`barcodeTypes: ['qr']`), `app.config.ts` camera plugin.
- Clipboard write only: `features/scan/bank-handoff.ts` (`setStringAsync`; no `getStringAsync` anywhere). Bank-app check via `canOpenURL`.
- Local notifications only, no push token: `features/onboarding/close-reminder.ts`, `app.config.ts` (`enableBackgroundRemoteNotifications: false`).
- Delete all data: `app/settings.tsx` (clears money data and language, cancels reminder).
- No analytics/crash SDK: `apps/mobile/package.json` has none (Sentry is listed in tech-decisions but is not a dependency).
- Backup wording: product-decisions §6, as briefed.
- Governing law Vietnam, children under 16: Vietnamese data-protection context; chosen conservatively, founder to confirm.

## Placeholders and open questions

- `{{OWNER}}` and `{{CONTACT_EMAIL}}`: no legal entity or contact email exists anywhere in the repo (only the `oddeggs.studio` zone and the Apple team id). Set both in `apps/web/src/data/legal.ts`; the layout fills the tokens at build. They are still literal in the build now, so do not deploy to prd before they are set. The site footer's "Contact" link is still `#`.
- Are the liability cap (amount paid in last 12 months), the 16+ age, and "courts of Vietnam" acceptable? Have a Vietnamese lawyer review before launch.
- What happens to a backup when Max lapses? Pages say only "Max-only features stop"; a retention rule is not written down anywhere.
- Is device registration called by the app at this release? The mobile code does not call `/v1/devices` yet; the policy discloses it as it will behave.
- The in-app Settings privacy line ("Nothing goes to a server unless you turn on backup or forward a receipt email") is simpler than the policy (device ID, purchases, updates); consider aligning. Not my file.
- `docs/undesigned-states.md` row for "Max sheet Terms / Privacy links" is now stale (Terms no longer Apple's EULA; page exists). Not my file.
- Prices: terms say prices come from the App Store in-app; none hard-coded.

## Add when later features ship

- Receipt email forwarding (`{handle}@6pm.oddeggs.studio`): the forwarded email is processed on our server, held encrypted until the phone fetches it, then deleted (product-decisions §4). Add to Privacy "What leaves", and Cloudflare Email Routing to the processors.
- Ask 6pm and merchant/category naming by a server model (DeepSeek, Jev): what is sent (question text, numbers-free line ids), the cost ledger `ai_usage` (model, token counts, device hash, no text), the model providers as processors, and "3 free questions a week" in Terms.
- Share extension, Apple Pay shortcut, voice (on-device Apple speech), Face ID, widgets/Live Activity: permissions and what stays on-device.
- Travel FX: FX provider, and that rates are fetched without personal data.
- Budget together: Sign in with Apple, shared ledger on server, partner data, deletion, invitations.
- Year book print: vendor, name and address handed over.
- Sentry/any crash reporting if added; remote push if added.
- Backup/export specifics: retention after lapse, in-app delete control, restore on a new phone.
- Update the "last updated" date in the four markdown files on every change.

## Verification

- `pnpm --filter @6pm/web typecheck` (astro check): 0 errors, 0 warnings.
- `pnpm --filter @6pm/web build`: 5 pages (`privacy.html`, `terms.html`, `vi/privacy.html`, `vi/terms.html`, `index.html`). Generated HTML checked: `lang`, canonical, hreflang, theme-color, 13/15 h2 sections per page.
- Screenshots via Playwright against a static server of the build, 390 and 1280 px, dark and light, all four pages: no horizontal overflow; header, contents, headings and body inspected on privacy (en), terms (en/vi). Fixed during review: missing space after "Last updated", hard glow edge.
- Prettier run on md/ts/mjs; `.astro` files have no prettier parser in this repo (existing ones are unformatted by it too). The site has no lint/test scripts.
- Not checked: deployed behaviour of `/privacy` under `auto-trailing-slash` (expected 200 without redirect), VoiceOver, legal review.

Status: DONE_WITH_CONCERNS
Summary: Privacy and Terms pages built in English (`/privacy`, `/terms`) and Vietnamese (`/vi/...`), matched to the site and to what the code does; Max sheet Terms link now points to `/terms`.
Evidence: astro check clean, site build passes, HTML and screenshots (390/1280, dark/light) inspected; no deploy.
Concerns/Blockers: `{{OWNER}}` and `{{CONTACT_EMAIL}}` are unset (set in `apps/web/src/data/legal.ts` before prd deploy); legal review of liability cap, age, jurisdiction; stale rows noted above in files I do not own.
