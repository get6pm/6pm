# On-device mode: AI that never leaves the phone

Status: planned · 15 Oct 2026 · Branch per phase, from `main`
Decided by the founder 15 Oct 2026: a person can choose to keep all AI on their iPhone. The choice is made in onboarding (with the model picked and downloaded there) and changed in Settings. Three local models are offered: Gemma 4 E2B, Gemma 4 E4B and Qwen3.5 4B. Jev is dropped. Voice in server mode moves to a realtime cloud transcriber, because Apple's on-device recognition is not good enough for Vietnamese.

## The two modes

| | Server mode (today, the default) | On-device mode |
|---|---|---|
| Reading Ask questions | Claude, then the phone's rules offline | The phone's rules, then the chosen local model for what they do not read |
| Ask answers and companion lines | Claude words them; the catalogue offline | The catalogue, or the local model with the swap-back check |
| Money questions with no lookup ("lãi kép là gì") | Claude answers (new, below) | The local model answers |
| Receipt photos the phone cannot read | Claude reads the photo | Apple's text reading only; Gemma reading the photo if the spike shows it works |
| Naming a shared receipt's payee | Claude | The name the phone read, or the local model |
| A category's icon | Claude (Jev dropped) | The phone's keyword matcher, or the local model |
| Voice (Quick add, Ask, the close) | Realtime cloud transcriber (Deepgram or ElevenLabs) | Apple's on-device recognition |
| Receipt emails | Available | Not available; the screen says why |
| Exchange rates, app updates, purchases | Unchanged | Unchanged: only a date, a version check, an anonymous purchase id |
| Crash reports (Sentry) | On | Off |
| Trip location (travel mode) | Apple turns a position into a city | Region and time zone only |
| Encrypted backup, Budget together | Available | Open: see Decisions |

Every outbound AI call goes through one gate on the phone (`ai-mode.ts`): in on-device mode it refuses before a request is built, so no feature can forget the setting. The Share extension reads the mode from the App Group.

## What makes a local model safe to ship

