# ADR-062 — Real-Device Testing Through EAS Build Development Builds

Status: Approved by the Founder on 2026-07-24  
Version: 1.0  
Date: 2026-07-24

## Context

ADR-009 decided in principle that Momentum moves to an Expo development-client build before expanding native capabilities, with EAS Build as the cloud path for signed iOS builds from Windows, and deferred the first signed build until the Founder chose to authenticate. That moment has arrived:

1. The Founder now holds a paid Apple Developer account and wants to test the app on his own iPhone.
2. Development happens on Windows; local iOS compilation is impossible without a Mac, so a cloud build service is the only route to a signed iOS binary.
3. Since ADR-061 the app pins exact native module versions whose behavior must be validated as shipped: `react-native-reanimated` 4.3.1 with `react-native-worklets`, `react-native-maps` 1.27.2 with the OpenStreetMap tile overlay, and `expo-image-picker`. Expo Go ships its own built-in native versions and does not include `react-native-maps`, so Expo Go cannot prove the behavior of the real app.

The Founder approved this direction in conversation on 2026-07-24.

## Decision

- The path to real-device testing is an **EAS Build `development` profile build** (`developmentClient: true`, `distribution: "internal"`) installed on the Founder's registered iPhone. This activates ADR-009 rather than replacing it.
- The iOS identity is fixed as bundle identifier `com.wjansmaw.momentum` under the Founder's Apple Developer account; `cli.appVersionSource: "remote"` lets EAS manage app version and build numbers centrally.
- Interactive credentials stay manual and personal: the Expo account, `eas-cli login`, the Apple ID with two-factor authentication, and device registration via `eas device:create` are performed by the Founder only and are never scripted or committed.
- The operational procedure — one-time setup, build, installation, daily dev-client use, the generator story from the phone, costs, and the first-session checklist — is recorded in `00_Project/Device_Testing_Runbook.md`.
- The generator server keeps its current Origin enforcement. Live model generation from the phone is documented as a follow-up code change (LAN binding plus an explicit native-client allowance in `services/generator/server.mjs`), to be proposed and tested separately. Until then the phone runs the approved local synthesis path, which keeps the first device session fully functional offline.

## Scope boundaries

- This decision covers testing infrastructure only: build configuration, device registration, installation, and the documented workflow. It approves no new product features, accounts, or external integrations.
- No API keys, Apple credentials, or shared secrets enter the app, the repository, or any document.
- Public deployment of the generator service, app attestation, and App Store distribution remain unapproved future scope.
- The `preview` and `production` build profiles are configuration placeholders for later ADR-bounded decisions; only the `development` profile is activated now.

## Consequences

- `eas.json` gains the `cli` block; `app.json` gains the final iOS bundle identifier. No application code changes.
- The Founder performs the one-time interactive setup, runs the first cloud build, and validates the device session against the runbook checklist.
- JavaScript-only iteration continues through `npx expo start --dev-client` without new cloud builds; native dependency or configuration changes require a fresh EAS build (ADR-009).
- A follow-up ADR-bounded commit is required before live Kimi generation works from the phone (Origin allowance for native clients); the offline local synthesis path requires nothing further.
