# App Store listing

Everything the App Store product page needs, rendered from `design/prototype/6pm App Store Listing.dc.html`
and `StoreShot.dc.html`.

## Text

`apps/mobile/store.config.json` holds the name, subtitle, keywords, promotional text, description and
URLs for `en-US` and `vi`. Push it with EAS Metadata from `apps/mobile`:

```
eas metadata:push
```

The description opens with the design's three lines; the paragraphs after them follow the screenshot
captions.

## Screenshots

`screenshots/en-US` (International storefronts: captions in English, $, Apple Pay, cards) and
`screenshots/vi` (Vietnam: captions and the app in Vietnamese, ₫, VietQR, local merchants). Ten each (App Store Connect takes at most ten per device), 1320 × 2868,
for the 6.9″ iPhone slot; App Store Connect scales them down for smaller iPhones. Upload them in order:

| # | Caption keyword |
| --- | --- |
| 01 | safe to spend · daily budget · Today |
| 02 | close your day · The 6pm Close |
| 03 | log a spend · Apple Pay · VietQR · Quick add |
| 04 | can I afford it · Ask 6pm |
| 05 | budget planner · Plan |
| 06 | money diary · Diary |
| 07 | budget app themes · 3 live looks |
| 08 | companion · alternate icons |
| 09 | living scenes · Lantern River |
| 10 | on-device AI · offline · Gemma · Qwen · Claude |

01–03 share one sunset across the search results, so keep them first and together. The privacy
shot (encrypted · open source) was dropped for the ten-shot limit; the Privacy first custom product
page leads with 01 instead.

### iPad

`screenshots-ipad/{en-US,vi}`: six 2064 × 2752 shots for the 13″ iPad slot. Each is a real capture
of the developer build on the iPad Pro 13″ simulator (the Friday seed at 18:07, Golden Hour, $ for
en-US and ₫ for vi), set in an iPad frame under the phone set's caption for the same screen:
Today (01), the Close (02), Quick add (03), Plan (05), Diary (06) and Looks (07). The system status
bar is painted over with a clean 18:07.

### iPhone Duo

`screenshots-duo/en-US`: the ten shots of `design/prototype/6pm Duo Store Listing.dc.html`, in
order: outer display 01–05 (1398 × 2034, one sunset across them) and inner display 06–10
(2007 × 2853). The design's captions are English only, so the vi listing shows these too.
Rendered by element at 3×, with the lifted glass cards frosted and the set's rounded ends squared.

## In-app event (set up in App Store Connect)

| | en-US | vi |
| --- | --- | --- |
| Badge | Premiere | Ra mắt |
| Name (≤ 30) | The first 6pm Close | Lần chốt ngày đầu tiên |
| Short (≤ 50) | Close your first day at six, together. | Cùng chốt ngày đầu lúc sáu giờ. |
| Long | At 18:00 on launch day, everyone swipes their first close at the same moment. The sun sets on every Today screen at once, and the first morning number arrives at 6am. | 18:00 ngày ra mắt, mọi người cùng vuốt chốt ngày đầu tiên. Mặt trời lặn trên mọi màn hình Hôm nay cùng lúc, và con số buổi sáng đầu tiên đến lúc 6 giờ. |

Starts 6 Nov 2026, 18:00 (Asia/Ho_Chi_Minh).

## Custom product pages (set up in App Store Connect)

| Page | Lead screenshots | Keywords | Promotional text |
| --- | --- | --- | --- |
| Vietnam · VietQR / Ngân hàng Việt | 03 · 01 · 02 | vietqr, bank email, expense tracker vietnam / vietqr, email ngân hàng, sổ thu chi | Scan VietQR and it’s logged as you pay. Never asks for your bank login. / Quét VietQR là tự ghi. Không bao giờ hỏi mật khẩu ngân hàng. |
| Looks / Giao diện | 07 · 09 · 08 | aesthetic budget app, cute finance app / app chi tiêu đẹp, app tài chính dễ thương | 11 looks, from Sơn Mài lacquer to Neon Alley. Three of them move with the hour. / 11 giao diện, từ Sơn Mài đến Neon Alley. Ba cảnh động đổi theo giờ. |
| Privacy first / Riêng tư | 01 · 02 · 10 | private budget app, no bank login / app chi tiêu riêng tư, không liên kết ngân hàng | Never asks for your bank password. Encrypted on your iPhone. Open source. / Không bao giờ hỏi mật khẩu ngân hàng. Mã hoá trên iPhone. Mã nguồn mở. |

## App preview (30 s, not rendered yet)

| Time | Beat |
| --- | --- |
| 00–04 | The sun drops: Today in Golden Hour, the sun slides down its thread. |
| 04–12 | Spends land on their own: Apple Pay, receipt, bank email, voice. No keyboard. |
| 12–18 | One swipe at 18:00: the CLOSED stamp lands. |
| 18–25 | Tomorrow’s number counts up. |
| 25–30 | Icon, wordmark, “Close your day at six.” Hold on the dusk. |

Poster frame: 00:14, the CLOSED stamp.
