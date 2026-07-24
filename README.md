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
- Opportunity Engine v2, which withholds raw signals until public destination, source window, sensitivity, chosen travel limit, round trip, meaningful experience time, and return buffer all fit;
- honest evergreen fallback when a source is unavailable.

Calendar is the first private context source. In an iOS development build, the user can connect it from Profile; Momentum derives free windows locally and immediately discards titles, notes, locations, attendees, and identifiers. The web preview and Expo Go retain manual time input because real Calendar access is unavailable there.

HealthKit, background location, and accounts are not connected. A local Generator Service fixture exercises complete adaptive capsules; behind the same validated boundary (ADR-056) the service also has provider adapters for OpenAI, Anthropic, and Moonshot, selected explicitly through `MOMENTUM_GENERATOR_PROVIDER`. The model adapters are covered by mocked contract tests but have not been runtime-tested with real API keys yet. Foreground approximate location is requested only after the user explicitly asks for nearby live context.

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

## Tests

Install dependencies with a clean `npm ci` (no extra flags required), then run the entire app test layer in one command:

```text
npm run test:app
```

This runs the TypeScript typecheck, the Generator Service contract tests, the affirmation unit tests, and the content/personal-memory scenario checks. Each layer can also run individually:

```text
npm run typecheck         # tsc --noEmit
npm run test:generator    # node --test services/generator/test/*.test.mjs
npm run test:affirmation  # node --test tests/affirmation.test.mjs
npm run test:scenarios    # content catalog + personal memory scenario checks (via tsx)
```

The scenario runners in `tests/` are TypeScript and execute through the `tsx` devDependency; they print a JSON summary and exit non-zero when any expectation fails.

## Optional eBird source

Create an uncommitted `.env.local` file:

```text
EXPO_PUBLIC_EBIRD_API_KEY=your_token_here
```

Restart Expo after changing the environment. `EXPO_PUBLIC_` variables are bundled into the client, so this is suitable only for the current development proof. Production must use a secure server-side adapter and never commit a token.

## Capsule Generator Service

For the complete local web flow, start the fixture service in a separate terminal:

```text
npm run generator:fixture
```

The web app automatically checks `http://127.0.0.1:8787/v1/experience-drafts`. When the service is unavailable, Discover falls back to device-local synthesis. `npm run test:generator` runs the provider contract tests (`node:test`, fully mocked; no API keys or spending required).

To use a model provider (ADR-056), select exactly one explicitly and set its server-only credentials before running `npm run generator`:

```text
MOMENTUM_GENERATOR_PROVIDER=fixture | openai | anthropic | moonshot
```

A missing or unknown value falls back to the fixture provider; the service never guesses a provider from which keys happen to be present, and `--fixture` remains the CLI shortcut. Per provider:

```text
OPENAI_API_KEY / OPENAI_MODEL             (default gpt-5.4-mini)
ANTHROPIC_API_KEY / ANTHROPIC_MODEL       (default claude-haiku-4-5-20251001)
MOONSHOT_API_KEY / MOONSHOT_MODEL         (default kimi-k2.6)
MOONSHOT_BASE_URL                         (default https://api.moonshot.ai/v1; use https://api.moonshot.cn/v1 for China-hosted keys)
```

Operational guard rails, all optional with conservative defaults:

```text
MOMENTUM_GENERATOR_TIMEOUT_MS             (default 20000)
MOMENTUM_GENERATOR_MAX_OUTPUT_TOKENS      (default 3200)
MOMENTUM_GENERATOR_DAILY_CALL_LIMIT       (default 100; 0 blocks all model calls)
MOMENTUM_GENERATOR_BUDGET_EUR             (default 10, the Founder ceiling; 0 blocks all model calls)
```

When the daily limit or budget is reached, the service stops model calls, serves the fixture path, and says so honestly (`budgetExhausted: true` in health and responses; the `mode` field always names what actually ran). Provider dashboards must also carry hard spending limits; see the runbook.

To connect a remotely deployed application-owned service, configure only its public endpoint URL in Expo:

```text
EXPO_PUBLIC_MOMENTUM_GENERATOR_URL=https://your-service.example/v1/experience-drafts
```

Never place a model-provider API key in an `EXPO_PUBLIC_` variable. The service owns the secret and accepts the minimal `experience-draft-v1` request described in ADR-036 and ADR-037. Both server and client may reject every draft. Live facts and route plans are not accepted from this endpoint. See `13_Technical_Feasibility/Generator_Service_Runbook.md` before any public deployment.

An accepted generated Capsule is not discarded after selection. It passes through the normal Guide Composer and quality audit, is stored locally with an active Prepare or Presence session, and can be reopened from its own optional Life Book memory. This continuity is local-only and does not imply an account or remote synchronization; see ADR-038.

On open, Momentum may also request one bounded contextual candidate for the current day part. The device sends only one experience direction the person explicitly selected plus time, company and explicit equipment state. The result is cached locally for six hours and competes in the normal `Now` and `Today` ranking. Goals, reflections, calendar content, location and live-source facts are excluded. Current environmental evidence may be attached afterwards by its own verified adapter; see ADR-039.

The Grounded Guide keeps that evidence separate from generated copy. Source windows are calculated from the original retrieval time, survive cache reads without being renewed, and are shown as `current until` or expired throughout the experience flow. Missing or expired evidence falls back to the complete evergreen guide; see ADR-040.

Living World evidence does not become a route card directly. Opportunity Engine v2 first establishes that the destination and complete time budget are responsible and executable. The in-app route budget is deliberately conservative; Apple Maps remains responsible for the actual route and travel time. See ADR-041.

Opportunity Engine v3 can then interpret compatible source-owned signals together. A suitable public outside place can receive current weather context, while every routed Opportunity gains an Arrival Plan for the time on site. This plan is behavioral guidance around a verified anchor—not invented route geometry—and immediate alternatives are diversified by Experience perspective. See ADR-042.
