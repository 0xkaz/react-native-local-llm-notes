# react-native-local-llm-notes

> Run a **local LLM on iOS & Android** from React Native — a privacy-first
> AI notes app where every AI feature runs **on-device**, fully offline.

[日本語版 README → `README.ja.md`](README.ja.md)

This is a working **demo / reference** for shipping on-device generative AI in a
React Native app. The model ([Qwen 2.5 / Llama 3.2 in GGUF](#models--licensing))
runs locally through [llama.rn](https://github.com/mybigday/llama.rn) (a
llama.cpp binding) — your notes never leave the phone, and it works with no
network once a model is downloaded.

Not Expo — this is **bare React Native (CLI)** with the **New Architecture**
(TurboModules/Fabric), because the LLM needs native modules.

## What this demonstrates

- 🧠 **On-device LLM inference** on both iOS and Android via `llama.rn`
  (summarize, translate, proofread, tone-shift, continue writing, chat).
- 🔒 **Offline & private** — no server, no telemetry; text stays on the device.
- 📱 **One codebase, both platforms** — built and verified on an Android
  emulator (incl. real on-device generation) and the iOS simulator.
- 🧩 **Clean architecture** — a pure, framework-agnostic, unit-tested core
  behind a single `LlmEngine` seam, so the AI logic is testable without a device.
- 📥 **OS integration** — receive shared text (Android `ACTION_SEND`, iOS Share
  Extension), deep links (`ainote://`), localization (English / 日本語).

The app's display name is **"AI Memo"**; this repository is the demo project.

## Screenshots

| Notes | AI actions on a note | Settings & model |
|-------|----------------------|------------------|
| ![Notes list](docs/screenshots/notes.png) | ![AI actions](docs/screenshots/ai-actions.png) | ![Settings & model](docs/screenshots/settings.png) |

## Features

- **Notes** — create / edit / search / tag / pin / sort; **trash** with restore
  and undo; long-press a card for quick actions.
- **AI actions** (all on-device): one-line / 3-line / detailed **summary**,
  **TODO extraction**, **proofread & rewrite**, **translate** (EN↔JA),
  **tone change** (formal / casual), **continue writing**, **title generation**.
- **Streaming output** token-by-token, with a truncation notice when the model
  hits its token cap; apply a result back to the source note or save as new.
- **Chat** — a local assistant with on-device history.
- **Share-to-app** — add a note from another app's share sheet.
- **Model manager** — download / select / delete GGUF models.
- **Settings** — model, theme (light / dark / system), language, data wipe.

## Tech stack

React Native 0.76 (bare CLI, New Architecture) · `llama.rn` (llama.cpp) ·
react-native-paper (Material 3) · react-navigation (native-stack + bottom-tabs) ·
react-native-fs · AsyncStorage · TypeScript · Jest + testing-library.

## Architecture

A **pure, framework-agnostic core** is separated from the React Native and
native-module layers, so the business logic is fully unit-testable without a
device or an LLM.

```
src/
  core/                 # pure TypeScript — unit-tested, no RN imports
    llm/                # LlmEngine interface, prompts, output parsing, tasks
    notes/              # NoteStore (CRUD/trash/pin), search & sort, formatting
    settings/           # SettingsStore
    chat/               # ChatStore (persisted thread)
    models/             # model catalog + download state machine
    storage/            # KeyValueStorage port + in-memory impl
  app/                  # React Native UI (paper + react-navigation)
    screens/            # Notes / Editor / AiResult / Chat / Settings / Trash
    components/         # presentational pieces (StreamingResult, ChatBubble)
    services/           # context providers wiring stores + engine
    navigation/         # root stack + bottom tabs
    i18n.ts             # tiny en/ja string table + useT() hook
  native/               # device-only adapter (llama.rn) — not unit-tested
tests/                  # Jest unit tests for the core (+ tests/app for RNTL)
```

The key seam is the `LlmEngine` interface (`src/core/llm/types.ts`): on device
it is backed by `LlamaRnEngine` (llama.rn), and in tests by `MockLlmEngine`.
Stores depend on a narrow `KeyValueStorage` port (AsyncStorage on device,
in-memory in tests). Time and id generation are injected, so all behaviour is
deterministic under test.

## Models & licensing

The app ships a **single default model** — download it once from
**Settings → AI model** to enable the AI features:

| Model | Size (Q4_K_M) | Min RAM | License | Commercial use |
|-------|---------------|---------|---------|----------------|
| Qwen2.5 1.5B Instruct (default) | ~1.1 GB | 3 GB | Apache-2.0 | ✅ allowed |

It's the default because it is Apache-2.0 (commercial-friendly) and small enough
for most phones. The catalog is just an array in `src/core/models/catalog.ts` —
add more GGUF models there (e.g. Qwen2.5 3B under the Qwen Research License, or
Llama 3.2 3B under the Llama Community License); mind each model's license before
shipping.

## Quick start

Requires Node.js ≥ 18. Full native setup (Android SDK/NDK, CocoaPods, required
dependency pins, App Group / entitlements) is in
[`docs/native-setup.md`](docs/native-setup.md).

```bash
npm install
# Core checks (fast, no native build):
make lint        # ESLint over core + tests
make test        # Jest unit tests (pure core)
make test-app    # React Native component tests (testing-library)
make build       # type-check core + app/native layers

# Run on a device/simulator (after the native setup in docs/native-setup.md):
npm run android  # Android (emulator or device)
npm run ios      # iOS (simulator or device)
```

On first launch the model catalog is empty — open **Settings → AI model** and
download a model (Wi-Fi recommended; ~1.1 GB for the default Qwen2.5 1.5B).
AI features become available once a model finishes downloading and loading.

Using the engine directly:

```ts
import { LlamaRnEngine } from './src/native/LlamaRnEngine';
import { NoteAi } from './src/core';

const engine = await LlamaRnEngine.load(modelFilePath);
const ai = new NoteAi(engine);
const { text } = await ai.summarize(noteBody, 'threeLines');
```

## Status

Both platforms are **verified building and running**:

- **Android** (emulator, API 35 arm64): full app — notes, search, tags, pin,
  trash, settings, model **download → llama.rn load → on-device generation** —
  all confirmed end-to-end.
- **iOS** (iPhone 17 Pro simulator): builds (llama.rn C++ compiled), runs, full
  UI + bottom tabs + app icon + launch screen. Includes a **Share Extension**;
  shared text reaches the app via the `ainote://` deep link and a shared
  **App Group** container.

Remaining: on-device QA on physical hardware (large-model memory entitlement for
real iOS devices) and a real-device inference pass.

## Suggested GitHub topics

`react-native` · `on-device-ai` · `local-llm` · `llama-cpp` · `llama-rn` ·
`gguf` · `offline-first` · `privacy` · `ios` · `android`

## Packaging & security notes

This is a **reference/demo**, not a store-ready build:

- **Android release signing** uses the throwaway **debug keystore**
  (`android/app/build.gradle`). A `release` APK/AAB built from this repo is
  **not distributable** — generate your own keystore (and move secrets to a
  Gradle properties / env file) before shipping.
- **iOS bundle identifier & App Group** still use the React Native template
  default (`org.reactjs.native.example.AiNoteOfflineAiMemo`). Fine for a demo;
  change it (and the matching App Group used by the Share Extension) before
  distributing.
- **`npm audit`** reports some moderate advisories from transitive dependencies
  of the React Native 0.76 toolchain (CLI / Metro). They are not in the app's
  runtime path; clearing them requires a major RN/toolchain bump, tracked
  separately from this demo.
- **Bundled Hexagon binaries** (`android/app/src/main/assets/ggml-hexagon/*.so`,
  ~1.7 MB) are prebuilt Qualcomm NPU backends redistributed from `llama.rn`; see
  [`NOTICE`](NOTICE). They are unused on non-Qualcomm SoCs (inference falls back
  to CPU).

## License

MIT — see [`LICENSE`](LICENSE). Third-party components (llama.rn, llama.cpp,
bundled Hexagon libraries) are listed in [`NOTICE`](NOTICE). Bundled/downloaded
models carry their own licenses — see the table above.
