# Moment Detection

Status: Directional  
Version: 1.0

## Purpose

Moment Detection turns permitted, relevant signals and explicit user input into a temporary Human Moment hypothesis. It does not secretly observe a life or continuously invent needs.

## Signal classes

- **Time:** current time, available window, deadlines, travel time, and expiry.
- **Place:** approximate setting, practical reach, and whether leaving is possible.
- **Commitments:** free/busy boundaries and user-provided constraints, not unnecessary calendar content.
- **Capacity:** explicit energy, preparation tolerance, and cautiously used permitted recovery indicators.
- **Company:** explicit current company or a user-managed plan; never assumed from private communications.
- **Environment:** weather, daylight, access, opening hours, and verified Living World conditions.
- **Preferences and history:** editable interests, accessibility needs, repetition, prior outcomes, and recent rejections.
- **Active intent:** present-tense statements that correct, constrain, or direct the moment.

## Detection sequence

1. **Trigger:** the user opens Momentum, provides active intent, or has opted into a bounded proactive surface.
2. **Minimize:** retrieve only signals that could affect this decision.
3. **Validate:** attach source, timestamp, confidence, sensitivity, and permission scope.
4. **Construct:** compose plausible moment hypotheses rather than jumping to an activity.
5. **Check ambiguity:** identify missing facts that could reverse the recommendation.
6. **Clarify or degrade:** ask one concise question, use a safe general experience, or abstain.
7. **Expire:** invalidate the moment when its window, place, company, or constraints materially change.

## Detection modes

### User-initiated

The strongest initial mode. The person opens Momentum or states what changed. The system can use current permitted context without assuming a desire to be interrupted.

### Bounded proactive

Momentum may surface a suggestion only after the user has chosen when and how initiative is welcome. Availability alone is not permission.

### Post-handoff

After a route, timer, or system capability handoff, Momentum may use only the state reasonably available to resume the capsule. It must not equate app return, elapsed time, or movement with confirmed completion.

## Confidence

Confidence concerns the moment description, not whether Momentum knows what is best for the person.

- **High:** explicit input plus current, compatible facts.
- **Medium:** several current signals support the same interpretation.
- **Low:** important context is missing, stale, conflicting, or inferred.

Low confidence should reduce specificity. It may lead to one question or no suggestion.

## Examples

### Unexpected work opening

Observed: a calendar gap and current time.  
Explicit: "My meeting was cancelled; I have 55 minutes and can train here."  
Moment: a time-bounded work break with permission for a local physical experience.  
Not inferred: that exercise is always preferred or medically appropriate.

### Evening at home

Observed: evening and no near-term commitment.  
Explicit: "I want something quiet."  
Moment: a low-friction wind-down at home.  
Not inferred: stress, poor mental health, or a need for treatment.

## Failure behavior

When a source is stale, permissions are absent, signals conflict, or detection feels invasive, Momentum should state what it knows, ask for the smallest missing input if worthwhile, offer a permission-light alternative, or remain silent.

Silence is a valid detection outcome.

