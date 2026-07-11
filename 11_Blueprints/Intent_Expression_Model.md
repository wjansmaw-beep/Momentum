# Intent Expression Model

Status: Directional interaction blueprint  
Version: 1.0

## Purpose

Discover lets people direct Momentum without requiring them to understand its categories or compose a chatbot prompt.

## Three entrances

1. **Surprise me** uses permitted context and states uncertainty honestly.
2. **Help me choose** starts with time and asks at most one adaptive question.
3. **I have something in mind** accepts the person's own short phrase.

## Open intent facets

Momentum may interpret temporary facets such as action, topic, company, setting, effort, desired outcome, time, travel tolerance, equipment, cost, and accessibility. These facets are open vocabulary and are not a user-facing taxonomy.

Examples validate breadth; they do not become the product categories.

## Authority order

1. explicit present-tense intent;
2. hard constraints and safety;
3. available time and setting;
4. explicitly desired outcome;
5. permitted current context;
6. durable preferences and recent patterns.

## Clarification

Ask one question only when the answer changes the viable candidate field or prevents a harmful assumption. Otherwise make one honest proposal. Free text should lead to action, not a chat transcript.

## Result policy

Return one recommended Experience Promise and at most one genuinely different alternative. The alternative exists for agency, not browsing. `Try another` must not create an infinite generation loop.

## Generative boundary

Language models may interpret and phrase. Feasibility, routes, opening times, allergens, safety constraints, and live claims require validated data or bounded templates. If reliable execution cannot be formed, Momentum narrows, asks, or abstains.

