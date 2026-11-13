# ADR-078 — M6: ask your Guide

Status: Product goal and first extractive answer proof accepted; phased implementation underway
Version: 1.2
Date: 2026-11-13

## Product Guardian and authorization

Founder accepts the proposed M6 and requests elaborating and creating the goal. M6 advances Understanding and Wonder inside the existing Guide: ask about the current place, receive a concise supported answer, return naturally to the experience. This registration does not claim implementation or authorize public deployment, new providers or a budget increase. Start with Museum ’t Fiskershúske in the five-place Moddergat journey. M4 and M5 native/field checks remain separately open.

## Repository facts and amendments needed

- Generator Service currently serves /v1/experience-drafts and /v1/living-world-briefing; neither is a question-answer contract. FreshQuestion is editorial depth, not a free-question service.
- ADR-056 provider isolation, server-only keys, explicit provider selection and cost ceilings remain binding. Add an optional answering capability; unsupported providers must report unavailable, not silently switch or fabricate an answer.
- ADR-068's briefing relates supplied live-world facts to a step. Historical Q&A requires its own evidence contract; do not repurpose draft output or pretend briefing citations prove historical answers.
- ADR-063 permits native access on the private home network only. The fixed native header is not authentication. Live field access remains a separate deployment decision; M6 must disclose this delivery limit.
- ADR-076/077's calm shared Guide and manual chapter ownership remain. A single contextual disclosure fits; a separate chatbot tab, infinite conversation feed or parallel Guide does not.

## Experience design

One thin-rule row: **Vraag aan je gids**. Expanded: current place context, one input and up to three relevant example questions. Selecting an example fills the input; sending remains explicit. Show that the question is sent to the configured AI service before submission. No GPS/profile/memories are included.

Answer in approximately 60–120 Dutch words by default, expandable only when useful. Use normal reading typography and inline numbered citations, with source titles and checked dates under a disclosure. Keep uncertainty next to the affected claim. A supported partial answer is preferable to confidently filling gaps. Suggested prompts are candidates until evidence review: 'Hoe woonden gezinnen hier?', 'Waar werd de schouw voor gebruikt?', 'Wat aten vissersgezinnen?'. The food question must yield insufficient evidence unless suitable sources are actually found.

One current question/answer per chapter, kept only in memory for the active Guide visit. A follow-up may carry only the immediately preceding exchange from the same chapter, clearly bounded; no hidden history or durable profile learning. Collapse returns to the story without moving chapter, changing mode, marking completion or starting audio. Preserve typed text on a retryable failure. Changing chapter cancels the request; late responses never appear at a different place.

## Proposed evidence and service contract

Add a separate versioned endpoint inside the existing service, provisionally /v1/guide-answer with contract guide-answer-v1. Request: question, supported experience/chapter ID, evidence-pack version and optional bounded same-chapter follow-up. Server resolves a reviewed evidence pack; client-provided prose, URLs and instructions are never trusted as evidence.

Evidence records: stable source ID, authoritative title/URL, passage or checked factual summary, provenance, checked date, geographic/time scope and usage rights. Verify source material before writing fixtures or asserting food/history details. Reuse existing referenced sources where adequate; never infer facts from a URL alone. No uncontrolled runtime web browsing or new search service in the first slice.

Response: contract version, request/chapter identifiers, mode (fixture/model), status (answered/partial/insufficient-evidence), text segments, factual/interpretive segment kind and evidence IDs. Canonical source links come from the server registry, never model-authored URLs. Missing/unknown source IDs, malformed/oversized output or mismatched context fail validation. Facts must be supported by their cited passages; interpretation is explicitly distinguished. Schema validation and valid IDs alone do NOT establish entailment: curate fixtures, review a fixed evaluation set against passages and reject unsupported factual additions.

Historical sources are not live opening-hours or ticket-price evidence. Such questions may point to existing dated practical information with its existing expiry/unknown qualification. No invented current access, prices, distances or safety advice.

## Failure, privacy and operation

Reuse existing timeout, admission controls, rate/budget limits and cancellation. Adding an endpoint must not create a budget bypass. No provider keys on client. No automatic provider activation or model calls during fixture tests. No question/body logging or durable conversation storage by default; existing service logs must be audited for this new payload. Provider processing remains covered by the chosen configured provider; do not promise provider-wide zero retention from client behavior alone.

Offline or unavailable service: keep the main story and sources readable, show a concise unavailable message, allow retry. If a reviewed local explanation exists, label it editorial and do not present it as a fresh AI answer. Missing evidence: state the limitation, with a supported partial answer when possible. Loading is cancellable and must not block Guide navigation.

## Implementation phases

