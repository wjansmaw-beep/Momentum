# Reference content review

Status: Implemented first editorial slice; device and visual review pending  
Version: 1.0 — 2026-11-08

## Evidence and editorial scope

2026-11-08 orientation: the museum's https://www.museummoddergat.nl/bezoekersinfo/ confirms Fiskerspaad 4–8a, 9142 VN Moddergat. Its posted 2026 season does not establish current opening after October; the app links visitors to the source rather than claiming current access. Commons Category:Fiskerspaad_4,_Moddergat supplies object coordinates 53.40494935, 6.075723561; category wikitext was retrieved directly through the Commons API. Rounded coordinates locate the building, not a precise entrance. The separate `visitPlace` contract carries name, address, provenance and caveat without invented route durations. Apple Maps receives the verified address. All three chapters share the museum visit; Lauwersmeer still invites the user to select a permitted observation place instead of claiming a verified route.

- Moddergat: https://www.museummoddergat.nl/over-ons/ — museum's own description, inspected 2026-11-08. Supports oldest house 1794, interior around 1850, De Aek exhibition and fishing equipment, and the 1883 disaster with 83 fishermen lost. Each chapter links this source. No unsupported menu, personal quotation or reconstruction is supplied.
- Lauwersmeer: https://www.staatsbosbeheer.nl/uit-in-de-natuur/locaties/lauwersmeer — managing organization's area description, inspected 2026-11-08. Supports the landscape types, former seabed and seasonal migration context. No current bird sighting is asserted.
- Tasks and observation cues are original editorial invitations, not source facts. Depth distinguishes fact from interpretation and explicitly identifies missing evidence.

## Reuse and current limitations

2026-11-08 imagery follow-up (not yet included in submitted build 2): the two reference packs now use actual historical location photos with in-app maker/date/license/source links. Moddergat: Bouwe Brouwer, 2007, CC BY-SA 3.0, Wikimedia file `Moddergat, 't Fiskershúske.jpg`; full imageinfo metadata inspected through the Commons API. Lauwersmeer: Gouwenaar, 2011, CC0, Wikimedia file `Lauwersmeer.jpg`; description and license inspected on Commons. No current conditions are implied. Files are loaded from their original Wikimedia URLs and cropped by the display; offline failure retains the neutral cover. Credits accompany Guide, reflection and the featured memory. The Moddergat photograph loaded and was visually inspected in the browser. Earlier neutral-cover notes below describe the previous slice.

Browser inspection also exposed outer-page scrolling clipping the Guide header. A web-only viewport constraint in the existing Frame fixed it; the full hero and persistent mode bar were then visually checked. Native layout is unchanged by that fix.

`referenceExperiences.ts` supplies three culture chapters and two nature chapters. `experienceRenderer.ts` maps both these and legacy steps into a finite union of story, depth, evidence and observation blocks. Discover consumes that contract; tasks retain the existing reversible session state. Editorial chapter IDs plus content versions preserve reorder identity and invalidate completions when content is revised.

Open reference experiences through Jij → privacy/settings section → Momentum Lab in a development or preview build. The preview profile explicitly enables the existing debug surface. This is a testing entry, not the final consumer discovery entry.

No guessed map coordinates, photo rights or travel estimates are supplied. Reference packs currently show the existing neutral cover fallback and explicitly disclose this in preparation. Checked public anchors, appropriate licensed imagery, audio, complete device checks and the final consumer entry are outstanding. The renderer is an initial typed adapter; validation of arbitrary external chapter payloads is not yet provided, and no remote model is permitted to supply executable UI.

## Validation

2026-11-08 browser smoke check: entered Moddergat via the Lab, started/resumed the Guide, opened Immerse, observed actual playback time increasing to 0:15/0:16, exercised rewind/replay and pause (0:02/0:16, play button restored), and expanded the matching transcript. This verifies browser playback UI, not physical-iPhone sound/interruption quality. Preparation initially mislabeled the reference as close to home with local weather; the referenceVisit flag now suppresses that departure/weather assumption and shows all editorial preparation notes. The corrected screen was re-opened and verified.

Full `test:app` passed after adding the reference packs: typecheck, generator, affirmation, catalog and memory scenarios, plus 11 guide tests. New tests cover differing chapter counts through the same renderer, source presence, quiet-depth behavior, legacy adaptation, unsafe URL omission and editorial version/reorder identity. These tests do not establish semantic accuracy automatically; the fact review above was performed against the original sources.
