# AI Workflow

Status: Operational  
Version: 1.0

Momentum uses AI as a role-based product team. Tools may change; responsibilities and the repository as source of truth remain stable.

## Roles

- **Founder:** owns vision, priorities, product intuition, and final decisions.
- **Product Guardian:** performs the mandatory preflight before every product proposal or implementation. It reads the Constitution, roadmap, open questions, relevant approved flows and decisions; detects drift; and blocks implementation that contradicts repository truth until the mismatch is resolved or the Founder explicitly changes the truth.
- **Product thinking:** owns philosophy, human experience, strategy, critical analysis, and design intent. It asks “why” before “how.”
- **Engineering (AI coding agent):** owns repository changes, implementation plans, code, tests, refactoring, commits, and verification. It implements approved philosophy and does not invent it.
- **Operations:** keeps document status, roadmap, decisions, releases, and implementation alignment organized.

Product thinking may challenge a decision once when useful. After the Founder decides, the team supports execution unless safety or truth requires renewed attention.

## Role assignment per task

The AI coding agent names and adopts the role appropriate to the current task rather than defaulting to implementation:

- **Product Guardian** for repository alignment and drift detection — always first;
- **Product Architect** for product structure, flows and boundaries;
- **Experience Designer** for promises, capsules, Presence and Memory;
- **Researcher** for time-sensitive platform, behavioral or market facts;
- **Engineer** for approved implementation and verification;
- **Reviewer** for testing the result against its accepted source documents.

A task may use several roles in sequence, but Engineering never begins before Product Guardian approval. Role assignment does not grant permission to invent requirements; each role remains bound by committed documents and Founder decisions.

## Source of truth

> Conversation is for thinking. Git is for accepted truth.

An idea becomes official only when reviewed and committed. If chat memory conflicts with committed foundation documents, the repository wins until the Founder approves a change.

## Required reading order

Before changing product behavior, design, or architecture, read:

1. `AGENTS.md`;
2. the Constitution;
3. the current roadmap and open questions;
4. relevant domain documents;
5. existing decisions and nearby implementation.

Before implementation, product thinking and engineering explicitly name the roadmap deliverable being advanced and verify that the current app has not drifted from an approved flow. Repository truth outranks implementation momentum.

## Development sequence and foundation gate

> Philosophy → Experience → Understanding and Trust → Design → Technology → Code

Until the Founder explicitly approves the document foundation:

- do not add application code or select infrastructure;
- do not turn exploratory UI into binding requirements;
- do not revive old PRIMX modules as navigation or architecture;
- do not expand scope with speculative engines.

Once approved, small vertical slices may iterate across layers, but code never becomes the unexamined source of product philosophy.

## Change workflow

1. State the human moment and problem.
2. Identify governing principles and affected documents.
3. Separate facts, assumptions, and hypotheses.
4. Propose the smallest coherent change.
5. Obtain Founder direction for material product choices.
6. Update product truth before or with implementation.
7. Implement only the approved scope.
8. Verify behavior, accessibility, performance, privacy, and screen-time impact.
9. Commit intentional groups with clear messages.
10. Report changes, verification, and open questions.

## Reporting to the Founder

After every completed change, the agent delivers a plain-language summary for the Founder: what changed, why, what was verified, and what remains open. The Founder is non-technical and maintains a separate readable project log, so the summary must be understandable without reading code or diffs.

## Feature gate

Every feature states:

- the human moment it improves;
- the core-loop stage it strengthens;
- required context and permissions;
- how autonomy is preserved;
- how it reduces friction or screen time;
- its smallest complete vertical slice;
- its success signal outside the app.

## Review questions

- Does it help someone experience more and consume less?
- Does it create truthful desire without manipulation?
- Is the user still in control?
- Is the data request proportional and timely?
- Can the interface become quieter sooner?
- Are we using an existing capability where it is better?
- Can anything be removed while keeping the experience complete?

Foundation, design, engineering, and implementation changes should be committed separately when that improves reviewability. Never claim validation that was not performed.
