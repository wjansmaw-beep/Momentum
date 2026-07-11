# Momentum Repository Instructions

These instructions apply to the entire repository.

## Current phase

The Founder approved the document foundation on 2026-07-10 and requested the first application slice. Application code is allowed only for the bounded North Star prototype described in `08_Design/North_Star_Active_Flow.md` and `13_Technical_Feasibility/MVP_Technical_Boundary.md`. New integrations or product scope still require explicit approval.

## Read before acting

For substantive work, read the Constitution, `12_AI_Team/AI_Workflow.md`, `00_Project/Roadmap.md`, `00_Project/Open_Questions.md`, and every relevant domain document. Repository documents override prior chat summaries.

## Mandatory product preflight

Before proposing or implementing the next product step:

- identify the roadmap phase and deliverable the step advances;
- check whether an open question or existing decision constrains it;
- compare the proposal with every relevant approved flow, not only the latest implementation;
- state any mismatch between repository truth and the current app before extending the app;
- correct foundational flow mismatches before adding richness on top of them.

The current implementation is evidence, not product truth. A working flow must not silently replace the documented North Star.

Codex must explicitly select the appropriate working role for each substantive task. The Product Guardian role is always performed first; implementation begins only after that role has confirmed alignment or exposed the mismatch to be corrected.

## Product invariants

- Momentum uses technology to return attention to real life.
- The loop is **Understanding → Wonder → Momentum → Presence → Memory**.
- Hidden Gems are emotional promises, not merely locations.
- Momentum proposes; the user decides.
- Permissions are progressive and tied to immediate value.
- Momentum remains useful without optional permissions.
- One excellent suggestion is preferred over a feed.
- The promise is primary; “why this fits” is secondary and concise.
- Existing platform capabilities should be orchestrated instead of poorly rebuilt.
- Success is meaningful action outside the app, not screen time.

## Scope boundaries

- Do not use old PRIMX modules as product navigation or architecture.
- Do not add frameworks, dependencies, databases, APIs, or app scaffolding during the foundation phase.
- Do not invent live-world facts, health claims, platform capabilities, or access to private Apple data.
- Do not turn directional concepts into finalized requirements without approval.
- Do not change foundational principles without explicit Founder approval.

## Working style

- Distinguish fact, assumption, inference, and open question.
- Prefer simple, reversible decisions and small coherent changes.
- Give one supported objection when it materially protects the philosophy. If overruled, execute the chosen direction without repeatedly reopening debate unless safety or truth requires it.
- Preserve unrelated user changes and keep commits intentionally scoped.

## Documentation standards

- Use clear Markdown and descriptive headings.
- Include `Status` and `Version` in foundational documents.
- Link rather than duplicate rules when repetition could drift.
- Address privacy, autonomy, accessibility, and failure behavior where relevant.
- Use examples to clarify principles, not freeze unapproved UI.

## Definition of done for document changes

- The subject can guide later design or engineering.
- It is consistent with the Constitution and related documents.
- Contradictions and important open questions are visible.
- No application code or speculative infrastructure was introduced.
- Changes pass `git diff --check` and are intentionally committed when requested.
