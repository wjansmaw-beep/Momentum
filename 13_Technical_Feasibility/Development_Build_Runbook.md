# Development Build Runbook

Status: Operational  
Version: 1.0

## Purpose

Run Momentum on a real device with the native capabilities required for Stage 1, without treating Expo Go as a product constraint.

## Prepared configuration

- `expo-dev-client` provides the development runtime.
- `eas.json` contains an internal physical-device profile and a separate iOS Simulator profile.
- The existing Expo config remains the source for app identity, native plugins and permission text.

## First physical iPhone build

This step is intentionally not automated because it requires the Founder to authenticate with Expo and Apple and may require a paid Apple Developer membership.

From the repository root:

```text
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile development
```

Follow the signing prompts and install the resulting internal build on the registered iPhone. Then start the JavaScript development server with:

```text
npx expo start --dev-client
```

The computer and phone should normally be on the same network. If local discovery fails, use Expo's tunnel option as a temporary development fallback.

## Simulator build

The `development-simulator` profile is only for an iOS Simulator and therefore requires a Mac to run the resulting build:

```text
npx eas-cli@latest build --platform ios --profile development-simulator
```

## Validation target

The first physical-device session validates only:

1. the complete active-entry flow;
2. the progressive foreground location request;
3. permission denial and fallback;
4. the Apple Maps handoff;
5. return to a quiet Presence state.

Do not add Calendar, HealthKit, background location or generative AI merely to justify the development build.

## Official references

- [Expo: Create a development build](https://docs.expo.dev/develop/development-builds/create-a-build/)
- [Expo: Configure EAS Build with eas.json](https://docs.expo.dev/build/eas-json/)

