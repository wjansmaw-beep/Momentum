# Active Intent Entry — “I Have Time”

Status: Directional interaction blueprint  
Version: 1.0

## Purpose

This blueprint defines how a person actively tells Momentum that an unplanned opening exists. The interaction should feel faster than searching, lighter than chatting, and fully under the user's control.

The active entrance does not ask the user to choose an activity. It supplies the missing present-tense context needed to recognize a Human Moment.

## Product decision

The first prototype should use an **active entrance**. Momentum does not yet proactively infer that a calendar gap is available time.

This makes three things explicit:

- the person wants help now;
- the available time is genuinely theirs;
- Momentum may use the current permitted context for this selection.

Passive detection remains a later hypothesis that requires initiative controls and verified platform feasibility.

## Entry on the primary surface

The primary Experience Promise remains the visual center. Beneath or near its decline/redirection path is one quiet entrance:

> **I have time now**

Alternative contextual wording may be tested later:

- **I have a moment**
- **Something changed**
- **I have about an hour**

It must not compete with the main promise or resemble a permanent navigation tab.

## Interaction sequence

### State 1 — Time opens

A compact layer rises from the current surface. It asks:

> **How much time became available?**

Suggested choices:

- 15 min
- 30 min
- 1 hour
- 2 hours
- Until…

The user may enter an exact end time. Momentum should reason with the remaining window and protect a transition buffer; “one hour” never means a 60-minute activity.

### State 2 — Decide whether clarification adds value

Momentum immediately evaluates permitted context and asks:

> Would one additional answer materially change the candidate field or prevent a poor assumption?

If no, it proceeds directly to a proposal.

If yes, it asks one question. For the permission-light first prototype:

> **What would make this hour worthwhile?**

Choices:

- Come to rest
- Feel energized
- Be surprised
- Feel connected
- Challenge myself
- Choose for me

These are desired outcomes, not activity categories. **Choose for me** means “use what you responsibly know,” not permission to invent certainty.

### State 3 — Thinking transition

There is no chatbot transcript, loading theatre, or list of generated ideas. The compact layer returns into the primary surface while Momentum compares candidates.

If processing takes perceptible time, use restrained language such as:

> Finding something that truly fits the hour…

Do not imply that AI is reading the person's entire life.

### State 4 — One Experience Promise

The selected promise replaces the previous primary content as a new Now state. Within one glance the person sees:

- what they may experience or feel;
- the distinctive, truthful detail;
- total commitment and protected buffer;
- one action that begins preparation;
- a quiet correction path.

Example:

> **A strong half hour, without returning rushed.**  
> One kettlebell is enough for a complete session here. You will still have 18 minutes to change and settle.

Primary action: **Set up this session**  
Correction: **Something else fits me better**

### State 5 — Correct without restarting

The correction path preserves the known time and opens only the part most likely to be wrong:

- desired outcome;
- place boundary such as stay here or nearby;
- company;
- practical constraint.

The user should not have to repeat “one hour.” Momentum re-runs selection and shows one new proposal. It does not argue for the original choice.

### State 6 — Commit

Acceptance transforms the Experience Promise into its Capsule. Persuasion ends. Preparation begins in the same visual world.

## Adaptive questioning rules

Momentum asks at most one clarification before the first proposal unless safety makes another answer essential.

Ask when:

- the current place or ability to leave is unknown and would eliminate most candidates;
- several candidate families are equally plausible and desired state is unknown;
- company or accessibility materially changes feasibility;
- a health- or safety-adjacent experience cannot responsibly be selected.

Do not ask when:

- the answer is merely useful for personalization but not necessary now;
- existing explicit input already resolves the ambiguity;
- a permission-light proposal can be made honestly;
- the question exists mainly to improve future data.

When safety requires more information, Momentum may narrow the proposal, choose a safer candidate, or abstain instead of turning the interaction into an intake form.

## Permission moments

The active entrance must work without optional permissions. Permissions are offered only when the immediate benefit is concrete.

Examples:

- after selecting “Be surprised”: **Use approximate location to find something worthwhile within reach of this hour.**
- after selecting “Challenge myself”: **Use permitted recovery context to avoid choosing an intensity that may not fit today.**
- after repeatedly entering time manually: **Let Momentum notice open time in your calendar without using event titles.**

Declining keeps the flow moving with less-specific candidates. Permission prompts never appear as the price of continuing.

## First prototype states

The prototype should demonstrate these states without implementing real intelligence:

1. **Strong context:** time plus an explicit desired outcome produces one tailored promise.
2. **Low context:** time alone triggers the one desired-outcome question.
3. **Correction:** the user changes direction while preserving the time window.
4. **No suitable proposal:** Momentum says it does not see a good fit and offers a simple pause or lets the moment remain open.
5. **Commit:** the promise becomes a Capsule and the interface becomes quieter.

The prototype may use clearly labelled scenario data. It must not pretend to read real calendar, health, location, or Living World data.

## Accessibility

- The layer works with screen readers, Dynamic Type, keyboard/switch access, and reduced motion.
- Desired outcomes have text labels; color and symbols are supplementary.
- Time choices support an exact accessible entry rather than chips only.
- Motion communicates continuity but is never required to understand state.
- The proposal and correction path remain reachable without precise gestures.

## Emotional tone

The interaction should feel like saying to a trusted guide:

> I have a little room. Help me notice what this moment could become.

It must not feel like planning a schedule, completing onboarding, prompting a chatbot, or browsing a catalogue.

## Success criteria

The active entrance succeeds when:

- the person can declare an opening within seconds;
- the system asks no more than it needs;
- the user chooses a desired feeling rather than an activity category;
- one proposal feels specific and executable;
- correction is easier than searching;
- no optional permission is required;
- accepting moves directly into preparation;
- the interaction ends in action or respectful silence, not more content.

