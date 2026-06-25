# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

Use GitHub's **"Report a vulnerability"** flow (repository → *Security* →
*Advisories* → *Report a vulnerability*). Include reproduction steps and the
affected platform/version. We aim to acknowledge reports within a few days.

## Scope & threat model

This is a privacy-first, **offline** demo: notes, chat history and AI inference
all stay on the device, and there is **no backend, account, or telemetry**. The
only network activity is downloading a model file over HTTPS from the configured
catalog URL. Bear that model in mind when reporting:

- In scope: anything that exfiltrates on-device data, tampers with the model
  download/integrity check, or enables code execution.
- Out of scope: the moderate `npm audit` advisories inherited from the React
  Native 0.76 toolchain (CLI/Metro) — these are dev-time only and tracked
  separately (see README "Packaging & security notes").

## Supported versions

This is a reference/demo project; fixes are applied to the `main` branch only.
