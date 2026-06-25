# Contributing

Thanks for your interest in improving **react-native-local-llm-notes** — a demo
of running a local LLM on iOS & Android from React Native.

## Project layout

A pure, framework-agnostic `src/core/` is unit-tested without a device or model;
the React Native UI lives in `src/app/`, and device-only native adapters in
`src/native/`. See [`README.md`](README.md) and
[`docs/native-setup.md`](docs/native-setup.md).

## Development setup

Requires Node.js ≥ 18.

```bash
npm install
make lint        # ESLint over core + tests
make test        # Jest unit tests (pure core)
make test-app    # React Native component tests (testing-library)
make build       # type-check core + app/native layers
```

Native (device/simulator) setup — Android SDK/NDK, CocoaPods, required version
pins, App Group / entitlements — is documented in
[`docs/native-setup.md`](docs/native-setup.md). For faster local model
downloads, see the "Local development" section there (`make serve-model`).

## Before opening a PR

- Keep business logic in `src/core/` and cover it with a unit test. The core
  must not import React Native.
- Run `make lint && make test && make test-app && make build` — all must pass
  (CI runs the same checks).
- Match the surrounding code style (TypeScript, existing naming/idioms).
- For user-facing strings, add both `en` and `ja` entries in `src/app/i18n.ts`.
- Keep changes focused; describe what you changed and how you verified it.

## Reporting bugs / requesting features

Use the GitHub issue templates. For anything security-related, see
[`SECURITY.md`](SECURITY.md) instead of filing a public issue.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