1. Source inventory and one visual question/answer prototype, including partial/unknown/unavailable states. Finalize a small reviewed evidence pack and evaluation set.
2. Pure contract validators, deterministic fixtures, server route and cancellation-safe client adapter. Reuse existing provider/budget boundaries. No live calls needed.
3. Shared Guide inline component in the museum chapter; keyboard, Dynamic Type, VoiceOver, Reduced Motion and themes. Existing renderer remains owner of the chapter.
4. Existing configured provider capability and constrained prompt, independently evaluated against the evidence pack. Unsupported configuration stays truthful. No public network exposure.
5. Regression checks, internal iPhone build and Founder review on the supported connection. Broader chapters only after the museum slice proves useful.

Expected files: services/generator/server.mjs; new guideAnswer contract/evidence modules; prompt/provider capability and tests; new client guidance answer validator/loader; one shared ui/guide disclosure; AdaptiveGuide.tsx; chapter content metadata only if required; package test script; project records. Verify exact provider files before edits. No session schema migration expected for temporary Q&A.

## Acceptance criteria

1. Main story, chapter navigation, all three themes and M1–M5 behavior remain intact.
2. Opening the row or selecting a prompt sends no request; sending has clear loading/error/cancel states.
3. Each factual claim in the reviewed evaluation set is supported by the cited evidence; no fabricated source IDs or URLs.
4. Unknown food/history questions, ambiguous questions and false premises produce uncertainty or correction, not fabricated facts.
5. Prompt injection in questions or source text cannot override evidence boundaries or trigger actions/data access.
6. Offline, unavailable/unsupported provider, timeout, budget limit, malformed response and stale practical data have tested truthful states.
7. Switching chapter or leaving the Guide aborts/invalidates requests; rapid retries cannot attach an old answer to a new question.
8. No coordinates, profile, Life Book content or unnecessary historical chat enter the request; no default durable question storage.
9. npm run typecheck and npm run test:app pass; fixture and live-model results are reported separately. Device checks are never inferred from browser tests.
10. Founder can ask, read, inspect sources and return to the story on the internal iPhone build. Goal completion requires actual acceptance; no artificial score or public-service claim.

## Goal registration

The app goal tool refused M6 creation because unfinished M4 still occupies the thread goal. M6 is registered in the repository and task deliverable, not falsely represented as an active app goal. Do not mark M4 complete to bypass that restriction. Current change is documentation only; build 11 remains current.

## Implementation start — 2026-11-13

Founder requests proceeding after M4 closure. The first source inventory and extractive fixture contract are implemented in guideEvidence.mjs and guideAnswer.mjs. Museum Over ons reviewed 2026-11-13; paraphrased evidence only, with canonical attribution. No diet/stove facts inferred. Seven tests enforce fixture facts, unknown questions, false premises, request minimization, context isolation and rejecting unsupported additions despite valid citations. Total 171 tests plus scenarios and typecheck pass. This is an explicit fixture-stage contract, not free-form model validation, a deployed endpoint or an iPhone answer flow. Provider integration must not silently relax this evidence gate.

## Connected fixture increment — 2026-11-13

### Internal iPhone proof authorized — 2026-11-13

Founder explicitly requests the iPhone version after approving the connected proof. Product Guardian identifies that existing preview builds have no Generator URL and would otherwise only show unavailable. Engineering applies the already permitted local editorial fallback: bundle the same three reviewed fixture answers, test exact parity against the server registry, and use them only when no service URL is configured. UI says the answer is local, labels it redactionele uitleg and uses Toon uitleg instead of promising transmission. Unknown questions remain unknown. A configured service is never silently replaced. No provider activation, public exposure, changed keys, session migration or live-AI claim. Add native scroll keyboard insets for the input. This releases the approved proof before provider evaluation; it does not complete M6.

Founder read the first proof, approved it and requested continuing. Product Guardian confirms phases 2–3 fit the existing single Guide. Engineering adds /v1/guide-answer behind existing admission and rate controls, bound to moddergat-five-places-v1:museum:v1. Fixture mode serves only reviewed extractive answers. A selected model is explicitly unavailable on this route until its answering capability is evaluated; no silent fixture substitution, budget bypass or new provider activation. Request/error bodies are not logged by the new route.

Client sends an explicit minimal envelope, checks context/version/source shape, uses a 20-second abortable timeout and rejects late results. Factual entailment remains the server's extractive responsibility. One museum disclosure contains three fill-only example prompts, explicit send/cancel, temporary question/answer, source disclosure and truthful unknown/unavailable states. Blur, chapter unmount and background cancel outstanding requests; no session or Life Book migration. The UI labels this as redactionele uitleg and explains that free AI answers are not connected.

Validation: typecheck, 182 counted tests (91 service, 13 affirmation, 78 Guide/client) plus existing content/memory scenarios pass; web export and whitespace checks pass. Real browser verifies prompt fill vs send, supported answer with canonical source, unknown food question, unavailable service preserving draft, chapter transition and reload/resume. Dark 390/320 px screenshots show wrapping without horizontal overflow. This does not establish native keyboard, VoiceOver, Dynamic Type, other-theme visual coverage or live-model quality. No new iPhone build; build 11 remains current. Next: configured-provider capability/evaluation, then internal device delivery on an explicitly configured supported connection.
