# ADR-022 — Air quality and pollen are environmental context

Status: Accepted  
Date: 2026-07-12

## Decision

Momentum adds the Open-Meteo Air Quality API as a public model source for the European AQI, PM2.5, and available seasonal pollen forecasts.

The signal describes the environment, not the user. Momentum does not infer allergy, illness, vulnerability, fitness, or medical need. It does not offer treatment or health advice.

## Behavior

- AQI and pollen are labelled as model or forecast data.
- Values expire after six hours.
- A very-poor European AQI suppresses the generated live outdoor opportunity; evergreen content and active intent remain available.
- Lower AQI values may appear as concise supporting evidence but do not claim that exercise is safe.
- Pollen can be shown as informational context only and must not personalize without a later explicit user preference and reviewed health-adjacent language.

## Consequence

Air context can prevent an obviously mismatched live outdoor push without becoming a health engine. Any future HealthKit or allergy personalization requires a separate decision and consent boundary.
