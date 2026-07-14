# Product Surface Architecture

Status: Directional, approved for prototype  
Version: 1.0

## Purpose

Momentum offers different kinds of help without turning life into a content feed. Each primary surface answers one human question.

| Surface | Human question | Initiative | Selection density |
|---|---|---|---|
| Now | What may fit this moment? | Momentum | One promise or silence |
| Today | Where may the day hold room? | Shared | A few time-bound opportunities |
| Discover | What do I want to make room for? | User | One recommendation and one alternative |
| Life Book | What was worth remembering? | User | Memories, not recommendations |

## Now

Now is the most restrained surface. It has one visual center: a contextual Experience Promise. It shows desire, feasibility, action, compact rationale, decline, and a quiet entrance for newly available time.

Only one promise is rendered at a time, but the person can immediately replace it with a small, precomputed and meaningfully different alternative. The transition replaces the current visual world; it never reveals a row, stack, `view all`, or endless recommendation feed. The best match is first and the end of the finite set returns agency through active intent. See ADR-028.

## Today

Today is a temporal canvas rather than a dashboard. It may reveal morning, midday, afternoon, or evening opportunities when they are genuinely distinct and feasible. Empty time is not automatically filled, and a full day may receive no additions.

Each opportunity states its time window, promise, commitment, and status. Accepting can open preparation now or hold the experience for its time window. Today never uses legacy product modules as columns or balance scores.

## Discover

Discover begins with intent expression, not category browsing. The person can ask to be surprised, ask for help choosing, or state an intention in their own words. Momentum asks only a question that materially changes feasibility or direction.

Categories may support retrieval internally or appear as examples, but never define the vocabulary of human possibility. Explicit present-tense intent outranks durable preference inference.

## Life Book

Life Book stores meaningful traces: one photo, feeling, sentence, repeatable favorite, or shared moment. It avoids streaks, public comparison, and life scores. Memories can improve future matching only through visible, reversible learning.

## Shared transition

Every actionable surface converges on:

> Experience Promise -> Prepare -> Begin -> Presence -> Remember

The surface determines how the experience was found. The Capsule determines how it is lived.

## Navigation

The prototype uses `Nu`, `Vandaag`, `Ontdekken`, and `Leefboek` as primary destinations. Profile and context controls are available from the header. `Er is ruimte ontstaan` is an active-intent shortcut, not a fifth content destination.
