# Momentum Copy Style Guide — the affirmation register

Version: 1.0 · Date: 2026-07-24 · Owner: product/copy
Reference implementation: `src/product/affirmation.ts` (the daily affirmation line is the tone benchmark for all consumer copy).
Mandate: ADR-065 (Experience Renewal), renewal 4 (copy renewal) and the phase-1 Voorpret restructure.

This guide is the reference for every future sentence on the consumer surface: Now, Today, Discover, Voorpret (Prepare), Presence, Remember, invites, and catalog content data. Machine and source language does not disappear — it moves to the "why / source" layer one tap deeper (for example *Waarom dit plan?* in Voorpret), where honesty stays available without polluting the main surface.

## The register

Consumer copy in Momentum sounds like a calm, observant companion who knows the place and the moment. The affirmation line defines it:

- **Concrete time, light and weather.** Name the daypart, the sky, the wind — never abstraction when an observation exists.
  - ✅ `Een heldere middag rond Dokkum — 14° met een zachte wind.`
  - ❌ `Actuele omstandigheden rond Dokkum · 14°C · wind 12 km/u · zicht 10 km · luchtkwaliteit 38`
- **Present tense.** The experience is happening now or about to happen; copy lives there with it.
  - ✅ `Dit moment wacht op je.`
- **One sensory detail per sentence.** Light, wind, sound, texture — one is enough; two is noise.
  - ✅ `De wind neemt af en het laatste licht valt precies over het water.`
- **End with a reason.** A suggestion closes on why it fits, not on what it is.
  - ✅ `Met 15 minuten marge blijft haast overbodig.`
- **Affirming and inviting, never guilty.** No obligation, no pressure, no quantified self (see the pressure-language ban in `affirmation.ts`).
- **Story before specs.** Logistics are told as scenes of the story (`Neem mee: een laagje — het waait op de dijk`), never as worksheets, step rails or checklists.

## Banned patterns on the consumer surface

1. **Algorithm scores as headline copy.** No confidence labels, match scores, counts-as-proof.
   - ❌ `MIJN BESTE VOORSTEL · VERTROUWEN HOOG` → ✅ `BESTE VOORSTEL VOOR JOU`
   - ❌ `LIVE VERRIJKT · 3` → ✅ `DE WERELD KIJKT MEE`
2. **Provider and source names as consumer text.** eBird, Open-Meteo, OpenStreetMap and friends belong in the why/source layer only.
   - ❌ `Je gaat: te voet · conservatieve voorinschatting · eBird + Open-Meteo` (main surface)
   - ✅ Same sentence, one tap deeper under *Waarom dit plan?*
3. **Algorithmic hedging.** No "waarschijnlijk", "probably", "maybe this fits".
   - ❌ `Dit past waarschijnlijk bij je moment. Jij beslist.` → ✅ `Dit past bij je moment — jij beslist.`
4. **Negative-first phrasing.** Never open with what something is *not*.
   - ❌ `Geen meting — alleen een zachte richting voor de voorstellen van nu. Overslaan kan altijd.`
   - ✅ `Een zachte richting voor de voorstellen van nu — sla gerust over.`
5. **Superlatives and hype.** No "beste app", "perfecte moment", no exclamation marketing. Premium is quiet.
6. **Meta-language about the app itself.** Validation mechanics, synchronization state, prototype framing, "the guide remains available", version requirements.
   - ❌ `Uitnodiging gedeeld · reactie nog niet gesynchroniseerd` → ✅ `Uitnodiging gedeeld`
   - ❌ `In deze prototypefase wordt deelname alleen op dit apparaat bijgehouden. Veilige synchronisatie volgt…` → ✅ `Je deelname blijft op dit apparaat. Er wordt niets gedeeld zonder jouw keuze.`
   - ❌ `Je huidige vraag wordt vertaald naar een complete capsule en daarna gecontroleerd.` → ✅ `Je woorden worden een compleet voorstel voor dit moment.`
   - ❌ `GEDEELDE EXPERIENCE CAPSULE` → ✅ `SAMEN BELEVEN`
