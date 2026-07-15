# Momentum

Momentum is a companion for living: it uses context to help people notice, choose, begin, experience, and remember meaningful moments while spending less time on their phone.

The product architecture is global. Dokkum is the first validation region; source adapters, regional cache cells, dates, and graceful fallbacks do not assume one permanent city or country.

> Understanding -> Wonder -> Momentum -> Presence -> Memory

## Start here

1. [`01_Constitution/Manifesto.md`](01_Constitution/Manifesto.md)
2. [`01_Constitution/Core_Principles.md`](01_Constitution/Core_Principles.md)
3. [`02_Experience/Experience_Loop.md`](02_Experience/Experience_Loop.md)
4. [`12_AI_Team/AI_Workflow.md`](12_AI_Team/AI_Workflow.md)

See [`AGENTS.md`](AGENTS.md) for repository-wide rules.

## Current prototype

The Expo/React Native prototype implements four connected surfaces:

> Now / Today / Discover -> Experience Promise -> preparation -> Presence -> optional Memory

Now, Today, and Discover share a transparent local decision engine. Complete staged Capsules cover food, workouts, quiet experiences, family activities, learning, and route handoffs.

The first Living World slice uses:

- live Open-Meteo weather, wind, visibility, sunrise, and sunset for a bounded region;
- bounded Open-Meteo Marine model context for waves, current, and sea-level trend, never presented as navigation or a safety guarantee;
- nearby OpenStreetMap place leads with conservative opening-status interpretation and local verification;
- European AQI and seasonal pollen model context without personal health inference;
- optional recent public eBird observations when a token is configured;
- a Nature Guard, sourced dynamic Experience Promise, time-budgeted route request, Apple Maps handoff, and Memory boundary;
- honest evergreen fallback when a source is unavailable.

Calendar is the first private context source. In an iOS development build, the user can connect it from Profile; Momentum derives free windows locally and immediately discards titles, notes, locations, attendees, and identifiers. The web preview and Expo Go retain manual time input because real Calendar access is unavailable there.

HealthKit, background location, accounts, and generative AI are not connected. Foreground approximate location is requested only after the user explicitly asks for nearby live context.

## Run

```text
npm install
npm run typecheck
npm start
```

Real Calendar access requires a fresh development build after installing `expo-calendar`:

```text
npx eas build --profile development --platform ios
```

## Optional eBird source

Create an uncommitted `.env.local` file:

```text
EXPO_PUBLIC_EBIRD_API_KEY=your_token_here
```

Restart Expo after changing the environment. `EXPO_PUBLIC_` variables are bundled into the client, so this is suitable only for the current development proof. Production must use a secure server-side adapter and never commit a token.

## Optional capsule generator

Discover works without an external generator: it locally combines validated experience building blocks. To connect a real generative service later, configure only an application-owned endpoint URL:

```text
EXPO_PUBLIC_MOMENTUM_GENERATOR_URL=https://your-service.example/generate-experiences
```

Never place a model-provider API key in an `EXPO_PUBLIC_` variable. The endpoint owns the secret and accepts the minimal `experience-draft-v1` request described in ADR-036. It returns an object with a `drafts` array containing complete Experience fields. The client treats the response as untrusted and may reject every draft. Live facts and route plans are not accepted from this endpoint.
