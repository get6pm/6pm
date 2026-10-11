# App icon concepts: report

Date: 2026-10-11. The current `apps/mobile/assets/icon/icon.png` is unchanged.
Files are in the scratchpad: `…/scratchpad/icon-concepts/final/`, named `concept-<n>-{light,dark,tinted}.png`, plus the comparison sheet `compare.png`.
How they were made: `icon-concepts/{lib.js,concepts.js,render.html,render.mjs,sheet.mjs}`. To re-render, run `node render.mjs [n,…]` and then `node sheet.mjs`.

## What is wrong with the current icon
- The antennae, feet, ears, shadow and glints all fight for space, so at 60 px the face turns to mush.
- A plain three-stop sRGB sunset looks like a stock gradient.
- Nothing in it says "six o'clock" or "close the day".

## How all four were built
- Each 1024² PNG is opaque 8-bit RGB with alpha stripped (`magick -alpha off`) and no rounded corners. Tinted files are pure grey.
- Colours come from the Golden Hour 18:00 keyframe (`#1a2456 → #b8336a → #ff6b35`, sun `#ffc53d`) and the companion's own fills, converted to oklch.
- Gradients are worked out per pixel in oklch along the short hue arc, with a smoothed segment blend so stops leave no Mach bands, and TPDF dither. A contrast-stretched check of the sky showed no banding.
- On near-black grounds, glows are mixed in oklab. Mixing them in oklch caused a hue jump that left a visible band.
- Strokes are 36–54 px at 1024, so they stay at least 2 px wide at 60 px. Fine detail was cut: no feet, ears, shadow or grain.
- Dark variants put the glyph on a near-black ground (oklch 0.13–0.17, a faint warm glow, no light background). In dark, the rays switch from ink to sun-gold.
- Tinted variants are a grey glyph on black, with the ink features kept dark so the face survives the tint.

## The concepts

### 1. Big-face companion
- **Idea:** the current character, cropped to its face so it fills the tile. The sun-over-sea body stays, with three bold rays and a big grin with tongue.
- **Why it works small:** the face is about 75% of the tile. The eyes are about 6×8 px at 60 px. The rays become three clean stubs.
- **Weakness:** it is the least "6pm". It says "cute sun app" more than "evening ritual".

### 2. Companion sunset (the companion as the setting sun)
- **Idea:** the companion is half-sunk on a calm horizon with its eyes closed and content. It is literally six o'clock, the day closing.
- The body's own pink "sea band" becomes the real sea. Four reflection bars cool from gold to rose as they sink.
- **Why it works small:** one big warm half-disc on a dark lower half. Even at 40 px it reads as a sunset with a face.
- Closed-eye arcs survive downsampling better than open eyes with highlights.

### 3. Six o'clock dial (pure symbol)
- **Idea:** a clock face that is also a sunset. The hour ticks above the horizon are the sun's rays, and the ticks below are their dim reflections. A single hand points down to 6 and doubles as the sun's light on the water. There is a pivot dot on the horizon.
- **Why it works:** it needs no character, so it suits serious mode, Live Activities and marketing. It reads clearly from 87 px up.
- **Weakness:** at 40–60 px the 11 ticks start to sparkle into noise, and in the home-screen mock it is the weakest of the four.

### 4. The sunset 6
- **Idea:** a cream Bricolage Grotesque "6" (wght 560). Its counter is a window onto the sunset, filled with the companion's own sun-over-sea colouring.
- It ties the number, the hour and the character together without drawing the character.
- **Why it works small:** a single huge glyph is the most legible shape on the sheet. The counter still shows as a warm dot at 40 px.
- **Weakness:** a numeral icon is less ownable and less warm than the companion. It also leans on Bricolage's fairly generic "6" silhouette.

## Recommendation
**Concept 2 (Companion sunset)** as the main icon. It fixes all three complaints:
- It is simple at small sizes.
- It replaces the generic gradient with a scene.
- It says "six o'clock / close your day" without any text.

It keeps the companion that the founder already loves and is the most distinctive in the home-screen mock, in both light and dark.

Runner-up is **concept 4**: the boldest graphic, and good for marketing or the website favicon. Concept 3 is a strong secondary mark (serious mode, notifications) rather than the app icon.

## Wiring in Expo (SDK 58)
Checked against `@expo/config-types@58.0.2` (`ExpoConfig.d.ts`). `ios.icon?: string | IOSIcons`, where `IOSIcons = { light?, dark?, tinted? }`. It overrides the top-level `icon`. It also accepts a path to an Icon Composer `.icon` directory.

```ts
// app.config.ts
icon: './assets/icon/icon.png',              // Android/web fallback stays
ios: {
  icon: {
    light: './assets/icon/icon-light.png',
    dark: './assets/icon/icon-dark.png',
    tinted: './assets/icon/icon-tinted.png',
  },
  // …
},
```

- Prebuild writes the three appearances into `AppIcon.appiconset`. This needs a native rebuild and is not OTA-updatable.
- Android keeps `icon` / `android.adaptiveIcon`. That would need its own foreground/background split of the chosen concept.
- The existing comment above `icon` in `app.config.ts` would need updating.

## Unresolved questions
- Apple's HIG allows the **dark** icon to have a transparent background, with the system supplying the dark backdrop. These were made opaque near-black, as the brief asked. Which one should ship?
- On iOS 26, an Icon Composer `.icon` (layered Liquid Glass) gives the system's glass and specular treatment. Concept 2 splits naturally into layers (sky, sun, sea, face). Is that worth a follow-up?
- Should the tinted version of concept 2 drop the reflection bars? They are mid-greys and turn muddy under some tints.
- Android adaptive icon for the chosen concept is not done.

Status: DONE
Summary: Built four distinct icon concepts (big-face companion, companion sunset, six o'clock dial, sunset 6), each as opaque 1024² light/dark/tinted PNGs, plus a comparison sheet with a size ladder and light/dark/tinted home-screen mocks. Concept 2 is recommended; the app's icon was not touched.
Evidence: Rendered with Playwright (Chromium canvas, per-pixel oklch + dither). Looked at every render at full size and in crops of the 180→40 px ladder, and iterated on the mouth (concept 1), glow banding on dark grounds, reflection colours (concept 2), tick weight and horizon (concept 3), and glyph size and weight (concept 4). A contrast-stretched sky crop showed no banding. `magick identify` confirms 1024×1024, 3-channel sRGB, opaque. Expo `IOSIcons` shape checked in the local config-types 58.0.2. Not checked: on-device rendering, the iOS 18/26 tint pipeline (tinted was simulated with a multiply), and the App Store Connect upload.
Concerns/Blockers: The opaque dark background is a deliberate choice (see unresolved questions).