7. **Engineering honesty as reassurance.** "Deze controle is alleen lokaal en blokkeert het starten niet" — if a control needs this sentence, the control is wrong (the readiness checkboxes were removed, not reworded).
8. **Didactic worksheet structure.** Numbered step rails with labels (`JE REIS / JE TRAINING …`), readiness checkboxes, multi-question intakes. At most one explicit, experience-centred question per preparation (`Met wie beleef je dit?`); everything else is a smart default that is visible and one tap adjustable.

## Style rules (checklist for every new sentence)

1. Concrete time / light / weather where the data exists.
2. Present tense.
3. Exactly one sensory detail.
4. Ends with a reason.
5. No superlatives, no pressure, no quantification of the person.
6. Positive construction first; honesty lives in the why/source layer.
7. Human names for things: `Voorpret`, `Samen beleven`, `De wereld kijkt mee` — not `capsule`, `confidence`, `sync`.
8. When copy names a person, use their name warmly and sparingly (affirmation benchmark).

## Good / bad from this phase-1 PR

| Surface | Before (❌) | After (✅) | Rule applied |
|---|---|---|---|
| Now header | `Dit past waarschijnlijk bij je moment. Jij beslist.` | `Dit past bij je moment — jij beslist.` | no hedging |
| Energy check-in | `Geen meting — alleen een zachte richting…` | `Een zachte richting voor de voorstellen van nu — sla gerust over.` | positive first |
| Pending suggestion | `Nieuwe blik beschikbaar … wacht rustig tot jij wilt wisselen.` | `Een nieuwe blik ligt klaar … wacht tot jij wilt kijken.` | human phrasing |
| Live world bar | `14°C · wind 12 km/u · zicht 10 km · luchtkwaliteit 38` | `Een heldere middag rond Dokkum — 14° met een zachte wind en ver zicht.` | one living sentence |
| Now hero | `LIVE VERRIJKT · 3` | `DE WERELD KIJKT MEE` | no counts as proof |
| Discover result | `MIJN BESTE VOORSTEL · VERTROUWEN HOOG` | `BESTE VOORSTEL VOOR JOU` | no scores as headline |
| Discover subtitle | `…Eindig gekozen, nooit een eindeloze stroom.` | `Blader rustig door wat deze plek vandaag te bieden heeft.` | place, not architecture |
| Invite card | `GEDEELDE EXPERIENCE CAPSULE` | `SAMEN BELEVEN` | human naming |
| Prepare hero | `WAT JE KUNT VERWACHTEN` + practical title | `DIT MOMENT WACHT OP JE` + the wonder sentence | expectation leads |
| Prepare plan | `TIJD EN INSPANNING — 45 minuten · rustig` | `Je vertrekt te voet richting … — 20 minuten heen, … terug.` | prose from real data |
| Prepare summary | `ZO GA JE` + `Gids & afstemming` | `ALLES STAAT KLAAR` + `Aanpassen` | smart defaults, one tap |
| Guide mechanics | `ZO BLIJFT DE GIDS BESCHIKBAAR` card | removed; composition honesty under *Waarom dit plan?* | why/source layer |
| Catalog (food) | `Jouw power-ochtendshake` | `Een heldere ochtendshake` | no hype, calm premium |
| Catalog (learn) | `Eén inzicht, direct toegepast` / `Momentum geeft je…` | `Zien wat je eerst niet zag` / `Een klein idee dat je meteen in de wereld om je heen herkent.` | sensory, no app-meta |
| Ranking reason | `sluit aan bij proefprofiel Ontdekker` | `sluit aan bij jouw voorkeuren` | no persona jargon |

## Where honesty lives

Banned-from-headline does not mean hidden. Each surface keeps a calm disclosure one tap away:

- **Voorpret → "Waarom dit plan?"** — live evidence with source names, estimate kind (`conservatieve voorinschatting`), source-window validity, routing capability, guide composition.
- **Now → "Waarom dit nu past"** — the decision reasons and the data-use note.
- **Presence → insight sources** — `Momentum natuurredactie · Bekijk bron`.

Rule of thumb: the main surface carries the experience; the layer below carries the proof.
