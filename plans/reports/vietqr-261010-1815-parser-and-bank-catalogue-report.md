# VietQR parser and bank catalogue

Date: 2026-10-10 · Package: `@6pm/domain` · Folder: `packages/domain/src/vietqr/`

## What was built

| File | Role |
|---|---|
| `crc16.ts` | CRC-16/CCITT-FALSE over UTF-8 bytes (check value `123456789` → `29B1`) |
| `tlv.ts` | EMVCo TLV split/encode. Lengths are counted in characters (EMVCo), with UTF-8 bytes as a fallback |
| `parse-vietqr.ts` | `parseVietQR(raw)`, `maskAccount`, result types |
| `foreign-scheme.ts` | Detects PromptPay, PayNow, DuitNow, KHQR and any non-VN country code |
| `encode-vietqr.ts` | `encodeVietQR({ bin, account, amount?, note?, merchantName?, service? })` |
| `bank-directory.ts` | All 65 VietQR-listed banks and wallets (BIN, code, short name, legal name), plus ZaloPay |
| `bank-catalogue.ts` | `BANKS`, `findBankByBin`, `findBank`, `appStoreUrl`, monogram colours, iOS hand-off |
| `index.ts` | Public exports. `packages/domain/src/index.ts` gets one added line: `export * from './vietqr';` |

### Parser behaviour
- Order of checks: input that does not start with `0002` → `not_emv`. A format indicator other than `01` → `malformed`. A missing `6304xxxx` tail (which is also what truncation looks like) → `malformed`. A checksum mismatch → `bad_crc`. A broken TLV, or tag 63 not last → `malformed`.
- VietQR: any merchant account template (26–51, normally 38) with GUID `A000000727`. Sub-template 01 holds the BIN (6 digits) and the account (1–19 letters or digits). Service codes: `QRIBFTTA` → `account`, `QRIBFTTC` → `card`, `QRPUSH` → `merchant`. `QRCASH` and unknown codes → `unsupported`. If the service code is missing, the QR is read as `account`.
- Fields read: 01 (`dynamic` = `12`), 52 MCC, 53 currency (must be 704 when present), 54 amount, 58 country (must be VN when present), 59 name, 60 city, and 62 → 01 bill number, 05 reference label, 08 note. Text is NFC-normalised and trimmed. An empty field becomes null.
- Amount: `55000` and `55000.00` are both 55.000₫. Real decimals (`55000.50`) → `malformed`. Zero or absent → `null`.
- A foreign result carries `country`, `scheme` when known, and the QR's own `amount`, `currency` and `merchantName`. This supports the "Abroad" card's "Log ฿120 by hand".
- An EMV QR from Vietnam that is not on NAPAS (for example a VNPAY-style GUID) → `unsupported`.
- The result adds fields the brief did not list: `service`, `mcc`, `billNumber`, `referenceLabel`.

### Tests (Vitest, 52 new; the whole package passes 92/92)
These cover the design's preview payload (Bún chả Cô Lan, Vietcombank •••• 4821, 55.000₫, "2 suat bun cha"), published samples, both amount formats, Vietnamese diacritics (with lengths in characters and in bytes), card and merchant services, an unknown BIN, whitespace and lower-case CRC, the rejections, and foreign PromptPay (both transfer and bill), PayNow, DuitNow, KHQR and Japan. A fast-check round trip (encode → parse returns the same fields and a valid CRC) uses Vietnamese text and emoji. The catalogue tests check every required BIN, the wallets, uniqueness and iOS links.
The test fixtures were built, and their CRCs computed, with a separate Python implementation, so the tests do not only check the TS CRC against itself.

Commands run: `pnpm --filter @6pm/domain test` (8 files, 92 passed), `pnpm --filter @6pm/domain typecheck` (clean), `pnpm exec eslint packages/domain/src/vietqr` (clean), `pnpm exec prettier --write packages/domain/src/vietqr`. Nothing committed.

## Sources

