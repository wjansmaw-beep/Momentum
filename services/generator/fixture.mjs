const shared = (request, kind, title, promise, wonder, steps, extra = {}) => ({
  kind, title, promise, wonder,
  duration: Math.min(Math.max(10, request.context.availableMinutes - 8), extra.duration ?? 24),
  effort: extra.effort ?? 'Rustig', cta: extra.cta ?? 'Begin deze ervaring',
  why: ['Gemaakt vanuit je eigen woorden', `Past met buffer binnen ${request.context.availableMinutes} minuten`],
  prepareTitle: extra.prepareTitle ?? 'Maak ruimte om te beginnen', prepare: extra.prepare ?? ['Leg meldingen stil', 'Kies een plek die prettig en veilig voelt'],
  presenceMode: extra.presenceMode ?? 'guided', presenceTitle: extra.presenceTitle ?? title, presenceCue: extra.presenceCue ?? 'Alleen de volgende stap is nu nodig.',
  steps, memoryPrompt: extra.memoryPrompt ?? 'Welk detail wil je van dit moment onthouden?',
  keywords: extra.keywords ?? [kind, 'moment', 'beleven'], company: [request.context.company],
});

export function createFixtureDraft(request) {
  const requested = request.domains[0] ?? (/kook|eten|shake/i.test(request.intent) ? 'food' : /sport|beweeg|train/i.test(request.intent) ? 'movement' : /leer|begrijp/i.test(request.intent) ? 'learn' : 'restore');
  if (requested === 'food') return shared(request, 'food', 'Proef wat je al hebt', 'Bouw met één basis en twee contrasten een eenvoudige maaltijd die alleen vandaag zo ontstaat.', 'Door na iedere toevoeging te proeven wordt koken een kleine ontdekking in plaats van het volgen van een perfect recept.', [
    { title: 'Kies één basis', instruction: 'Kies zelf een graan, brood, yoghurt of groente die nog goed is. Controleer houdbaarheid, allergieën en wat bij jou past.', meta: null, seconds: null, insight: null },
    { title: 'Voeg één contrast toe', instruction: 'Kies iets fris, knapperigs of warms en voeg eerst een kleine hoeveelheid toe.', meta: 'Proef tussendoor', seconds: null, insight: { title: 'Contrast maakt eenvoud interessanter', body: 'Romig met fris of zacht met knapperig geeft een gerecht verschil zonder veel ingrediënten nodig te hebben.', topic: 'food' } },
    { title: 'Rond af na het proeven', instruction: 'Voeg één smaakmaker toe, proef opnieuw en stop zodra het compleet voelt.', meta: null, seconds: null, insight: null },
  ], { duration: 22, effort: 'Eenvoudig', prepare: ['Kies één basis die nog goed is', 'Kies maximaal twee aanvullingen', 'Controleer allergieën en geschiktheid zelf'], keywords: ['koken', 'eten', 'voorraad', 'proeven', 'food'] });
  if (requested === 'movement') return shared(request, 'movement', 'Een beheerste beweegreeks', 'Gebruik je vrije ruimte voor een complete sessie waarin controle belangrijker blijft dan tempo.', 'Dezelfde beweging voelt anders wanneer je bewust een lichtere of sterkere variant kiest.', [
    { title: 'Kom rustig in beweging', instruction: 'Loop op de plaats en maak kleine kniebuigingen. Begin alleen wanneer dit comfortabel voelt.', meta: '2 minuten', seconds: 60, insight: null },
    { title: 'Duwen en zitten', instruction: 'Wissel een schuine push-up tegen een muur af met rustig opstaan uit een stoel. Kies kleinere bewegingen wanneer dat beter voelt.', meta: '3 rustige rondes', seconds: null, insight: { title: 'De hoek verandert de belasting', body: 'Een hogere steun maakt een push-up lichter. Zo kun je de beweging aanpassen zonder het doel van controle te verliezen.', topic: 'movement' } },
    { title: 'Stabiel afronden', instruction: 'Draag je gewicht langzaam van links naar rechts, loop uit en stop direct wanneer pijn, duizeligheid of verlies van controle ontstaat.', meta: '3 minuten', seconds: 60, insight: null },
  ], { duration: 20, effort: 'Gemiddeld', prepare: ['Vrije vloer', 'Stevige stoel of muur', 'Water', 'Stop wanneer bewegen niet goed voelt'], keywords: ['sport', 'bewegen', 'workout', 'zonder materiaal', 'movement'] });
  if (requested === 'learn') return shared(request, 'learn', 'Ontdek het ritme om je heen', 'Leer één klein principe en herken het daarna zonder langer op je scherm te blijven.', 'Herhaling zit niet alleen in muziek: ramen, bomen, tegels en dagelijkse handelingen hebben allemaal een ritme.', [
    { title: 'Neem dit idee mee', instruction: 'Ritme ontstaat wanneer een vorm, afstand, klank of beweging herkenbaar terugkomt.', meta: null, seconds: null, insight: { title: 'Ritme ordent wat je ziet', body: 'Je brein merkt herhaling en afwijking snel op. Daardoor kan één onderbreking in een patroon juist extra zichtbaar worden.', topic: 'general' } },
    { title: 'Vind twee patronen', instruction: 'Zoek in je omgeving twee verschillende herhalingen en wijs concreet aan wat terugkomt.', meta: 'Telefoon weg', seconds: 180, insight: null },
    { title: 'Vind de afwijking', instruction: 'Kijk waar één onderdeel van het patroon verandert. Bewaar alleen wat je werkelijk verraste.', meta: null, seconds: null, insight: null },
  ], { duration: 14, effort: 'Rustig', keywords: ['leren', 'kijken', 'ritme', 'ontdekken', 'learn'] });
  if (requested === 'connect') return shared(request, 'connect', 'Drie keuzes samen', 'Geef iedereen één echte keuze en maak daar een kort gedeeld moment van.', 'De verschillen tussen jullie keuzes kunnen interessanter worden dan de opdracht zelf.', [
    { title: 'Kies om de beurt', instruction: 'De eerste persoon kiest een richting, plek of voorwerp; de volgende bepaalt wat jullie ermee doen.', meta: null, seconds: null, insight: null },
    { title: 'Maak één gezamenlijke regel', instruction: 'Bepaal samen één eenvoudige regel en laat daarna de telefoon uit beeld.', meta: 'Jullie bepalen wat telt', seconds: null, insight: null },
    { title: 'Eindig met één vondst', instruction: 'Iedereen noemt één detail dat zonder de ander waarschijnlijk niet was opgevallen.', meta: null, seconds: null, insight: null },
  ], { duration: 18, effort: 'Speels', keywords: ['samen', 'gezin', 'vriend', 'spel', 'connect'] });
  if (requested === 'outside' || requested === 'culture') return shared(request, requested, 'Lees je directe omgeving opnieuw', 'Gebruik één klein detail om een bekende of onbekende plek aandachtiger te beleven.', 'Materiaal, geluid, vorm en gebruik kunnen een plek een verhaal geven zonder dat je eerst feiten hoeft op te zoeken.', [
    { title: 'Kies één begrensd stukje omgeving', instruction: 'Blijf waar toegang duidelijk en veilig is. Kies één gevel, boom, plein, pad of voorwerp.', meta: null, seconds: null, insight: null },
    { title: 'Bekijk vier lagen', instruction: 'Let achtereenvolgens op materiaal, vorm, sporen van gebruik en geluid. Verzin geen historische verklaring.', meta: 'Telefoon weg', seconds: 180, insight: { title: 'Waarnemen vóór verklaren', body: 'Door eerst alleen zichtbare kenmerken te benoemen, blijft het verschil duidelijk tussen wat je ziet en wat je daarover vermoedt.', topic: requested === 'culture' ? 'culture' : 'place' } },
    { title: 'Neem één vraag mee', instruction: 'Formuleer één vraag die de plek opriep. Zoek het antwoord alleen later als je dat nog wilt.', meta: null, seconds: null, insight: null },
  ], { duration: 16, effort: 'Rustig', presenceMode: 'quiet', keywords: [requested, 'kijken', 'plek', 'ontdekken'] });
  return shared(request, 'restore', 'Een rustige overgang', 'Maak een duidelijke pauze tussen wat je deed en wat hierna komt.', 'Wanneer er even geen nieuwe input bijkomt, worden tempo en omgeving vaak vanzelf beter merkbaar.', [
    { title: 'Sluit het vorige af', instruction: 'Leg je scherm weg, sta op en laat je schouders rustig zakken zonder je adem te sturen.', meta: null, seconds: 60, insight: null },
    { title: 'Kijk verder dan je werkplek', instruction: 'Loop langzaam of blijf staan bij een raam. Noem stil drie concrete dingen die je ziet.', meta: 'Geen prestatie', seconds: 120, insight: null },
    { title: 'Kies bewust wat volgt', instruction: 'Ga pas terug wanneer je weet wat de eerstvolgende kleine handeling wordt.', meta: null, seconds: null, insight: null },
  ], { duration: 10, effort: 'Zeer licht', presenceMode: 'quiet', keywords: ['rust', 'pauze', 'herstel', 'restore'] });
}
