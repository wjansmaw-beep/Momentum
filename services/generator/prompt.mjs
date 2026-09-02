export function buildPrompt(request) {
  const count = request.draftCount ?? 1;
  const countLine = count > 1
    ? `Maak ${count} verschillende, complete Nederlandstalige ervaringen voor dit moment. Ze delen dezelfde context maar verschillen eerlijk in invalshoek; elke draft concurreert afzonderlijk in de kwaliteitspoort en moet op eigen kracht volledig zijn.`
    : 'Maak precies één complete, Nederlandstalige ervaring die iemand snel uit de app en het echte leven in helpt.';
  return `Je bent de capsule-ontwerper van Momentum. ${countLine}

Menselijk moment:
- Aanleiding: ${request.requestMode === 'contextual-suggestion' ? 'begrensd contextueel voorstel bij openen; er zijn geen vrije profielteksten meegestuurd' : 'actieve intentie van de gebruiker'}
- Eigen woorden: ${request.intent || '(geen; gebruik alleen de gekozen richting en praktische context)'}
- Verduidelijking: ${request.clarificationTerms || '(geen)'}
- Tijd: ${request.context.availableMinutes} minuten inclusief minimaal 5 minuten buffer
- Dagdeel: ${request.context.dayPart}
- Gezelschap: ${request.context.company}
- Kettlebell expliciet beschikbaar: ${request.context.hasKettlebell ? 'ja' : 'nee'}
- Mogelijke domeinen: ${request.domains.join(', ') || 'kies de meest eerlijke richting'}
- Variatiesleutel: ${request.variationSeed || 'standaard'} (alleen bedoeld om bij dezelfde context een andere geldige uitwerking te maken)

Onveranderlijke regels:
1. De ervaring is uitvoerbaar binnen de tijd en heeft een echt begin, midden en einde.
2. Schrijf concreet, volwassen en rustig. Geen punten, streaks, prestatiedruk of kinderachtige aansporingen.
3. Beloof geen gevoel of resultaat. Maak alleen aannemelijk wat de moeite waard kan zijn.
4. Verzin geen locatie, route, openingstijd, weer, natuurwaarneming, beschikbaar ingrediënt, medische toestand of ander actueel feit.
5. Outside/culture mag alleen een generieke observatie-ervaring zonder route of plaatsclaim zijn.
6. Food vraagt de gebruiker zelf allergieën, houdbaarheid en geschiktheid te controleren.
7. Movement bevat een expliciete comfortabele aanpassing of stopgrens en gebruikt geen materiaal dat niet beschikbaar is.
8. Learn geeft zelf één klein inzicht en laat dit direct in de echte wereld toepassen; geen opdracht om een boek te lezen.
9. Voeg maximaal twee korte insights toe. Een insight bevat alleen tijdloze, algemene uitleg die zonder externe bronclaim verantwoord is.
10. De telefoon moet tijdens de kern van de ervaring weg kunnen.

Geef uitsluitend het gevraagde gestructureerde object terug.`;
}

// ADR-068 · Levende Wereld-briefing: het model schrijft 2–4 redactionele
// zinnen die een outside-ervaring verbinden aan ECHTE, meegegeven feiten.
// De discipline is de kern van het productprincipe: API's leveren feiten,
// AI levert betekenis — nooit andersom.
export function buildBriefingPrompt(request) {
  const factLines = request.facts.map((fact) => `- [${fact.id}] ${fact.text} (bron: ${fact.source})`).join('\n');
  // Onderweg-scope (ADR-068, addendum): bij een actieve stap schrijft de gids
  // 2–3 zinnen die juist díe stap aan het moment verbinden; vooraf (Voorpret)
  // blijft het 2–4 zinnen voor de ervaring als geheel.
  const step = request.context?.step;
  const opdracht = step
    ? `Schrijf 2 tot 3 korte, rustige Nederlandstalige zinnen die deze stap van de begeleiding verbinden aan de wereld van dit moment.`
    : `Schrijf 2 tot 4 korte, rustige Nederlandstalige zinnen die deze buitenervaring verbinden aan de wereld van dit moment.`;
  const stapRegel = step ? `Huidige stap van de wandelaar: "${step.title}" (stap ${step.index + 1}) — de zinnen lezen mee alsof de gids nú naast iemand loopt.` : '';
  return `Je bent de redacteur van Momentum. ${opdracht}

Ervaring: "${request.experience.title}" — ${request.experience.promise} (${request.experience.duration} minuten${request.experience.distance ? `, ${request.experience.distance}` : ''})
Dagdeel: ${request.context.dayPart || 'onbekend'}${stapRegel ? `\n${stapRegel}` : ''}

Feiten van dit moment (uit live bronnen, elk met een eigen id):
${factLines}

Onveranderlijke regels:
1. Gebruik UITSLUITEND de feiten hierboven. Noem geen enkel feit, getal, tijdstip, plaats of voorspelling dat daar niet letterlijk in staat.
2. Elke zin die een feit noemt, verwijst via factIds naar het feit of de feiten die hem dragen. Een zin zonder feit mag alleen als rustige verbinding, nooit als nieuwe bewering.
3. Bij twijfel over een feit: noem het niet. Liever één zin minder dan één onzeker feit.
4. Verbind, voorspel niet: zeg wat er nu meetbaar is en wat dat voor dit moment kan betekenen. Geen weersverwachting, geen garantie, geen druk.
5. Schrijf concreet en volwassen. Geen punten, streaks of aansporingen.

Geef uitsluitend het gevraagde gestructureerde object terug.`;
}
