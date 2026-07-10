# ADR-009: Use an Expo development build for real-device validation

Status: Accepted  
Date: 2026-07-10

## Context

The interaction proof now includes a native foreground-location capability and an Apple Maps handoff. Expo Go is useful for quick previews but is not the product runtime and must not constrain future native work.

## Decision

Prepare an Expo development-client build before expanding Stage 1 native capabilities.

- Keep the project in Expo and React Native.
- Use EAS Build for signed iOS cloud builds from Windows.
- Keep separate profiles for a physical development device and the iOS Simulator.
- Do not trigger a signed Apple build until the Founder chooses to authenticate and proceed.
- Validate the current bounded flow on-device before adding broader Apple integrations.

## Consequences

- Momentum can adopt native modules and config plugins without migrating editors or rebuilding the project architecture.
- A physical iPhone build requires Apple signing and normally a paid Apple Developer membership.
- The development-client app must be rebuilt when native dependencies or native configuration change.
- JavaScript-only changes can continue through the development server without a new native build.

## Philosophy alignment

This is infrastructure for validating one honest, progressive capability. It does not expand product scope and does not create permission pressure.
