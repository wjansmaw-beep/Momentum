# Context For AI Agents

Status: Active  
Version: 1.0

One-page onboarding for any AI assistant (Claude Code, Kimi, Codex, Cursor, or another tool) working on Momentum. Repository documents override prior chat summaries.

## Required reading order

1. `AGENTS.md` — repository-wide instructions, product invariants, and scope boundaries;
2. this file — orientation and working agreements;
3. `00_Project/Status.md` — the current application-code boundary;
4. `12_AI_Team/AI_Workflow.md` — roles, role assignment, and the change workflow;
5. the relevant domain documents for the task at hand (see the map below), plus the Constitution, roadmap, and open questions.

## Repository map

- `00_Project/` — project truth: `Status.md`, `Roadmap.md`, `Open_Questions.md`, and `Decisions/` (ADR-001 through ADR-055);
- `01_Constitution/` — the product constitution; never changed without explicit Founder approval;
- `02_Experience/` … `10_Human_Moment/` — domain documents per product layer (experience, understanding, wonder, intent, trust, living world, design);
- `11_Blueprints/` — experience blueprints;
- `12_AI_Team/` — how the AI team works (`AI_Workflow.md`);
- `13_Technical_Feasibility/` — technical feasibility assessments;
- `App.tsx`, `index.js`, `app.json` — Expo application entry points and configuration;
- `src/` — application code by domain (`content`, `context`, `decision`, `design`, `guidance`, `liveworld`, `product`, `profile`, `routing`, `sharing`);
- `services/generator/` — the local Generator Service (`server.mjs`, `contract.mjs`, `prompt.mjs`, `fixture.mjs`);
- `tests/` — scenario test runners.

## Tech stack and commands

Expo / React Native with `react-native-web`, TypeScript in strict mode.

- `npm install` — install dependencies;
- `npm run typecheck` — type-check without emitting (`tsc --noEmit`);
- `npm start` — start the Expo development server;
- `npm run generator:fixture` — run the Generator Service with the local fixture provider, no API key required.

## Working agreements

- Work on your own branch; deliver changes through a pull request, never directly on `main`.
- Write no code outside the ADR boundary recorded in `00_Project/Status.md`. New scope is formulated as an ADR proposal for the Founder.
- Distinguish fact, assumption, inference, and open question in every proposal and report.
- Never claim validation that was not actually performed.
- After every completed change, give the Founder a plain-language summary (see `12_AI_Team/AI_Workflow.md`).
