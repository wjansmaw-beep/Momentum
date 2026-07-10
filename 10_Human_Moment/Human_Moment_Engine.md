# Human Moment Engine

Status: Directional  
Version: 1.0

## Purpose

The Human Moment Engine describes what is happening in a person's life now before Momentum considers what they could do.

An activity is never the starting point. A walk, recipe, workout, breathing exercise, cultural visit, or family experience is a possible response to a moment. The engine protects Momentum from becoming a catalogue that merely matches users to content.

Its central question is:

> What kind of human moment is this, and what room does it create?

## Human moment definition

A **Human Moment** is a temporary, meaningful situation created by the relationship between:

- available time and timing;
- place and practical reach;
- energy and capacity;
- company and social setting;
- commitments and constraints;
- relevant conditions in the living world;
- durable preferences and recent patterns;
- anything the user explicitly says about the present.

A Human Moment is not a raw signal. "Sunny," "at work," and "high energy" are context signals. "An unexpected free hour at work with enough energy to move" is a Human Moment.

A Human Moment is also not an activity request. "I want a walk" is explicit intent. "I unexpectedly have one hour" describes a moment while leaving the experience open.

## Relationship to Intent and Understanding

The layers answer different questions:

| Layer | Question | Example |
|---|---|---|
| Context | What signals are available? | Calendar gap, 55 minutes, near work, dry weather |
| Human Moment | What is happening now? | An unexpected usable break during the workday |
| Intent | What does the person explicitly want or correct? | "I want a challenge" or "not outdoors" |
| Understanding | What does this combination mean? | There is room for an energizing, low-preparation experience |
| Selection | Which feasible experience fits best? | A nearby kettlebell session rather than a long walk |

Intent must not be removed or silently inferred from the moment. Explicit present-tense input outranks a conflicting preference inference, subject to safety and feasibility.

## Two entrances

### Passive recognition

Momentum notices a plausible moment from permitted context, such as an open afternoon with favorable conditions. It treats the moment as a hypothesis and may propose one experience or abstain.

### Active declaration

The user supplies information the system cannot reliably know, such as:

- "I unexpectedly have an hour."
- "I need calm."
- "We are together today."
- "I want to do something, but not leave work."

Both entrances converge before candidate selection. Active input does not open a separate library.

## Processing model

> Permitted context + explicit intent → Human Moment hypothesis → Understanding → candidate experiences → selection → Experience Promise → Experience Capsule

1. Gather only relevant, permitted, sufficiently fresh signals.
2. Separate observations from user statements and inferences.
3. Construct one or more moment hypotheses with confidence and expiry.
4. Ask one small question when ambiguity materially changes the result.
5. Pass the moment and any explicit intent to Understanding.
6. Generate and rank feasible experiences.
7. Present one truthful promise or abstain.

## Moment object

A Human Moment should later be representable with:

- time window and expiry;
- setting and location granularity;
- company, when explicitly known or safely provided;
- capacity signals such as energy and preparation tolerance;
- constraints and accessibility needs;
- relevant world conditions with provenance and freshness;
- explicit user statements;
- inferred opportunity or need, clearly marked as inference;
- confidence, ambiguity, and missing information;
- permitted uses and retention boundary.

This is a conceptual contract, not an approved technical schema.

## Boundaries

- Do not diagnose emotions, health states, relationships, or hidden motives.
- Do not convert every calendar gap into an invitation.
- Do not treat availability as consent to be interrupted.
- Do not confuse a recurring pattern with present intent.
- Do not preserve short-lived moment context longer than its value justifies.
- Do not force an activity when rest or no suggestion may fit better.

## Quality test

The engine succeeds when Momentum can explain the situation in ordinary language without sounding invasive:

> You have about an hour before your next commitment. You said you want some energy, and staying near work matters today.

It fails when it merely restates data, pretends to know an inner state, or jumps directly from one signal to an activity.