| What | Source | Notes |
|---|---|---|
| BINs, codes, names (all 65) | https://api.vietqr.io/v2/banks (fetched 2026-10-10) | Copied verbatim into `bank-directory.ts` |
| BIN cross-check | SBV "List of Bank Identification Numbers" https://sbv.gov.vn/vi/w/bank-identification-numbers (as of 31 Dec 2023) | Agrees for MB, VCB, TCB, VPB, ACB, BIDV, VietinBank, Agribank, Sacombank, VIB, HDBank, MSB, SHB, OCB, SeABank. TPBank, Timo and Cake were not on the page as fetched, so they rely on VietQR only |
| iOS hand-off | https://api.vietqr.io/v2/ios-app-deeplinks, then each `https://dl.vietqr.io/pay?app=<id>` page, which holds the native `DEEPLINK` scheme and the App Store URL | Recorded for MB, VCB, TCB, VPB, ACB, BIDV, VietinBank, Agribank, TPBank, VIB (MyVIB 2.0), SHB, OCB, SeABank, HDBank, Cake, Timo |
| Published VietQR samples | https://pub.dev/packages/vietqr_gen | The static sample is valid. The dynamic sample declares length 18 for the 19-character "Thanh toan don hang", and its CRC fails; the tests use it as a real-world `bad_crc` case |
| DuitNow GUID `A0000006150001` | PayNet DuitNow QR MPM spec, https://docs.developer.paynet.my/docs/duitNow-QR/integration/QR-generation-specification/merchant-presented-mode/qr-data-object | |
| PayNet DuitNow example 1 | …/merchant-presented-mode/example | It carries format indicator `02` and a valid CRC (343F), so 6pm rejects it as `malformed` |

## Not verifiable / left out
- **iOS schemes for Sacombank, MSB, MoMo, ZaloPay and ViettelMoney** are not on VietQR's list, so they are left out (`ios: null`). No schemes were guessed.
- **Amount pre-fill:** the schemes only open the app. The design's "amount copied" clipboard flow is still needed. VietQR flags `autofill: 1` only for its own `dl.vietqr.io` universal links (MB, VietinBank, BIDV, OCB, ACB). Those links need the network and go through vietqr.io, so they were not used.
- **Monogram colours** are approximations of each brand's colour, not taken from brand guidelines. CLAUDE.md says colour comes through `@6pm/theme`, so design may want to own or replace these.
- **Wallet BINs:** VietQR lists MoMo (971025), ViettelMoney (971005) and VNPTMoney (971011) with NAPAS BINs. They are stored as `kind: 'wallet'` with those BINs instead of as "non-BIN entries". ZaloPay has no BIN.
- **PromptPay, PayNow and KHQR fixtures** are built from the documented structure, not taken from official sample strings. No official sample was found in the time spent. The KHQR check uses country `KH`, because Bakong has no GUID.
- No official NAPAS VietQR spec PDF was reachable. The structure follows the NAPAS fields as used by VietQR and the published generator libraries.

## Unresolved questions
1. Should a QR with a format indicator other than `01` that is clearly foreign (like PayNet's DuitNow example) say "foreign" rather than `malformed`? The brief says to reject a wrong format indicator, so it is rejected for now.
2. `QRPUSH` merchant QRs are parsed (`service: 'merchant'`, with the merchant id in `account`), but the bank-app hand-off cannot pay a merchant id by typing it. Should the app hide "Pay with" for `merchant`, or tell the user to scan inside their bank app?
3. A QR with no service code is read as an account transfer (lenient). Should it be strict instead?
4. Text lengths counted in UTF-16 code units (an emoji counted as 2) are not handled. Characters and UTF-8 bytes are. Add this only if real QRs show it.
5. Hand-off needs every scheme in `LSApplicationQueriesSchemes` (`apps/mobile` app config), which another engineer owns.
6. Should the remaining VietQR-listed apps (LPBank, Eximbank, SCB, NCB, …) get iOS schemes from the same source? The data is available. Only the required banks were added.