From the spike (15 Oct, 171 Ask questions, 24 lines, 10 free questions, five models, scored with the app's own checks):

- **Rules first.** The rules read 164 of 171 questions and never answer a different question than the one asked; models answered a different question 27–39 times. The model reads only what the rules call unknown.
- **Amounts from the phone, never the model.** Every model got some wrong ("Log 120k" as 1,2tr; "30 củ" as 300tr). The phone's parser (`moneyIn`) supplies the amount; a model reading that disagrees is dropped.
- **Distress and venting from the rules.** Models sent "stress vì tiền quá" to the crisis line; the rules decide those topics, the model never does.
- **Swap-back check on lines.** A value the model wrote as itself goes back to its placeholder; any other number fails the line, and the catalogue answers.
- **Examples in the prompt.** Without them small models invent fields; with about twenty examples they answer in the query's shape every time. Constrained decoding replaces them where the runtime has it.
- **Answers in the asker's language,** checked with the line validator's language rule; a reply in the other language is dropped.

## Phases

| # | Phase | Work | Status |
|---|---|---|---|
| 0 | Decisions and docs | Product decisions §5–6 rows for both modes; privacy policy and App Store privacy labels drafted for both modes; Jev removed from the policy | todo |
| 1 | Drop Jev | Category icon: Claude through `generate` (server mode) and `suggestCategoryIcon` (device mode); delete `jev.ts`, `decide.ts`, `TYPESAFE_API_KEY` (env, examples, Worker secrets); tests | todo |
| 2 | The gate | `ai.mode` and `ai.localModel` settings (expo-sqlite, App Group copy for extensions); `ai-mode.ts` gate wrapped around Ask, `/v1/word`, receipt read (app and Share extension), name-merchant, category icon, voice; Sentry off and location by region in device mode; receipt emails hidden in device mode; tests that every outbound route refuses in device mode | todo |
| 3 | ~~Runtime spike~~ skipped: the founder tests on an iPhone 15 Pro after deploy | On an iPhone 17 Pro and an 8 GB iPhone: LiteRT-LM Swift (Gemma 4 E2B/E4B, official `.litertlm` builds) and whether it also runs Qwen3.5 4B; else MLX Swift for Qwen. Measure first-answer time, tokens/s, memory, heat over 10 minutes, cold load. Decide one runtime or two, and which phones get which model | todo |
| 4 | Local model module | Native module `local-model`: load, prewarm, generate with a time limit, unload under memory pressure; the increased-memory-limit entitlement (portal setup by hand, see the EAS capability note). Built on Google's LiteRT-LM 0.17.1 for all three models (Qwen3.5 4B has a `litert-community` build), its framework fetched and checked by the podspec; Qwen gets a fresh engine per answer (LiteRT-LM issue 3165) and the CPU below 12 GB | built, not yet run on a phone |
| 5 | Model download | The three model files from Hugging Face at a pinned revision with pinned SHA-256 (an R2 mirror later), background `URLSession` download with resume, Wi-Fi by default, stored outside iCloud backup, delete and re-download, free-space check before starting. Files, revisions and hashes in `features/local-model/model-files.ts` | built, not yet run on a phone |
| 6 | Device-mode routing | Ask: rules → local model → unknown, with the safety rules above; lines: catalogue or local model with swap-back; free money questions answered by the local model (new `explain` answer kind, also answered by Claude in server mode); payee naming and icons; the Model switch on dev Tools gains the local models | todo |
| 7 | Onboarding and Settings (designed with the Expo design and native UI skills against the design system) | Onboarding step "Where your AI runs": server or on this iPhone, the models this phone can run (name, size, speed, what it is best at), download progress, skip and come back; Settings → Privacy → AI with the same choice, the download, delete, and what each mode sends. Needs design: not in the prototype | todo |
| 8 | Voice in server mode | Spike: Deepgram Nova-3 and ElevenLabs Scribe v2 Realtime on 60 recorded Vietnamese and English spend phrases (amounts, "rưỡi", merchants, Southern and Northern speakers), word error on amounts and names, time to first word. Then: `/v1/voice/token` mints a short-lived token (Deepgram grant, 30 s; ElevenLabs single-use, 15 min), the phone streams 16 kHz PCM over the vendor's WebSocket, a per-device daily cap, the ledger row, retention off where the vendor allows it, Apple on-device recognition when offline or in device mode | built; the spike waits for vendor keys |
| 9 | ~~Evaluation~~ skipped: the founder tests on an iPhone 15 Pro after deploy | The 171-question set and the line cases run on the phone for each local model (an on-device harness under dev Tools); the voice set for the chosen transcriber; results in the plan | todo |
| 10 | Release | Privacy policy and labels live, TestFlight with both modes, founder read of the new Vietnamese copy | todo |

Phases 1 and 2 ship on their own. Phases 3 and 8 are spikes that decide the build of 4–6 and of voice.

## Decisions

Made:
- Exchange rates and app updates stay as they are in both modes.
- Receipt emails exist only in server mode.
- Jev is dropped.
- Three local models: Gemma 4 E2B (default: fastest, lightest, good lines and answers), Gemma 4 E4B (the best wording, for phones with more memory), Qwen3.5 4B (the best at reading questions).

Open, with defaults:
- **Encrypted backup in device mode:** allowed, as only ciphertext leaves and the key stays in iCloud Keychain *(default)*.
- **Budget together in device mode:** allowed, as it is an explicit sharing choice with a partner *(default)*.
- **Free and Max:** on-device mode gives Free users unlimited Ask; server Ask stays 3 a week on Free and unlimited on Max *(default, from the founder's earlier note)*.
- **Model files:** fetched from Hugging Face at a pinned revision with pinned SHA-256 for now; mirrored on our R2 before launch.
- **Transcriber:** chosen by the phase 8 spike. Cost either way is about $0.007 a minute (Deepgram Nova-3 streaming $0.0077, ElevenLabs Scribe v2 Realtime $0.39 an hour); a five-second spend is a fraction of a cent.

## Acceptance

- In device mode, a network trace of every flow (Ask, a companion line, Quick add by voice, a shared receipt, a new category, the close) shows no request to our server or any AI vendor beyond the unchanged ones above.
- Device mode on a phone that cannot run any of the three models offers only server mode, and says why.
- The Ask evaluation set on the phone: no reading answers a different question; amounts always the phone's.
- Voice in server mode beats Apple's on-device recognition on the Vietnamese set, measured.
- Domain, API and mobile tests for the gate, the routing and the safety rules; typecheck, lint, the native check, a simulator build where Swift changed.

## Known limits

- iPhone speeds and memory in this plan come from published benchmarks and Mac measurements until phase 3 measures them.
- Gemma 4 reading receipt photos is untested.
- Retention, from the vendors' docs on 15 Oct: Deepgram's `mip_opt_out=true` (sent on every session) keeps audio only while it is processed; ElevenLabs keeps logs unless the account has zero retention (enterprise), when `ELEVENLABS_ZERO_RETENTION=true` sends `enable_logging=false`. Vietnamese on Nova-3 streaming is listed but untested live.

## Sources

- Local model spike, 15 Oct 2026, Mac M5 Pro, MLX 4-bit builds, the app's own prompts and checks:

| Model | Ask right / 171 | Answered another question | Lines passing | Peak memory (Mac) | Mac tok/s |
|---|---|---|---|---|---|
| Gemma 4 E2B | 91 | 39 | 18 / 24 | 3.5 GB | 103 |
| Gemma 4 E4B | 105 | 36 | 18 / 24 | 5.1 GB | 62 |
| Qwen3.5 4B | 127 | 27 | 14 / 24 | 4.1 GB | 74 |
| Qwen3.5 2B | 87 | 60 | 20 / 24 after swap-back | 2.5 GB | 152 |
| Qwen3.5 0.8B | 52 | 81 | 16 / 24 after swap-back | 1.8 GB | 213 |

Apple's built-in model refused 5 of the 10 free money questions ("May contain unsafe content"). For comparison on the same set: Claude Haiku 161 right, the rules 164.
- [LiteRT-LM overview](https://ai.google.dev/edge/litert-lm/overview), [Gemma 4 E2B LiteRT-LM model card](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm), [apple-silicon-llm-bench](https://github.com/john-rocky/apple-silicon-llm-bench)
- [Deepgram models and languages](https://developers.deepgram.com/docs/models-languages-overview), [Deepgram token-based auth](https://developers.deepgram.com/guides/fundamentals/token-based-authentication)
- [ElevenLabs speech to text](https://elevenlabs.io/docs/capabilities/speech-to-text), [ElevenLabs streaming guide](https://elevenlabs.io/docs/cookbooks/speech-to-text/streaming)
